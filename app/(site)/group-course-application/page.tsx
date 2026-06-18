import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CmsPageView } from '@/components/sanity/CmsPageView'
import GroupCourseApplicationSection from '@/components/groupCourse/GroupCourseApplicationSection'
import { buildTrainingCourseMarketingPageDoc } from '@/lib/marketingPages/trainingCourseMarketingPage'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { getCachedCmsPage } from '@/lib/sanity/queries'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'group-course-application'
export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  return buildCmsPageMetadata(buildTrainingCourseMarketingPageDoc(cms, routePath), site)
}

export default async function GroupCourseApplicationPage() {
  const cms = await getCachedCmsPage(routePath)
  return (
    <CmsPageView
      page={buildTrainingCourseMarketingPageDoc(cms, routePath)}
      siteUrl={site}
      afterArticle={
        <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading application…</div>}>
          <GroupCourseApplicationSection />
        </Suspense>
      }
    />
  )
}
