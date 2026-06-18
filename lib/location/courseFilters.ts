import type { CourseDTO } from '@/lib/types'

export function matchesCity(course: CourseDTO, match: string): boolean {
  const m = match.toLowerCase()
  return (
    course.locationLabel.toLowerCase().includes(m) ||
    course.address.toLowerCase().includes(m)
  )
}

/** Retreat workshops (Las Vegas, etc.) — shown under the retreat box, not the city schedule. */
export function isRetreatCourse(course: CourseDTO): boolean {
  const haystack = `${course.title} ${course.weekendLabel} ${course.locationLabel}`.toLowerCase()
  return haystack.includes('retreat')
}

export function isWeekendCourse(course: CourseDTO): boolean {
  return course.weekendLabel.toLowerCase().includes('weekend')
}

export function filterUpcomingForCity(
  courses: CourseDTO[],
  locationMatch: string,
  scope: 'city' | 'all',
): CourseDTO[] {
  if (scope === 'all') return courses
  return courses.filter((c) => matchesCity(c, locationMatch))
}

export function partitionCityAndRetreat(
  courses: CourseDTO[],
  locationMatch: string,
  scope: 'city' | 'all',
): { local: CourseDTO[]; retreats: CourseDTO[] } {
  const pool = filterUpcomingForCity(courses, locationMatch, scope)
  const retreats = pool.filter(isRetreatCourse)
  const local = pool.filter((c) => !isRetreatCourse(c))
  return { local, retreats }
}
