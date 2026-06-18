import type { Metadata } from 'next'
import { DonateToEmpowermentPageView } from '@/components/donate/DonateToEmpowermentPageView'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import { buildDonateToEmpowermentContent } from '@/lib/marketingPages/donateToEmpowerment/buildDonateToEmpowermentContent'
import { DONATE_TO_EMPOWERMENT_ROUTE_PATH } from '@/lib/marketingPages/donateToEmpowerment/types'
import { getCachedCmsPage } from '@/lib/sanity/queries'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(DONATE_TO_EMPOWERMENT_ROUTE_PATH)
  const content = buildDonateToEmpowermentContent(cms)
  const title = content.seo.metaTitle
  const description = content.seo.metaDescription

  return {
    title,
    description,
    keywords: content.seo.keywords,
    alternates: { canonical: canonicalPageUrl(site, DONATE_TO_EMPOWERMENT_ROUTE_PATH) },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalPageUrl(site, DONATE_TO_EMPOWERMENT_ROUTE_PATH),
      siteName: 'Model Mugging',
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  }
}

export default async function DonateToEmpowermentPage() {
  const cms = await getCachedCmsPage(DONATE_TO_EMPOWERMENT_ROUTE_PATH)
  const content = buildDonateToEmpowermentContent(cms)
  return <DonateToEmpowermentPageView content={content} siteUrl={site} />
}
