import type { InstructorOption } from '@/lib/adminCourseFormModel'
import { formatUsDateTime, formatUsTime12 } from '@/lib/usDate'

export type { InstructorOption }

/** Same display name rule as admin course table. */
export function courseDisplayName(c: Record<string, unknown>): string {
  return String(c.templateId || c.courseName || c.locationName || 'Course')
}

/**
 * One line per session: MM/dd/yyyy h:mm a → end time (same as admin `formatCourseSessionsCell`).
 */
export function formatCourseSessionsCell(c: Record<string, unknown>): string {
  const starts = Array.isArray(c.sessionStarts) ? (c.sessionStarts as unknown[]).map(String) : []
  const ends = Array.isArray(c.sessionEnds) ? (c.sessionEnds as unknown[]).map(String) : []
  if (starts.length === 0) return '—'
  const lines: string[] = []
  const n = Math.max(starts.length, ends.length)
  for (let i = 0; i < n; i++) {
    const sRaw = starts[i]
    if (!sRaw) continue
    const s = new Date(sRaw)
    if (Number.isNaN(s.getTime())) continue
    const eRaw = ends[i]
    const e = eRaw ? new Date(eRaw) : null
    const endStr = e && !Number.isNaN(e.getTime()) ? formatUsTime12(e) : '—'
    lines.push(`${formatUsDateTime(s)} → ${endStr}`)
  }
  return lines.length ? lines.join('\n') : '—'
}

export function instructorNamesCell(c: Record<string, unknown>, instructors: InstructorOption[]): string {
  const fallback = String(c.instructorName || '').trim()
  const ids = Array.isArray(c.instructorUserIds)
    ? (c.instructorUserIds as unknown[]).map(String).filter(Boolean)
    : []
  if (ids.length === 0) return fallback || '—'
  return ids.map((lid) => instructors.find((u) => u.linkId === lid || u.id === lid)?.name || lid).join(', ')
}
