import { isInstructorUpcomingCourse } from '@/lib/coursePortalDisplay'
import { coerceToDate, earliestFutureSession, earliestListedSession } from '@/lib/courseSessionDates'

export type NextCoursePick = { c: Record<string, unknown>; dt: Date; isPast: boolean }

export function pickNextCourseDisplay(courses: Record<string, unknown>[]): NextCoursePick | null {
  const picks: NextCoursePick[] = []
  for (const c of courses) {
    if (!isInstructorUpcomingCourse(c)) continue
    const fut = earliestFutureSession(c)
    if (fut) {
      picks.push({ c, dt: fut, isPast: false })
      continue
    }
    const listed = earliestListedSession(c)
    if (listed) {
      picks.push({ c, dt: listed, isPast: true })
      continue
    }
    const disp = coerceToDate(c.displayStartDate)
    const now = Date.now()
    if (disp && disp.getTime() >= now) {
      picks.push({ c, dt: disp, isPast: false })
    }
  }
  if (picks.length === 0) return null
  picks.sort((a, b) => {
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1
    return a.dt.getTime() - b.dt.getTime()
  })
  return picks[0]
}

export function extractCourseDocumentHex(c: Record<string, unknown>): string {
  const cand = c.courseId ?? c.id ?? c._id
  if (typeof cand === 'string' && cand) return cand
  if (cand && typeof cand === 'object' && cand !== null && '$oid' in cand) {
    return String((cand as { $oid: string }).$oid)
  }
  return ''
}
