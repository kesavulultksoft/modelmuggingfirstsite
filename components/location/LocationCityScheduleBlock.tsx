import Link from 'next/link'
import { fetchUpcomingCourses } from '@/lib/api'
import {
  filterUpcomingForCity,
  isRetreatCourse,
  isWeekendCourse,
} from '@/lib/location/courseFilters'
import { CourseEventBox, CourseEventGroup } from '@/components/location/LocationCourseEvents'
import { formatLocationLabel } from '@/components/location/locationText'
import { LOCATION_LINK, LOCATION_SECTION_TITLE } from '@/components/location/locationBrandStyles'

export async function LocationCityScheduleBlock({
  locationMatch,
  weekendTitle,
  weekdayTitle,
  emptyMessage,
  scope = 'city',
  sectionTitle = 'Upcoming San Diego Courses',
  subtitle,
  excludeRetreats = true,
}: {
  locationMatch: string
  weekendTitle: string
  weekdayTitle: string
  emptyMessage: string
  scope?: 'city' | 'all'
  sectionTitle?: string
  subtitle?: string
  /** When true, retreat courses render only under the retreat box. */
  excludeRetreats?: boolean
}) {
  const all = await fetchUpcomingCourses()
  let pool = filterUpcomingForCity(all, locationMatch, scope)
  if (excludeRetreats) pool = pool.filter((c) => !isRetreatCourse(c))
  const heading = formatLocationLabel(sectionTitle)

  if (scope === 'all') {
    return (
      <section className="scroll-mt-24" aria-labelledby="location-events-heading">
        <h2 id="location-events-heading" className={LOCATION_SECTION_TITLE}>
          {heading}
        </h2>
        {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
        <div className="mt-4 space-y-3">
          {pool.length > 0 ? (
            pool.map((c) => <CourseEventBox key={c.id} course={c} />)
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {emptyMessage}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          <Link href="/schedule/" className={LOCATION_LINK}>
            View Complete Schedule
          </Link>{' '}
          for all cities.
        </p>
      </section>
    )
  }

  const weekend = pool.filter(isWeekendCourse)
  const weekday = pool.filter((c) => !isWeekendCourse(c))

  return (
    <section className="scroll-mt-24" aria-labelledby="location-events-heading">
      <h2 id="location-events-heading" className={LOCATION_SECTION_TITLE}>
        {heading}
      </h2>
      {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
      <div className="mt-4 space-y-4">
        <CourseEventGroup title={weekendTitle} courses={weekend} emptyMessage={emptyMessage} />
        <CourseEventGroup title={weekdayTitle} courses={weekday} emptyMessage={emptyMessage} />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        <Link href="/schedule/" className={LOCATION_LINK}>
          View Complete Schedule
        </Link>{' '}
        for all cities.
      </p>
    </section>
  )
}
