import type { Metadata } from 'next'
import { CmsPageView } from '@/components/sanity/CmsPageView'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import {
  MENS_BASIC_ROUTE_PATH,
  buildMensBasicCoursePageDoc,
} from '@/lib/marketingPages/mensBasicCoursePage'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { getCachedCmsPage } from '@/lib/sanity/queries'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(MENS_BASIC_ROUTE_PATH)
  const pageDoc = buildMensBasicCoursePageDoc(cms)
  return {
    ...buildCmsPageMetadata(pageDoc, site),
    alternates: { canonical: canonicalPageUrl(site, MENS_BASIC_ROUTE_PATH) },
  }
}

export default async function MensBasicSelfDefensePage() {
  const cms = await getCachedCmsPage(MENS_BASIC_ROUTE_PATH)
  return <CmsPageView page={buildMensBasicCoursePageDoc(cms)} siteUrl={site} />
}
