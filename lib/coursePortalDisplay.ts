import { courseDisplayName } from '@/lib/courseTableDisplay'
import { formatCourseSessionLines, formatCourseWhenLabel } from '@/lib/usDate'

/** Venue / class address for cards and headers. */
export function formatCourseAddress(c: Record<string, unknown>): string {
  const candidates = [
    c.venueAddress,
    c.address,
    c.classLocation,
    c.venueName,
    c.locationName,
  ]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
  const unique: string[] = []
  for (const p of candidates) {
    if (!unique.some((u) => u.toLowerCase() === p.toLowerCase())) unique.push(p)
  }
  return unique.join(' · ') || 'Address TBD'
}

function firstSessionStart(c: Record<string, unknown>): string | undefined {
  const starts = Array.isArray(c.sessionStarts) ? (c.sessionStarts as unknown[]).map(String) : []
  return starts.find((s) => s.trim())?.trim()
}

/** Dropdown label: course name · location · date/time. */
export function formatCoursePickerLabel(c: Record<string, unknown>): string {
  const name = courseDisplayName(c)
  const loc = String(c.locationName || c.venueName || '').trim()
  const when = formatCourseWhenLabel(firstSessionStart(c))
  const parts: string[] = [name]
  if (loc && loc.toLowerCase() !== name.toLowerCase()) parts.push(loc)
  if (when && when !== 'Dates TBA') parts.push(when)
  return parts.join(' · ')
}

/** Graduation line from course field or last session end (Pacific). */
export function formatGraduationLine(c: Record<string, unknown>): string {
  const explicit = String(c.graduationDisplay || c.courseGraduationDate || '').trim()
  if (explicit) return explicit
  const ends = Array.isArray(c.sessionEnds) ? (c.sessionEnds as unknown[]).map(String) : []
  const last = [...ends].reverse().find((s) => s.trim())
  if (!last) return ''
  const lines = formatCourseSessionLines([], [last])
  return lines[0] && lines[0] !== 'Dates TBA' ? lines[0] : last
}

export function isCourseCompleted(c: Record<string, unknown> | null | undefined): boolean {
  if (!c) return false
  const s = String(c.status || '').trim().toLowerCase()
  return s.includes('complet') || s === 'past'
}

export function isCourseCancelled(c: Record<string, unknown> | null | undefined): boolean {
  if (!c) return false
  return String(c.status || '').trim().toLowerCase().includes('cancel')
}

/** Matches instructor trainings tabs: upcoming vs past vs cancelled. */
export function instructorCourseBucket(
  c: Record<string, unknown> | null | undefined,
): 'upcoming' | 'completed' | 'cancelled' {
  if (!c) return 'upcoming'
  const s = String(c.status || 'Pending').trim().toLowerCase()
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complet') || s === 'past') return 'completed'
  return 'upcoming'
}

export function isInstructorUpcomingCourse(c: Record<string, unknown> | null | undefined): boolean {
  return instructorCourseBucket(c) === 'upcoming'
}

export function filterInstructorUpcomingCourses(courses: Record<string, unknown>[]): Record<string, unknown>[] {
  return courses.filter((c) => isInstructorUpcomingCourse(c))
}

export function courseIdFromRow(c: Record<string, unknown>, fallbackIndex = 0): string {
  const raw = c.id
  if (typeof raw === 'string' && raw) return raw
  if (raw && typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String((raw as { $oid: string }).$oid)
  }
  if (c._id != null) return String(c._id)
  return String(fallbackIndex)
}
