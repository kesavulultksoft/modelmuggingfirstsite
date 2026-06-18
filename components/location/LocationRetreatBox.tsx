import Link from 'next/link'
import { fetchUpcomingCourses } from '@/lib/api'
import { isRetreatCourse } from '@/lib/location/courseFilters'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { CourseEventList } from '@/components/location/LocationCourseEvents'
import { LocationRichText } from '@/components/location/LocationRichText'
import { formatLocationLabel } from '@/components/location/locationText'
import { LOCATION_BOX_TITLE, LOCATION_BTN_COMPACT } from '@/components/location/locationBrandStyles'

export async function LocationRetreatBox({
  retreatBox,
  eventsEmptyMessage,
}: {
  retreatBox: NonNullable<LocationCityPageContent['retreatBox']>
  eventsEmptyMessage: string
}) {
  const all = await fetchUpcomingCourses()
  const retreats = all.filter(isRetreatCourse)

  return (
    <section className="scroll-mt-24 rounded-xl border border-[#1f497d]/20 bg-[#1f497d]/5 px-4 py-3 sm:px-5 sm:py-4">
      <h2 className={LOCATION_BOX_TITLE}>{retreatBox.title}</h2>
      <div className="mt-1.5">
        <LocationRichText value={retreatBox.body} />
      </div>
      <Link href={retreatBox.primaryHref} className={`mt-2.5 inline-flex ${LOCATION_BTN_COMPACT}`}>
        {formatLocationLabel(retreatBox.primaryLabel)}
      </Link>
      <div className="mt-4 border-t border-[#1f497d]/15 pt-4">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900 sm:text-xl">
          Women&apos;s Self-Defense Retreats
        </h3>
        <div className="mt-3">
          <CourseEventList courses={retreats} emptyMessage={eventsEmptyMessage} />
        </div>
        {retreats.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            <Link href={retreatBox.primaryHref} className="font-semibold text-[#1f497d] hover:underline">
              View retreat options
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}
