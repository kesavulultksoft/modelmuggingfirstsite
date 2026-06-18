'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CourseDTO } from '@/lib/types'
import { format } from 'date-fns'
import { US_DATE_DISPLAY } from '@/lib/usDate'

type Filter = 'all' | 'women' | 'men' | 'teens' | 'kids'

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All classes' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'teens', label: 'Teens' },
  { id: 'kids', label: 'Kids' },
]

/** Shown when the API returns no courses (or filter yields none). */
const DUMMY_COURSES: CourseDTO[] = [
  {
    id: '__demo_women_sf',
    slug: 'demo-women-sf',
    title: "Women's Basic Self Defense",
    locationLabel: 'San Francisco, CA',
    address: '',
    feeDisplay: '$395',
    sessionStarts: ['2025-08-19 09:00'],
    sessionEnds: ['2025-08-21 17:00'],
    graduationDisplay: '',
    description: 'Women basic weekend',
    instructorName: '',
    contactEmail: '',
    contactPhone: '',
    weekendLabel: 'Weekend',
    venueName: '',
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  },
  {
    id: '__demo_men_la',
    slug: 'demo-men-la',
    title: "Men's Basic",
    locationLabel: 'Los Angeles, CA',
    address: '',
    feeDisplay: '$395',
    sessionStarts: ['2025-09-06 09:00'],
    sessionEnds: ['2025-09-08 17:00'],
    graduationDisplay: '',
    description: 'Men basic',
    instructorName: '',
    contactEmail: '',
    contactPhone: '',
    weekendLabel: 'Weekend',
    venueName: '',
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  },
  {
    id: '__demo_teen_sd',
    slug: 'demo-teen-sd',
    title: 'Young Teens (12–15)',
    locationLabel: 'San Diego, CA',
    address: '',
    feeDisplay: '$275',
    sessionStarts: ['2025-08-24 10:00'],
    sessionEnds: ['2025-08-24 16:00'],
    graduationDisplay: '',
    description: 'Teen program',
    instructorName: '',
    contactEmail: '',
    contactPhone: '',
    weekendLabel: '1-day',
    venueName: '',
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  },
  {
    id: '__demo_kids_portland',
    slug: 'demo-kids-portland',
    title: 'Kids Safety & Awareness',
    locationLabel: 'Portland, OR',
    address: '',
    feeDisplay: '$195',
    sessionStarts: ['2025-09-14 09:00'],
    sessionEnds: ['2025-09-14 15:00'],
    graduationDisplay: '',
    description: 'Children kids class',
    instructorName: '',
    contactEmail: '',
    contactPhone: '',
    weekendLabel: 'Saturday',
    venueName: '',
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  },
  {
    id: '__demo_women_denver',
    slug: 'demo-women-denver',
    title: "Women's Basic — Full weekend",
    locationLabel: 'Denver, CO',
    address: '',
    feeDisplay: '$395',
    sessionStarts: ['2025-10-03 09:00'],
    sessionEnds: ['2025-10-05 17:00'],
    graduationDisplay: '',
    description: 'Women only basic',
    instructorName: '',
    contactEmail: '',
    contactPhone: '',
    weekendLabel: 'Weekend',
    venueName: '',
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  },
]

function isDemoRow(id: string) {
  return id.startsWith('__demo_')
}

function matchesFilter(c: CourseDTO, f: Filter): boolean {
  if (f === 'all') return true
  const t = (c.title + ' ' + (c.description || '')).toLowerCase()
  if (f === 'women') return /women|woman|womens|ladies/i.test(t) && !/men|teen|child|kid/i.test(t)
  if (f === 'men') return /men|man|mens|male/i.test(t)
  if (f === 'teens') return /teen|young teen|12|15/i.test(t)
  if (f === 'kids') return /child|kid|children/i.test(t)
  return true
}

function rowDate(c: CourseDTO): string {
  const s = c.sessionStarts[0]
  if (!s) return 'TBA'
  try {
    const d = new Date(s.replace(' ', 'T'))
    if (!Number.isNaN(d.getTime())) {
      return format(d, US_DATE_DISPLAY).toUpperCase()
    }
  } catch {
    /* fall through */
  }
  const short = s.slice(0, 16).replace(/\s+/g, ' ')
  return short.toUpperCase()
}

