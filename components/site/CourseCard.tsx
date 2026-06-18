import Link from 'next/link'
import type { CourseDTO } from '@/lib/types'
import { formatCourseWhenLabel } from '@/lib/usDate'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

export default function CourseCard({ course, compact }: { course: CourseDTO; compact?: boolean }) {
  const when = formatCourseWhenLabel(course.sessionStarts[0])
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-teal-300/40 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] ${
        compact ? 'p-5' : 'p-6'
      }`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00d4aa] via-teal-500 to-[#0f172a] opacity-90 transition group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {when}
        </span>
        {course.feeDisplay && (
          <span className="text-sm font-black tracking-tight text-slate-900">{course.feeDisplay}</span>
        )}
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold leading-snug text-slate-900 transition group-hover:text-teal-700">
        {course.title}
      </h3>
      <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        <span>
          {course.locationLabel}
          {course.address ? ` · ${course.address}` : ''}
        </span>
      </p>
      {!compact && course.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-500">{course.description}</p>
      )}
      <div className="mt-auto pt-6">
        <Link
          href={`/classes/${course.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition group-hover:gap-3 hover:text-teal-900"
        >
          View details &amp; register
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
