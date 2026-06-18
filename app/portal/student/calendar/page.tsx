'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { fetchMe, fetchStudentCalendarEvents, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatSessionListValue, formatUsDate } from '@/lib/usDate'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { CalendarDays } from 'lucide-react'

type CalEvent = {
  date: Date
  title: string
  status: string
  location: string
  address: string
  sessionStart: unknown
  sessionEnd: unknown
  graduationDisplay: string
}

function parseDateLoose(v: unknown): Date | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function StudentCalendarPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [month, setMonth] = useState<Date>(() => new Date())

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/calendar')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchStudentCalendarEvents()
      .then((e) => setEvents(legacyAsObjectArray(e)))
      .catch(() => {
        setLoadErr('Could not load schedule')
        setEvents([])
      })
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const calendarEvents: CalEvent[] = events
    .map((en, i) => {
      const date =
        parseDateLoose(Array.isArray(en.sessionStarts) ? en.sessionStarts[0] : null) ||
        parseDateLoose(en.startDate) ||
        parseDateLoose(en.enrolledAt)
      if (!date) return null
      return {
        date,
        title: String(en.title || en.courseId || `Course ${i}`),
        status: String(en.status || '—'),
        location: [en.locationName, en.venueName].filter(Boolean).join(' · '),
        address: en.address ? String(en.address) : '',
        sessionStart: en.sessionStarts,
        sessionEnd: en.sessionEnds,
        graduationDisplay: String(en.graduationDisplay || ''),
      }
    })
    .filter((e): e is CalEvent => Boolean(e))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const datesWithSessions = Array.from(
    new Map(
      calendarEvents.map((e) => [
        `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`,
        e.date,
      ])
    ).values()
  )

  return (
    <>
      <PortalPageHeader
        title="Calendar"
        subtitle="Month view plus detailed schedule for your enrolled classes."
      />
      {loadErr && <p className="mb-4 text-sm text-amber-700">{loadErr}</p>}
      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <CalendarDays className="h-5 w-5 text-[#0d9488]" aria-hidden />
            <h2 className="text-lg font-bold">Month at a glance</h2>
          </div>
          <p className="mb-4 text-xs text-slate-600">
            Teal-highlighted days have one or more class sessions.
          </p>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            modifiers={{ sessions: datesWithSessions }}
            modifiersClassNames={{
              sessions: '!bg-teal-100 !text-teal-900 font-bold ring-2 ring-teal-400/50 hover:!bg-teal-200',
            }}
            className="rounded-xl border border-slate-100"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upcoming classes</h2>
          {calendarEvents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No enrollments yet.{' '}
              <Link href="/portal/student/courses" className="font-semibold text-[#0d9488] hover:underline">
                Browse open classes
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {calendarEvents.slice(0, 80).map((en, i) => (
                <li
                  key={`${en.title}-${en.date.toISOString()}-${i}`}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {en.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {en.title}
                  </p>
                  <p className="mt-1 text-slate-700">
                    Status: <span className="font-medium">{en.status}</span>
                  </p>
                  {(en.location || en.address) && (
                    <p className="mt-1 text-slate-700">
                      {en.location}
                      {en.address ? (
                        <>
                          {en.location ? <br /> : null}
                          {en.address}
                        </>
                      ) : null}
                    </p>
                  )}
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-800">Session start</span>
                      <br />
                      {formatSessionListValue(en.sessionStart)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Session end</span>
                      <br />
                      {formatSessionListValue(en.sessionEnd)}
                    </p>
                  </div>
                  {en.graduationDisplay ? (
                    <p className="mt-1 text-xs text-slate-600">Graduation: {en.graduationDisplay}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {events.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">All enrollment schedule rows</h2>
          <ul className="mt-4 space-y-3">
            {events.map((en, i) => (
              <li
                key={String(en.enrollmentId || en.courseId || i)}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{String(en.title || en.courseId || `Course ${i}`)}</p>
                <p className="mt-1 text-slate-600">
                  Enrolled:{' '}
                  {(() => {
                    const d = new Date(String(en.enrolledAt || ''))
                    return Number.isNaN(d.getTime()) ? String(en.enrolledAt || '—').slice(0, 10) : formatUsDate(d)
                  })()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
