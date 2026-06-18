/** Legacy sign-up paths (trainerSignUp / sign-up.html) — stored as PortalUser.userType. */

export type CourseUserType = 'UT1' | 'UT2' | 'UT3' | 'UT4'

export const COURSE_REGISTRATION_OPTIONS: {
  value: CourseUserType
  label: string
  description: string
}[] = [
  {
    value: 'UT1',
    label: 'Parent / guardian (not attending)',
    description:
      'I am a parent or guardian of student(s) under 18 and will not be attending the class myself.',
  },
  {
    value: 'UT2',
    label: 'Parent / guardian (attending too)',
    description:
      'I am a parent or guardian of student(s) under 18 and will be attending the class as well.',
  },
  {
    value: 'UT3',
    label: 'Adult student (myself)',
    description: 'I am over 18 and will be attending for myself.',
  },
  {
    value: 'UT4',
    label: 'Registering for someone else',
    description: 'I am registering for someone else but not taking the course myself.',
  },
]

export function parseCourseIdFromNext(next: string | null): string | null {
  if (!next) return null
  const m = next.match(/\/classes\/([a-fA-F0-9]{24})(?:\/|$|\?)/)
  if (m) return m[1]
  const q = next.match(/[?&]courseId=([a-fA-F0-9]{24})/)
  return q ? q[1] : null
}

/** Auth pages: return to class (or other marketing path), not home, when registering from a course. */
export function registrationBackLink(
  courseId: string | null,
  next?: string | null,
): { href: string; label: string } {
  const cid = courseId?.trim() || parseCourseIdFromNext(next ?? null)
  if (cid) {
    return { href: `/classes/${cid}`, label: '← Back to class' }
  }
  const n = (next ?? '').trim()
  if (n.startsWith('/') && !n.startsWith('/portal')) {
    const path = n.split('?')[0] || n
    if (path !== '/register' && path !== '/login') {
      return { href: path, label: '← Back' }
    }
  }
  return { href: '/schedule', label: '← Back to schedule' }
}

export function roleForUserType(ut: CourseUserType): 'STUDENT' | 'PARENT' {
  return ut === 'UT3' ? 'STUDENT' : 'PARENT'
}

export function defaultAttendeeCount(ut: CourseUserType): number {
  if (ut === 'UT2') return 2
  return 1
}

export function showsAttendeeCount(ut: CourseUserType): boolean {
  return ut === 'UT1' || ut === 'UT2' || ut === 'UT4'
}

export function enrollPath(courseId: string, userType: CourseUserType): string {
  const q = new URLSearchParams({ courseId, userType })
  return `/portal/student/enroll?${q.toString()}`
}

export function registerPath(courseId: string, userType?: CourseUserType): string {
  const q = new URLSearchParams({ courseId })
  if (userType) q.set('userType', userType)
  return `/register?${q.toString()}`
}

export function loginPathForCourse(courseId: string, userType: CourseUserType): string {
  return `/login?next=${encodeURIComponent(enrollPath(courseId, userType))}`
}

export function parseUserType(raw: string | null): CourseUserType | null {
  if (raw === 'UT1' || raw === 'UT2' || raw === 'UT3' || raw === 'UT4') return raw
  return null
}

export function multiplyFeeDisplay(feeDisplay: string, count: number): string {
  const n = Math.max(1, Math.min(20, count))
  const m = feeDisplay.replace(/[^0-9.]/g, '')
  const num = Number(m)
  if (!Number.isFinite(num) || num <= 0) return feeDisplay
  const total = num * n
  const hasCents = /\.\d{2}$/.test(m) || feeDisplay.includes('.')
  const formatted = hasCents ? total.toFixed(2) : String(Math.round(total))
  if (feeDisplay.includes('$')) return `$${formatted}`
  return formatted
}
