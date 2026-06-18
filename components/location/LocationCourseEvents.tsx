import Link from 'next/link'
import { formatCourseSessionLines } from '@/lib/usDate'
import type { CourseDTO } from '@/lib/types'
import { LOCATION_BTN_COMPACT } from '@/components/location/locationBrandStyles'

/** One published course from the backend — its own registration box. */
export function CourseEventBox({ course }: { course: CourseDTO }) {
  const whenLines = formatCourseSessionLines(course.sessionStarts, course.sessionEnds)
  return (
    <article className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm ring-1 ring-slate-200/90 sm:p-4">
      <h4 className="font-[family-name:var(--font-display)] text-base font-bold leading-snug text-slate-900 sm:text-lg">
        {course.title}
      </h4>
      <div className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-700">
        {whenLines.map((line, i) => (
          <p key={`${i}-${line}`} className="mb-0">
            {line}
          </p>
        ))}
      </div>
      {course.address ? (
        <p className="mt-1 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Location:</span> {course.address}
        </p>
      ) : null}
      <div className="mt-3 text-center sm:text-left">
        <Link href={`/classes/${course.id}/`} className={LOCATION_BTN_COMPACT}>
          Register Now
        </Link>
      </div>
    </article>
  )
}

export function CourseEventGroup({
  title,
  courses,
  emptyMessage,
  compact,
}: {
  title: string
  courses: CourseDTO[]
  emptyMessage: string
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-[#1f497d]/15 bg-white/80 p-3 sm:p-4'
          : 'rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4'
      }
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900 sm:text-xl">
        {title}
      </h3>
      <div className="mt-3 space-y-3">
        {courses.length > 0 ? (
          courses.map((c) => <CourseEventBox key={c.id} course={c} />)
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}

export function CourseEventList({
  courses,
  emptyMessage,
}: {
  courses: CourseDTO[]
  emptyMessage: string
}) {
  if (courses.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
        {emptyMessage}
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {courses.map((c) => (
        <CourseEventBox key={c.id} course={c} />
      ))}
    </div>
  )
}
