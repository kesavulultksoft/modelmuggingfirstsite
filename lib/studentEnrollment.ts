import type { StudentEnrollmentView } from '@/lib/portalApi'

/** Upcoming / in-progress enrollment — blocks re-enroll and cart. */
export function isActiveEnrollmentStatus(status: string | undefined): boolean {
  const s = (status || '').toUpperCase()
  return s === 'REGISTERED' || s === 'WAITLIST'
}

export function isCompletedEnrollmentStatus(status: string | undefined): boolean {
  return (status || '').toUpperCase() === 'COMPLETED'
}

export function isEnrolledInCourse(enrollments: StudentEnrollmentView[], courseId: string): boolean {
  return enrollments.some((e) => e.courseId === courseId && isActiveEnrollmentStatus(e.status))
}

export function enrolledCourseIds(enrollments: StudentEnrollmentView[]): Set<string> {
  return new Set(
    enrollments.filter((e) => isActiveEnrollmentStatus(e.status)).map((e) => e.courseId),
  )
}

export function enrollmentDisplayTitle(e: StudentEnrollmentView): string {
  return e.courseTitle || e.venueName || e.locationLabel || 'Class'
}
