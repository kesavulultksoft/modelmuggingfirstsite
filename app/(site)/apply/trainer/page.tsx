import type { Metadata } from 'next'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import TrainerApplicationLeadSection from './TrainerApplicationLeadSection'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'apply/trainer'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'Trainer application | Model Mugging',
  description: 'Apply to become a Model Mugging certified trainer.',
}

/** Next.js replacement entry for legacy Angular /instructor-application */
export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

/**
 * Option C always needs the public lead form here. A Sanity page with the same `routePath` is used only for
 * {@link generateMetadata} (SEO); rendering `CmsPageView` instead hid the form when CMS content existed.
 */
export default async function TrainerApplicationPage() {
  return <TrainerApplicationLeadSection />
}
