'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { fetchInstructorCourses, fetchInstructorCrmView, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { formatCourseSessionsCell } from '@/lib/courseTableDisplay'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { CalendarDays } from 'lucide-react'

type CalEvent = { date: Date; label: string; href?: string; kind: 'course' | 'schedule' }

function parseDateLoose(v: unknown): Date | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function InstructorCalendarPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [scheduleRows, setScheduleRows] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/calendar')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchInstructorCourses()
      .then((raw) => setCourses(Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []))
      .catch(() => setCourses([]))
    fetchInstructorCrmView('training-schedule')
      .then((d) => setScheduleRows(legacyAsObjectArray(d)))
      .catch(() => setScheduleRows([]))
  }, [me])

  const courseId = (c: Record<string, unknown>) => {
    const id = c.id ?? c._id
    if (typeof id === 'string') return id
    if (id && typeof id === 'object' && id !== null && '$oid' in id) return String((id as { $oid: string }).$oid)
    return ''
  }

  const events = useMemo(() => {
    const out: CalEvent[] = []
    for (const c of courses) {
      const id = courseId(c)
      const title = String(c.templateId || c.courseName || c.locationName || 'Course')
      const starts = Array.isArray(c.sessionStarts) ? c.sessionStarts : []
      for (const s of starts) {
        const d = parseDateLoose(s)
        if (d) {
          out.push({
            date: d,
            label: title,
            href: id ? `/portal/instructor/courses/${encodeURIComponent(id)}` : undefined,
            kind: 'course',
          })
        }
      }
    }
    for (const r of scheduleRows) {
      const d =
        parseDateLoose(r.startDate) ||
        parseDateLoose(r.start) ||
        parseDateLoose(r.date) ||
        parseDateLoose(r.sessionDate) ||
        parseDateLoose(r.scheduleDate)
      if (d) {
        out.push({
          date: d,
          label: String(r.title || r.eventTitle || r.className || r.trainingName || r.name || 'Scheduled item'),
          kind: 'schedule',
        })
      }
    }
    out.sort((a, b) => a.date.getTime() - b.date.getTime())
    return out
  }, [courses, scheduleRows])

  const datesWithTraining = useMemo(() => {
    const seen = new Set<string>()
    const dates: Date[] = []
    for (const e of events) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`
      if (seen.has(key)) continue
      seen.add(key)
      dates.push(e.date)
    }
    return dates
  }, [events])

  const [month, setMonth] = useState<Date>(() => new Date())

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Training calendar"
        subtitle="Month view highlights days with sessions; details list every item below. Matches legacy training schedule + assigned courses."
      />

      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <CalendarDays className="h-5 w-5 text-[#0d9488]" aria-hidden />
            <h2 className="text-lg font-bold">Month at a glance</h2>
          </div>
          <p className="mb-4 text-xs text-slate-600">
            Days with a teal highlight have at least one session or schedule row.
          </p>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            modifiers={{ training: datesWithTraining }}
            modifiersClassNames={{
              training:
                '!bg-teal-100 !text-teal-900 font-bold ring-2 ring-teal-400/50 hover:!bg-teal-200',
            }}
            className="rounded-xl border border-slate-100"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upcoming items</h2>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No dated sessions found on your assignments yet.</p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {events.slice(0, 80).map((e, i) => (
                <li
                  key={`${e.kind}-${e.date.toISOString()}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {e.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-slate-700">{e.label}</span>
                  {e.href ? (
                    <Link href={e.href} className="text-xs font-bold text-[#0d9488] hover:underline">
                      Workspace
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Assigned courses</h2>
          <Link
            href="/portal/instructor/trainings"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            Open course management
          </Link>
        </div>
        {courses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No assigned courses found.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {courses.slice(0, 40).map((c, i) => {
              const id = courseId(c) || String(i)
              const title = String(c.templateId || c.courseName || c.locationName || 'Course')
              const sched = formatCourseSessionsCell(c)
              return (
                <li
                  key={id}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{title}</p>
                      <p className="text-slate-600">{String(c.locationName || c.venueName || '')}</p>
                    </div>
                    {id && (
                      <Link
                        href={`/portal/instructor/courses/${encodeURIComponent(id)}`}
                        className="shrink-0 text-sm font-semibold text-[#0d9488] hover:underline"
                      >
                        Workspace
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">{sched}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Training schedule (legacy rows)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Rows from InstrTrainingSchedule / mm_training_schedules for your portal user.
        </p>
        {scheduleRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No dedicated schedule rows for your user id.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {scheduleRows.map((r, i) => (
              <li
                key={String(r._id || r.id || i)}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-slate-800"
              >
                <p className="font-semibold text-slate-900">
                  {String(r.title || r.eventTitle || r.className || r.trainingName || r.name || 'Scheduled item')}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {String(r.startDate || r.start || r.date || r.sessionDate || r.scheduleDate || '—')}
                  {r.endDate || r.end ? ` → ${String(r.endDate || r.end)}` : ''}
                </p>
                {r.location || r.venue ? (
                  <p className="mt-1 text-xs text-slate-500">{String(r.location || r.venue)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
