import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { LocationCollapsible } from '@/components/location/LocationCollapsible'
import { LocationRichText } from '@/components/location/LocationRichText'
import { LocationDayOutline } from '@/components/location/LocationDayOutline'
import { formatLocationLabel } from '@/components/location/locationText'
import { LOCATION_BOX_TITLE, LOCATION_SECTION_TITLE } from '@/components/location/locationBrandStyles'
import Link from 'next/link'

export function WhyUniqueBand({
  whyUnique,
  faqPageHref,
  compact,
}: {
  whyUnique: LocationCityPageContent['whyUnique']
  faqPageHref?: string
  compact?: boolean
}) {
  return (
    <section
      className={`not-prose overflow-hidden rounded-2xl border border-[#1f497d] bg-[#1f497d] ${
        compact ? 'px-4 py-5 sm:px-6' : 'px-6 py-8 sm:px-9'
      }`}
      data-location-why-unique
    >
      <h2 className={`${LOCATION_BOX_TITLE} !text-white sm:!text-3xl`}>{whyUnique.title}</h2>
      <div className="mt-3 max-w-2xl">
        <LocationRichText value={whyUnique.body} variant="onDark" />
      </div>
      {faqPageHref ? (
        <p className="mt-3 text-sm !text-white/95">
          More questions? See our{' '}
          <Link href={faqPageHref} className="font-semibold !text-[#1da1f2] hover:!text-white hover:underline">
            FAQs
          </Link>
          .
        </p>
      ) : null}
      {whyUnique.registerHref && whyUnique.registerLabel ? (
        <div className="mt-4">
          <Link
            href={whyUnique.registerHref}
            className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1f497d] transition hover:bg-slate-100"
          >
            {formatLocationLabel(whyUnique.registerLabel)}
          </Link>
        </div>
      ) : null}
    </section>
  )
}

export function LocationCourseOverviewBlock({
  content,
}: {
  content: Pick<
    LocationCityPageContent,
    'courseOverview' | 'dayOne' | 'dayTwo' | 'whyUnique' | 'faqPageHref'
  >
}) {
  if (!content.courseOverview.heading) return null

  return (
    <section className="scroll-mt-24 space-y-4">
      <div>
        <h2 className={LOCATION_SECTION_TITLE}>
          {formatLocationLabel(content.courseOverview.heading)}
        </h2>
        <div className="mt-3">
          <LocationCollapsible
            toggleLabel="View Day One And Day Two Summaries"
            headingExternal
            defaultOpen={!content.courseOverview.collapsedByDefault}
          >
            <LocationDayOutline dayOne={content.dayOne} dayTwo={content.dayTwo} />
          </LocationCollapsible>
        </div>
      </div>
      <WhyUniqueBand whyUnique={content.whyUnique} faqPageHref={content.faqPageHref} compact />
    </section>
  )
}
