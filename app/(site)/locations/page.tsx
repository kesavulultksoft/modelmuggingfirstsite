import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import { ResourceLinksSection } from '@/components/site/MarketingResourceLinkGrid'
import { LOCATIONS_NAV } from '@/components/site/siteMarketingLinks'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'locations'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'Locations',
  description: 'Model Mugging classes across the U.S. Find training near you.',
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function LocationsPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  return (
    <div className="min-h-[60vh]">
      <PageHero
        maxWidth="7xl"
        eyebrow="Where we teach"
        title="Locations"
        subtitle="Classes run in cities nationwide. Open dates and exact venues are on the live schedule."
      >
        <Link
          href="/schedule/"
          className="mt-8 inline-flex rounded-xl bg-[#00d4aa] px-6 py-3.5 text-sm font-bold text-[#0f172a] transition hover:bg-teal-300"
        >
          View open classes
        </Link>
      </PageHero>
      <SiteMain>
        <ResourceLinksSection title="Browse resources" links={LOCATIONS_NAV} />
        <p className="mt-12 text-sm text-slate-600">
          Don&apos;t see your city?{' '}
          <Link href="/contact/" className="font-semibold text-teal-600 hover:underline">
            Contact us
          </Link>{' '}
          — new regions open as instructors certify.
        </p>
      </SiteMain>
    </div>
  )
}
