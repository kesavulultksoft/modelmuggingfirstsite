'use client'

import { formatCourseSessionLines, formatSessionTimestamp } from '@/lib/usDate'
import type { StudentEnrollmentView } from '@/lib/portalApi'
import type { CourseDTO } from '@/lib/types'

/** Fields shared by public course DTO and portal enrollment view. */
export type StudentCourseLike = Pick<
  CourseDTO,
  | 'title'
  | 'locationLabel'
  | 'venueName'
  | 'address'
  | 'feeDisplay'
  | 'sessionStarts'
  | 'sessionEnds'
  | 'graduationDisplay'
  | 'instructorName'
  | 'contactEmail'
  | 'contactPhone'
  | 'weekendLabel'
  | 'directions'
  | 'parkingInfo'
  | 'lunchInfo'
> & {
  tuitionPaidDisplay?: string
  attendeeCount?: number
}

export function courseLikeFromEnrollment(e: StudentEnrollmentView): StudentCourseLike {
  return {
    title: e.courseTitle || '',
    locationLabel: e.locationLabel || '',
    venueName: e.venueName || '',
    address: e.address || '',
    feeDisplay: e.feeDisplay || '',
    sessionStarts: e.sessionStarts || [],
    sessionEnds: e.sessionEnds || [],
    graduationDisplay: e.graduationDisplay || '',
    instructorName: e.instructorName || '',
    contactEmail: e.contactEmail || '',
    contactPhone: e.contactPhone || '',
    weekendLabel: e.weekendLabel || '',
    directions: e.directions || '',
    parkingInfo: e.parkingInfo || '',
    lunchInfo: e.lunchInfo || '',
    tuitionPaidDisplay: e.tuitionPaidDisplay,
    attendeeCount: e.attendeeCount,
  }
}

export function courseDisplayTitle(c: StudentCourseLike): string {
  return c.title || c.venueName || c.locationLabel || 'Class'
}

type Props = {
  course: StudentCourseLike
  compact?: boolean
  className?: string
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <p className="text-xs leading-relaxed text-slate-600">
      <span className="font-semibold text-slate-800">{label}:</span> {value}
    </p>
  )
}

export default function StudentCourseDetailBlock({ course, compact = false, className = '' }: Props) {
  const sessionLines = formatCourseSessionLines(course.sessionStarts, course.sessionEnds)
  const graduation = course.graduationDisplay?.trim()
    ? formatSessionTimestamp(course.graduationDisplay)
    : ''
  const locationParts = [course.locationLabel, course.venueName].filter(Boolean).join(' · ')

  return (
    <div className={`space-y-1.5 ${className}`}>
      {!compact ? (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Schedule</p>
          {sessionLines.map((line, i) => (
            <p key={`${i}-${line}`} className="text-xs leading-relaxed text-slate-700">
              {line}
            </p>
          ))}
        </div>
      ) : (
        sessionLines.slice(0, 2).map((line, i) => (
          <p key={`${i}-${line}`} className="text-xs text-slate-500">
            {line}
          </p>
        ))
      )}

      {graduation && graduation !== '—' ? (
        <DetailRow label="Graduation" value={graduation} />
      ) : null}

      {locationParts ? <DetailRow label="Location" value={locationParts} /> : null}
      {course.address ? <DetailRow label="Address" value={course.address} /> : null}
      {course.tuitionPaidDisplay ? (
        <p className="text-xs font-semibold text-[#0f766e]">
          Paid: {course.tuitionPaidDisplay}
          {course.attendeeCount != null && course.attendeeCount > 1
            ? ` (${course.attendeeCount} attendees)`
            : ''}
        </p>
      ) : course.feeDisplay ? (
        <p className="text-xs font-semibold text-[#0f766e]">Tuition: {course.feeDisplay}</p>
      ) : null}

      {!compact && course.weekendLabel ? (
        <DetailRow label="Format" value={course.weekendLabel} />
      ) : null}
      {!compact && course.instructorName ? (
        <DetailRow label="Instructor" value={course.instructorName} />
      ) : null}
      {!compact && course.contactPhone ? (
        <DetailRow label="Course phone" value={course.contactPhone} />
      ) : null}
      {!compact && course.directions ? (
        <DetailRow label="Directions" value={course.directions} />
      ) : null}
      {!compact && course.parkingInfo ? (
        <DetailRow label="Parking" value={course.parkingInfo} />
      ) : null}
      {!compact && course.lunchInfo ? (
        <DetailRow label="Lunch" value={course.lunchInfo} />
      ) : null}
    </div>
  )
}
