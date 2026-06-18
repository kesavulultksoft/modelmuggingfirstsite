import type { PortableTextBlock } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArticleFooterNav } from '@/components/site/ArticleFooterNav'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import JsonLd from '@/components/site/JsonLd'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import type {
  LocationCityMarketingSection,
  LocationCityPageContent,
} from '@/lib/marketingPages/locationCity/types'
import { LOCATIONS_NAV, TYPES_OF_TRAINING_MEGA_NAV } from '@/components/site/siteMarketingLinks'
import { LocationCollapsible } from '@/components/location/LocationCollapsible'
import { LocationElevenWaysSection } from '@/components/location/LocationElevenWaysSection'
import { LocationVideoBlock } from '@/components/location/LocationVideoBlock'
import { LocationCityScheduleBlock } from '@/components/location/LocationCityScheduleBlock'
import { LocationDonateBlock } from '@/components/location/LocationDonateBlock'
import { LocationGraduateQuotes } from '@/components/location/LocationGraduateQuotes'
import { LocationBottomPromoBoxes } from '@/components/location/LocationBottomPromoBoxes'
import { LocationCourseOverviewBlock } from '@/components/location/LocationCourseOverviewBlock'
import { LocationRetreatBox } from '@/components/location/LocationRetreatBox'
import { LocationRichText } from '@/components/location/LocationRichText'
import { isRetreatCourse, matchesCity } from '@/lib/location/courseFilters'
import { portableToPlainText } from '@/lib/marketingPages/locationCity/portable'
import { formatLocationLabel } from '@/components/location/locationText'
import { hubHref } from '@/lib/siteHubRoutes'
import {
  LOCATION_BOX_TITLE,
  LOCATION_BTN_COMPACT,
  LOCATION_BTN_INLINE,
  LOCATION_BTN_PRIMARY,
  LOCATION_LINK_ON_DARK,
  LOCATION_MAIN_COLUMN_SPACING,
  LOCATION_SECTION_TITLE,
} from '@/components/location/locationBrandStyles'

