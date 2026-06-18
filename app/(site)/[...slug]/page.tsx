import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MigratedArticlePage } from '@/components/site/MigratedArticlePage'
import PreGroupApplicationSection from '@/components/groupCourse/PreGroupApplicationSection'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import { MIGRATED_SITE_PAGES, type MigratedPageDef } from '@/lib/migratedSitePages'
import { fetchLiveParagraphs } from '@/lib/livePageContent'
import { fetchAllCmsRoutePaths, getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'
import { buildTrainingCourseMarketingPageDoc } from '@/lib/marketingPages/trainingCourseMarketingPage'
import { isCourseStyleMarketingRoute } from '@/lib/marketingPages/courseStyleMarketingRoutes'
import { isMarketingHubRoute } from '@/lib/marketingPages/marketingHubRoutes'
import { isLocationCityPilotPath } from '@/lib/marketingPages/locationCityPilotPaths'
import {
  getLocationCityPage,
  getLocationCityPageDefaults,
} from '@/lib/marketingPages/locationCity/getLocationCityPage'
import { LocationCityPageView } from '@/components/location/LocationCityPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
export const revalidate = 10

type Props = { params: Promise<{ slug: string[] }> }

function pathKey(slug: string[]) {
  return slug.map((s) => decodeURIComponent(s)).join('/')
}

function heroTitle(def: MigratedPageDef) {
  return def.title.replace(/\s*\|\s*Model Mugging\s*$/i, '').trim()
}

export async function generateStaticParams() {
  const cmsPaths = await fetchAllCmsRoutePaths().catch(() => [] as string[])
  const migrated = Object.keys(MIGRATED_SITE_PAGES)
  const merged = [...new Set([...cmsPaths, ...migrated])]
  return merged.map((path) => ({
    slug: path.split('/').filter(Boolean),
  }))
}

function buildCourseStylePage(cms: Awaited<ReturnType<typeof getCachedCmsPage>>, path: string) {
  return buildTrainingCourseMarketingPageDoc(cms, path)
}

function migratedFallbackBack(def: MigratedPageDef) {
  return (
    def.back ??
    (def.eyebrow === 'Locations'
      ? { href: '/locations/', label: 'All locations' }
      : def.eyebrow === 'Training'
        ? { href: '/training/', label: 'Training overview' }
        : def.eyebrow === 'Testimonials'
          ? { href: '/self-defense-testimonials/', label: 'Testimonials' }
          : def.eyebrow === 'Deutschland'
            ? { href: '/locations/', label: 'Locations' }
            : undefined)
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const path = pathKey(slug)

  const cityPilot = getLocationCityPageDefaults(path)
  if (cityPilot) {
    const title = cityPilot.seo.metaTitle
    const description = cityPilot.seo.metaDescription
    return {
      title,
      description,
      keywords: cityPilot.seo.keywords,
      alternates: { canonical: canonicalPageUrl(site, path) },
      openGraph: {
        type: 'article',
        title,
        description,
        url: canonicalPageUrl(site, path),
        siteName: 'Model Mugging',
      },
      twitter: { card: 'summary_large_image', title, description },
      robots: { index: true, follow: true },
    }
  }

  if (isMarketingHubRoute(path)) {
    const cms = await getCachedCmsPage(path)
    if (cms?.sections?.length) return buildCmsPageMetadata(cms, site)
  }

  if (isCourseStyleMarketingRoute(path)) {
    const cms = await getCachedCmsPage(path)
    return buildCmsPageMetadata(buildCourseStylePage(cms, path), site)
  }

  const cms = await getCachedCmsPage(path)
  if (cms) return buildCmsPageMetadata(cms, site)

  const def = MIGRATED_SITE_PAGES[path]
  if (!def) return { title: 'Not found' }
  return {
    title: def.title,
    description: def.description,
    keywords: def.keywords,
    alternates: { canonical: canonicalPageUrl(site, path) },
    openGraph: {
      type: 'article',
      title: def.title,
      description: def.description,
      url: canonicalPageUrl(site, path),
      siteName: 'Model Mugging',
    },
    twitter: { card: 'summary_large_image', title: def.title, description: def.description },
    robots: { index: true, follow: true },
  }
}

export default async function MarketingCatchAllPage({ params }: Props) {
  const { slug } = await params
  const path = pathKey(slug)

  if (isLocationCityPilotPath(path)) {
    const cityPilot = await getLocationCityPage(path)
    if (cityPilot) {
      return <LocationCityPageView content={cityPilot} siteUrl={site} />
    }
  }

  if (isMarketingHubRoute(path)) {
    const cms = await getCachedCmsPage(path)
    if (cms?.sections?.length) {
      return <CmsPageView page={cms} siteUrl={site} />
    }
    const def = MIGRATED_SITE_PAGES[path]
    if (!def) notFound()
    const livePs = await fetchLiveParagraphs(path)
    const back = migratedFallbackBack(def)
    const showEyebrow =
      !back ||
      def.eyebrow.toLowerCase() !== back.label.toLowerCase().replace(/\s+overview$/i, '').trim()
    return (
      <MigratedArticlePage
        def={def}
        path={path}
        siteUrl={site}
        livePs={livePs}
        heroEyebrow={def.eyebrow}
        heroTitle={heroTitle(def)}
        heroSubtitle={def.description}
        back={back}
        showEyebrow={showEyebrow}
      />
    )
  }

  if (isCourseStyleMarketingRoute(path)) {
    const cms = await getCachedCmsPage(path)
    const afterArticle =
      path === 'hosting-self-defense-classes-or-training' ? (
        <Suspense
          fallback={<div className="py-12 text-center text-sm text-slate-500">Loading application form…</div>}
        >
          <div className="mx-auto max-w-3xl px-4 pb-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              Request a group course for your organization
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit the screening form below. If your group qualifies, we will email you a link to complete the full
              application.
            </p>
            <div className="mt-8">
              <PreGroupApplicationSection showProcessSteps={false} />
            </div>
          </div>
        </Suspense>
      ) : undefined
    return (
      <CmsPageView
        page={buildCourseStylePage(cms, path)}
        siteUrl={site}
        afterArticle={afterArticle}
      />
    )
  }

  const cms = await getCachedCmsPage(path)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />

  const def = MIGRATED_SITE_PAGES[path]
  if (!def) notFound()

  const livePs = await fetchLiveParagraphs(path)
  const back = migratedFallbackBack(def)
  const showEyebrow =
    !back ||
    def.eyebrow.toLowerCase() !== back.label.toLowerCase().replace(/\s+overview$/i, '').trim()

  return (
    <MigratedArticlePage
      def={def}
      path={path}
      siteUrl={site}
      livePs={livePs}
      heroEyebrow={def.eyebrow}
      heroTitle={heroTitle(def)}
      heroSubtitle={def.description}
      back={back}
      showEyebrow={showEyebrow}
    />
  )
}
