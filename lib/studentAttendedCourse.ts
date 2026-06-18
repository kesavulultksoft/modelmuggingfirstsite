import {
  courseDisplayTitle,
  type StudentCourseLike,
} from '@/components/portal/StudentCourseDetailBlock'

/** Map courses-attended API row → detail block fields. */
export function attendedRowToCourseLike(row: Record<string, unknown>): StudentCourseLike {
  const sessionStarts = Array.isArray(row.sessionStarts)
    ? (row.sessionStarts as unknown[]).map(String)
    : []
  const sessionEnds = Array.isArray(row.sessionEnds) ? (row.sessionEnds as unknown[]).map(String) : []
  return {
    title: String(row.title || row.templateId || row.courseType || ''),
    locationLabel: String(row.locationName || row.classLocation || ''),
    venueName: String(row.venueName || ''),
    address: String(row.address || ''),
    feeDisplay: String(row.feeDisplay || ''),
    sessionStarts,
    sessionEnds,
    graduationDisplay: String(row.graduationDisplay || ''),
    instructorName: String(row.instructorName || ''),
    contactEmail: '',
    contactPhone: '',
    weekendLabel: String(row.weekendLabel || ''),
    directions: '',
    parkingInfo: '',
    lunchInfo: '',
  }
}

export function attendedCourseTitle(row: Record<string, unknown>): string {
  return courseDisplayTitle(attendedRowToCourseLike(row))
}
