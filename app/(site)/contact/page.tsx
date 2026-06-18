import type { Metadata } from 'next'
import ContactForm from '@/components/site/ContactForm'
import { CmsPageView } from '@/components/sanity/CmsPageView'
import { buildTrainingCourseMarketingPageDoc } from '@/lib/marketingPages/trainingCourseMarketingPage'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { getCachedCmsPage } from '@/lib/sanity/queries'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'contact'
export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  return buildCmsPageMetadata(buildTrainingCourseMarketingPageDoc(cms, routePath), site)
}

export default async function ContactPage() {
  const cms = await getCachedCmsPage(routePath)
  const page = buildTrainingCourseMarketingPageDoc(cms, routePath)
  return (
    <CmsPageView
      page={page}
      siteUrl={site}
      afterArticle={
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)]">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
            Send a message
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Complete the form below and our team will respond as soon as possible.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      }
    />
  )
}
