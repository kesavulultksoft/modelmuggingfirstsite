'use client'

import { useMemo, useState } from 'react'
import type { CourseDTO } from '@/lib/types'
import CourseCard from '@/components/site/CourseCard'

export default function ScheduleClient({ initialCourses }: { initialCourses: CourseDTO[] }) {
  const locations = useMemo(() => {
    const s = new Set<string>()
    initialCourses.forEach((c) => {
      if (c.locationLabel) s.add(c.locationLabel)
    })
    return ['All locations', ...Array.from(s).sort()]
  }, [initialCourses])

  const [loc, setLoc] = useState('All locations')

  const filtered = useMemo(() => {
    if (loc === 'All locations') return initialCourses
    return initialCourses.filter((c) => c.locationLabel === loc)
  }, [initialCourses, loc])

  return (
    <div className="w-full pt-2">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800 sm:flex-row sm:items-center">
          <span className="shrink-0">Location</span>
          <select
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            className="max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm font-medium text-slate-500">
          {filtered.length} class{filtered.length !== 1 ? 'es' : ''}
        </p>
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-teal-200/60 bg-teal-50/30 py-16 text-center text-slate-600">
          No classes for this filter. Try another city.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
