import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'terms'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Model Mugging.',
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function TermsPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  return (
    <div className="min-h-[50vh]">
      <PageHero maxWidth="7xl" eyebrow="Legal" title="Terms of Service" />
      <SiteMain>
        <div className="prose-site space-y-6 text-base">
          <p className="text-slate-600">
            This page is a <strong>placeholder</strong>. Replace with your organization&apos;s
            terms of service, refund policy, class cancellation rules, and liability language
            reviewed by qualified counsel.
          </p>
          <p>
            <Link href="/contact">Contact us</Link> for questions until final terms are published.
          </p>
        </div>
      </SiteMain>
    </div>
  )
}
