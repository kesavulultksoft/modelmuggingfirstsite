'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchInstructorVacancyCourses, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { formatCourseSessionsCell } from '@/lib/courseTableDisplay'
import { isInstructorAssignedToCourseRow } from '@/lib/instructorCourseAssignment'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { MapPin, Search, Users } from 'lucide-react'

/** Hex id for routing — same document may expose courseId, id, or _id ($oid). */
function courseDocumentHex(r: Record<string, unknown>) {
  const cand = r.courseId ?? r.id ?? r._id
  if (typeof cand === 'string' && cand) return cand
  if (cand && typeof cand === 'object' && cand !== null && '$oid' in cand) {
    return String((cand as { $oid: string }).$oid)
  }
  return ''
}

export default function InstructorVacanciesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/vacancies')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    setErr('')
    fetchInstructorVacancyCourses()
      .then((d) => setRows(legacyAsObjectArray(d)))
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s))
  }, [rows, q])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Vacancy courses"
        subtitle="Classes that need additional instructors (short-staffed). Same feed as admin vacancy awareness — pick up opportunities that fit your region."
      />

      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0b2a3f] to-[#134e4a] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200/90">Open roles</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{filtered.length}</p>
            <p className="mt-2 max-w-xl text-sm text-teal-50/90">
              Review city, schedule, and roster pressure. Use course management to see your own assignments separately.
            </p>
          </div>
          <Link
            href="/portal/instructor/trainings"
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            My course management
          </Link>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm"
            placeholder="Search city, course, notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <p className="text-xs text-slate-500">{rows.length} total · {filtered.length} shown</p>
      </div>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-800">No vacancy courses right now</p>
          <p className="mt-2 text-sm text-slate-600">
            When admin marks a class as needing instructors, it will appear here. You can still browse all trainings from{' '}
            <Link href="/portal/instructor/trainings" className="font-semibold text-[#0d9488] hover:underline">
              Course management
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => {
            const id = courseDocumentHex(r) || String(i)
            const city = String(r.locationName || r.city || r.venueName || 'Location TBD')
            const title = String(r.templateId || r.courseName || r.name || 'Open class')
            const sched = formatCourseSessionsCell(r)
            const min = r.minStudentCount != null ? String(r.minStudentCount) : '—'
            const short = String(r.shortInstructor || r.shortStaffed || '').trim()
            const needMale = String(r.shortInstructorMale ?? '').trim()
            const needFemale = String(r.shortInstructorFemale ?? '').trim()
            const assignedHere = me ? isInstructorAssignedToCourseRow(me, r) : false
            return (
              <li
                key={id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0d9488]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488]">Vacancy</p>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-900">
                    Needs staff
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {city}
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed whitespace-pre-line text-slate-700">
                  {sched}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <dt className="font-semibold text-slate-500">Min students</dt>
                    <dd className="font-medium text-slate-900">{min}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Short staffed</dt>
                    <dd className="font-medium text-slate-900">{short || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Male instructors needed</dt>
                    <dd className="font-medium text-slate-900">{needMale || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Female instructors needed</dt>
                    <dd className="font-medium text-slate-900">{needFemale || '—'}</dd>
                  </div>
                </dl>
                {id && assignedHere && (
                  <Link
                    href={`/portal/instructor/courses/${encodeURIComponent(id)}`}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0f172a] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#0d9488]"
                  >
                    View course workspace
                  </Link>
                )}
                {id && !assignedHere && (
                  <p className="mt-4 text-xs text-slate-500">
                    You are not listed on this class yet — open{' '}
                    <Link href="/portal/instructor/trainings" className="font-semibold text-[#0d9488] hover:underline">
                      course management
                    </Link>{' '}
                    when you are assigned.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