export default function HomeSchedulePreview({
  courses,
  embedded = false,
}: {
  courses: CourseDTO[]
  embedded?: boolean
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(() => {
    const fromApi = courses.filter((c) => matchesFilter(c, filter))
    if (fromApi.length > 0) return fromApi.slice(0, 8)
    const fromDummy = DUMMY_COURSES.filter((c) => matchesFilter(c, filter))
    return fromDummy.length > 0 ? fromDummy : DUMMY_COURSES.slice(0, 6)
  }, [courses, filter])

  const showingSample = courses.length === 0 || rows.every((c) => isDemoRow(c.id))

  const outer = embedded ? 'div' : 'section'
  const Outer = outer

  return (
    <Outer className={embedded ? '' : 'bg-white py-16 sm:py-24'}>
      <div
        className={
          embedded ? 'w-full' : 'site-page-gutter-x mx-auto w-full max-w-7xl'
        }
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.22em] ${embedded ? 'text-[#1f497d]' : 'text-[#00d4aa]'}`}
        >
          Class schedule
        </p>
        <h2
          className={`mt-3 font-[family-name:var(--font-display)] font-bold text-[#0f172a] ${embedded ? 'text-2xl sm:text-3xl' : 'text-[clamp(1.75rem,4vw,2.75rem)]'}`}
        >
          Find a class near you
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Filter by audience type. Open a row for full details and enrollment.
        </p>
        {showingSample && (
          <p className="mt-3 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span className="font-semibold">Sample dates</span>
            <span className="mx-2 text-amber-700">·</span>
            <span className="text-amber-800">
              Live listings appear here when your schedule API is connected.
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                filter === id
                  ? embedded
                    ? 'bg-[#1f497d] text-white shadow-md'
                    : 'bg-[#0f172a] text-white shadow-md'
                  : 'border border-slate-200 bg-slate-50 text-[#0f172a] hover:border-[#1da1f2]/50 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <>
          <div className="mt-8 hidden overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">When</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4 text-right">Tuition</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const demo = isDemoRow(c.id)
                  const href = demo ? '/schedule' : `/classes/${c.id}`
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-sky-50/50"
                    >
                      <td className="px-6 py-5 font-semibold text-[#0f172a] whitespace-nowrap">
                        {rowDate(c)}
                      </td>
                      <td className="px-6 py-5 text-slate-600">{c.locationLabel || '—'}</td>
                      <td className="max-w-[min(280px,28vw)] px-6 py-5 text-slate-700" title={c.title}>
                        <span className="line-clamp-2 font-medium leading-snug">{c.title}</span>
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          href={href}
                          className="inline-flex min-h-[40px] items-center rounded-xl bg-[#ffa500] px-5 py-2 text-xs font-bold text-[#0f172a] shadow-sm transition hover:brightness-105"
                        >
                          {demo ? 'View schedule' : 'Enroll'}
                        </Link>
                      </td>
                      <td className="px-6 py-5 text-right text-base font-bold text-[#0f172a]">
                        {c.feeDisplay || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:hidden">
            {rows.map((c) => {
              const demo = isDemoRow(c.id)
              const href = demo ? '/schedule' : `/classes/${c.id}`
              return (
                <Link
                  key={c.id}
                  href={href}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition active:bg-sky-50/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase ${embedded ? 'text-[#1f497d]' : 'text-[#00d4aa]'}`}
                    >
                      {rowDate(c)}
                    </span>
                    <span className="text-base font-bold text-[#0f172a]">{c.feeDisplay || '—'}</span>
                  </div>
                  <p className="text-lg font-semibold leading-snug text-[#0f172a]">{c.title}</p>
                  <p className="text-base text-slate-600">{c.locationLabel}</p>
                  <span className="mt-1 inline-flex w-fit min-h-[44px] items-center rounded-xl bg-[#ffa500] px-5 py-2.5 text-sm font-bold text-[#0f172a]">
                    {demo ? 'View schedule' : 'Enroll'}
                  </span>
                </Link>
              )
            })}
          </div>
        </>

        <div className="mt-10 text-center">
          <Link
            href="/schedule"
            className="text-base font-bold text-[#1f497d] underline decoration-2 underline-offset-4 hover:text-[#1da1f2]"
          >
            View complete schedule →
          </Link>
        </div>
      </div>
    </Outer>
  )
}
