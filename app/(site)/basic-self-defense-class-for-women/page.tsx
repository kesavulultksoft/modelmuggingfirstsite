import type { Metadata } from 'next'
import { CmsPageView } from '@/components/sanity/CmsPageView'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import { buildTrainingCourseMarketingPageDoc } from '@/lib/marketingPages/trainingCourseMarketingPage'
import {
  WOMENS_BASIC_COURSE_ROUTE_PATH,
} from '@/lib/marketingPages/womensBasicCoursePage'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(WOMENS_BASIC_COURSE_ROUTE_PATH)
  const pageDoc = buildTrainingCourseMarketingPageDoc(cms, WOMENS_BASIC_COURSE_ROUTE_PATH)
  return {
    ...buildCmsPageMetadata(pageDoc, site),
    alternates: { canonical: canonicalPageUrl(site, WOMENS_BASIC_COURSE_ROUTE_PATH) },
  }
}

export default async function WomensBasicCoursePage() {
  const cms = await getCachedCmsPage(WOMENS_BASIC_COURSE_ROUTE_PATH)
  return <CmsPageView page={buildTrainingCourseMarketingPageDoc(cms, WOMENS_BASIC_COURSE_ROUTE_PATH)} siteUrl={site} />
}