/** Marketing bucket in a bordered box (always visible — not a toggle). */
function MarketingInfoSection({ section }: { section: LocationCityMarketingSection }) {
  return (
    <section className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80">
      <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-2 sm:px-4">
        <h2 className={LOCATION_BOX_TITLE}>{section.heading}</h2>
      </div>
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3 sm:p-3">
        <div className="min-w-0 flex-1">
          <LocationRichText value={section.content} />
        </div>
        {section.imageSrc ? (
          <div className="mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-md border border-slate-200 sm:mx-0 sm:max-w-[220px]">
            <Image
              src={section.imageSrc}
              alt={section.imageAlt || section.heading}
              width={220}
              height={160}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function InlineCta({
  title,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  compact,
}: {
  title: string
  body?: PortableTextBlock[]
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-[#1f497d]/15 bg-gradient-to-br from-[#1f497d]/5 to-white px-4 py-3 sm:px-4 ${
        compact ? '' : 'sm:py-4'
      }`}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
        {formatLocationLabel(title)}
      </h3>
      {body?.length ? (
        <div className="mt-2">
          <LocationRichText value={body} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={primaryHref} className={LOCATION_BTN_INLINE}>
          {formatLocationLabel(primaryLabel)}
        </Link>
        {secondaryLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex rounded-lg border-2 border-[#1f497d]/25 bg-white px-4 py-2 text-sm font-bold text-[#1f497d] hover:border-[#1da1f2]/60 hover:bg-sky-50/80"
          >
            {formatLocationLabel(secondaryLabel)}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function LocationCityPageView({
  content,
  siteUrl,
}: {
  content: LocationCityPageContent
  siteUrl: string
}) {
  const path = content.routePath
  const url = canonicalPageUrl(siteUrl, path)
  const locationLinks = LOCATIONS_NAV.filter((l) => l.href !== '/locations' && l.href.replace(/^\//, '').replace(/\/$/, '') !== path)

  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.hero.title,
    description: content.seo.metaDescription,
    url,
    publisher: { '@type': 'Organization', name: 'Model Mugging', url: siteUrl },
  }

  const faqJson =
    content.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: portableToPlainText(item.answer) || item.question,
            },
          })),
        }
      : null

  return (
    <div>
      <JsonLd data={articleJson} />
      {faqJson ? <JsonLd data={faqJson} /> : null}
      <PageHero
        maxWidth="7xl"
        eyebrow="Locations"
        title={content.hero.title}
        subtitle={content.hero.subtitle}
        tagline={content.hero.tagline}
        back={{ href: '/locations/', label: 'All locations' }}
        showEyebrow={false}
        brandColors
      />
      <SiteMain>
        <article className="location-city-page" itemScope itemType="https://schema.org/Article">
          <meta itemProp="headline" content={content.hero.title} />
          <div className="lg:grid lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <div className={`prose-site ${LOCATION_MAIN_COLUMN_SPACING} text-base`}>
                {content.hero.leadLine ? (
                  <p className="text-center font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#1f497d] sm:text-3xl">
                    {content.hero.leadLine}
                  </p>
                ) : null}

                {content.introVideo ? (
                  <LocationVideoBlock
                    youtubeId={content.introVideo.youtubeId}
                    title={content.introVideo.title}
                    quote={content.introVideo.quote ?? content.graduateQuote}
                  />
                ) : null}

                {content.registerSpotsHeadline ? (
                  <p className="text-center text-base font-semibold text-[#1f497d] sm:text-lg">
                    {formatLocationLabel(content.registerSpotsHeadline)}
                  </p>
                ) : null}

                <Suspense
                  fallback={
                    <p className="text-sm text-slate-500">Loading upcoming classes…</p>
                  }
                >
                  <LocationCityScheduleBlock
                    locationMatch={content.scheduleLocationMatch}
                    weekendTitle={content.events.weekendTitle}
                    weekdayTitle={content.events.weekdayTitle}
                    emptyMessage={content.events.emptyMessage}
                    scope={content.eventsScope}
                    sectionTitle={content.eventsSectionTitle ?? 'Upcoming San Diego Courses'}
                    subtitle={content.eventsSubtitle}
                  />
                </Suspense>

                <LocationCourseOverviewBlock content={content} />

                {content.retreatBox?.enabled ? (
                  <Suspense
                    fallback={
                      <p className="text-sm text-slate-500">Loading retreat dates…</p>
                    }
                  >
                    <LocationRetreatBox
                      retreatBox={content.retreatBox}
                      eventsEmptyMessage={content.events.emptyMessage}
                    />
                  </Suspense>
                ) : null}

                <section className="rounded-2xl border border-[#1f497d]/20 bg-[#1f497d]/5 px-4 py-3 text-center sm:px-5 sm:py-4">
                  <h2 className={LOCATION_BOX_TITLE}>
                    {formatLocationLabel(content.subscribeInvite.title)}
                  </h2>
                  <div className="mt-2">
                    <LocationRichText value={content.subscribeInvite.body} />
                  </div>
                  <Link href={content.subscribeInvite.ctaHref} className={`mt-3 ${LOCATION_BTN_INLINE}`}>
                    {formatLocationLabel(content.subscribeInvite.ctaLabel)}
                  </Link>
                </section>

                {content.infoBuckets.map((bucket, i) => (
                  <section key={bucket.heading} className="scroll-mt-24">
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                      {bucket.heading}
                    </h2>
                    <div className="mt-4">
                      <LocationRichText value={bucket.content} />
                    </div>
                    {bucket.imageSrc ? (
                      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                        <Image
                          src={bucket.imageSrc}
                          alt={bucket.imageAlt || bucket.heading}
                          width={800}
                          height={500}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    ) : null}
                  </section>
                ))}

                {content.marketingSections?.map((section) => (
                  <MarketingInfoSection key={section.heading} section={section} />
                ))}

                {content.elevenWays ? (
                  <LocationElevenWaysSection
                    title={content.elevenWays.title}
                    subtitle={content.elevenWays.subtitle}
                    items={content.elevenWays.items}
                    defaultOpen={!content.elevenWays.collapsedByDefault}
                  />
                ) : null}

                {content.midCta ? <InlineCta {...content.midCta} /> : null}

              </div>

              <div className={`prose-site mt-6 ${LOCATION_MAIN_COLUMN_SPACING} text-base`}>
                {content.graduateTestimonials && content.graduateTestimonials.length > 0 ? (
                  <LocationGraduateQuotes
                    title={content.graduateTestimonialsTitle ?? 'What Are Graduates Saying'}
                    testimonials={content.graduateTestimonials}
                  />
                ) : null}
                {content.graduateStories
                  .filter((s) => s.enabled !== false)
                  .map((story) => (
                    <section
                      key={story.anchorId || story.heading}
                      id={story.anchorId}
                      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
                        {story.heading}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">{story.body}</p>
                    </section>
                  ))}

                {content.secondVideo ? (
                  <LocationVideoBlock
                    youtubeId={content.secondVideo.youtubeId}
                    title={content.secondVideo.title}
                    quote={content.secondVideo.quote}
                  />
                ) : null}

                <LocationCollapsible title="Other Locations" defaultOpen>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {locationLinks.map((loc) => (
                      <li key={loc.href}>
                        <Link href={loc.href} className="text-sm font-semibold text-[#1f497d] hover:text-[#1da1f2] hover:underline">
                          {loc.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </LocationCollapsible>

                <LocationCollapsible title="Types Of Training" defaultOpen>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {TYPES_OF_TRAINING_MEGA_NAV.filter((t) => t.href !== '/training' && t.href !== '/types-of-training').map(
                      (t) => (
                        <li key={t.href}>
                          <Link href={t.href} className="text-sm font-semibold text-[#1f497d] hover:text-[#1da1f2] hover:underline">
                            {t.label}
                          </Link>
                        </li>
                      ),
                    )}
                  </ul>
                </LocationCollapsible>

                <section className="scroll-mt-24">
                  <h2 className={LOCATION_SECTION_TITLE}>{content.localSeo.heading}</h2>
                  <div className="mt-4">
                    <LocationRichText value={content.localSeo.body} />
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">FAQ</h2>
                  <div className="space-y-3">
                    {content.faq.map((item) => (
                      <details
                        key={item.question}
                        className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm open:shadow-md"
                      >
                        <summary className="cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-start justify-between gap-2">
                            {item.question}
                            <span className="text-[#1f497d] transition group-open:rotate-180">▼</span>
                          </span>
                        </summary>
                        <div className="mt-3">
                          <LocationRichText value={item.answer} />
                        </div>
                      </details>
                    ))}
                  </div>
                </section>

                <InlineCta {...content.footerCta} />

                <LocationDonateBlock donate={content.donate} />

                {content.bottomPromoBoxes ? (
                  <LocationBottomPromoBoxes boxes={content.bottomPromoBoxes} />
                ) : null}

              </div>
            </div>

            <aside className="mt-10 lg:col-span-4 lg:mt-0">
              <div className="sticky top-24 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <Link
                    href="/schedule/"
                    className={`w-full flex-col leading-tight ${LOCATION_BTN_PRIMARY}`}
                  >
                    <span className="block text-sm font-bold">
                      {content.sidebar?.registerLine1 ?? 'Reserve My Spot In'}
                    </span>
                    <span className="block text-sm font-bold">
                      {content.sidebar?.registerLine2 ?? content.cityName}
                    </span>
                  </Link>
                </div>
                <Suspense fallback={null}>
                  <SidebarEvents locationMatch={content.scheduleLocationMatch} />
                </Suspense>
                {content.sidebar?.guardians ? (
                  <div className="rounded-xl border border-[#1f497d]/20 bg-[#1f497d]/5 p-3 sm:p-4">
                    <p className="text-sm font-bold leading-snug text-slate-900">
                      {content.sidebar.guardians.title}
                    </p>
                    <div className="mt-1.5">
                      <LocationRichText
                        value={content.sidebar.guardians.body}
                        variant="compact"
                      />
                    </div>
                    <Link
                      href={content.sidebar.guardians.href}
                      className={`mt-2.5 w-full justify-center ${LOCATION_BTN_INLINE}`}
                    >
                      {formatLocationLabel(content.sidebar.guardians.ctaLabel ?? 'Learn more')}
                    </Link>
                  </div>
                ) : null}
                {content.bottomPromoBoxes?.podcast ? (
                  <Link
                    href={content.bottomPromoBoxes.podcast.href}
                    className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[#1f497d]/30"
                  >
                    <Image
                      src={
                        content.bottomPromoBoxes.podcast.imageSrc ||
                        '/locations/podcast-from-behind-the-mask.png'
                      }
                      alt={content.bottomPromoBoxes.podcast.imageAlt || 'From Behind the Mask podcast'}
                      width={280}
                      height={280}
                      className="mx-auto h-auto w-full max-w-[220px] object-contain bg-white p-2"
                    />
                    <p className="px-3 py-2 text-center text-xs font-semibold text-[#1f497d]">
                      {content.sidebar?.podcastLinkLabel ??
                        content.bottomPromoBoxes.podcast.ctaLabel ??
                        'Join our Podcast'}
                    </p>
                  </Link>
                ) : null}
                {content.bottomPromoBoxes?.defendTimeAndMoney ? (
                  <div className="rounded-xl border border-[#1f497d]/20 bg-[#1f497d]/5 p-3 text-center sm:p-4">
                    <p className="text-sm font-bold text-slate-900">
                      {content.bottomPromoBoxes.defendTimeAndMoney.title}
                    </p>
                    {content.bottomPromoBoxes.defendTimeAndMoney.body?.length ? (
                      <div className="mt-1">
                        <LocationRichText
                          value={content.bottomPromoBoxes.defendTimeAndMoney.body}
                          variant="compact"
                        />
                      </div>
                    ) : null}
                    <Link
                      href={
                        content.bottomPromoBoxes.defendTimeAndMoney.href ||
                        hubHref('defendTimeAndMoney')
                      }
                      className={`mt-2.5 w-full justify-center ${LOCATION_BTN_INLINE}`}
                    >
                      {formatLocationLabel(
                        content.bottomPromoBoxes.defendTimeAndMoney.ctaLabel || 'Free offer',
                      )}
                    </Link>
                  </div>
                ) : null}
                <LocationCollapsible
                  title="View schedule and other locations"
                  toggleLabel="View schedule and other locations"
                  defaultOpen={false}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <p className="mb-2">
                    <Link href="/schedule/" className="text-sm font-semibold text-[#1f497d] hover:underline">
                      View complete schedule
                    </Link>
                  </p>
                  <ul className="space-y-1 text-xs">
                    {locationLinks.map((loc) => (
                      <li key={loc.href}>
                        <Link href={loc.href} className="text-[#1f497d] hover:text-[#1da1f2] hover:underline">
                          {loc.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </LocationCollapsible>
              </div>
            </aside>
          </div>

          <ArticleFooterNav
            linkClassName="text-[#1f497d] hover:text-[#1da1f2] hover:underline"
            includeTrainerApplication={false}
          />
        </article>
      </SiteMain>
    </div>
  )
}

async function SidebarEvents({ locationMatch }: { locationMatch: string }) {
  const { fetchUpcomingCourses } = await import('@/lib/api')
  const all = await fetchUpcomingCourses()
  const local = all.filter(
    (c) =>
      matchesCity(c, locationMatch) &&
      !isRetreatCourse(c),
  )
  if (local.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-800 p-4 text-center text-sm text-white">
        <p>No upcoming events right now. Check the schedule later.</p>
        <Link href="/schedule/" className="mt-2 inline-block font-semibold text-[#1da1f2] hover:underline">
          View Schedule
        </Link>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white">
      <h3 className="font-semibold">Upcoming events</h3>
      <ul className="mt-3 space-y-3 text-sm">
        {local.slice(0, 4).map((c) => (
          <li key={c.id} className="rounded-lg bg-white/10 p-3">
            <p className="font-medium">{c.title}</p>
            <Link href={`/classes/${c.id}/`} className={`mt-2 inline-block text-xs font-bold ${LOCATION_LINK_ON_DARK}`}>
              Register Now
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
