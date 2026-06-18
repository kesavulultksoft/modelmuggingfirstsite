import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'trainers'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'Become a trainer',
  description: 'Apply to teach Model Mugging — dynamic instructors who help students become safer.',
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function TrainersPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  return (
    <div>
      <PageHero maxWidth="7xl" eyebrow="Careers" title="Become a trainer" />
      <SiteMain>
        <div className="prose-site">
          <p>
            We want instructors who stay calm under pressure, coach well in small groups, and care
            about student transformation. The path includes application, background check,
            interviews, and certification.
          </p>
          <h2>Typical steps</h2>
          <ol className="list-decimal space-y-2 pl-6 text-slate-600">
            <li>Submit the online application.</li>
            <li>Staff reviews background and experience.</li>
            <li>Interviews and onboarding for qualified candidates.</li>
            <li>Certified trainers access scheduling and course tools.</li>
          </ol>
          <p className="mt-8 rounded-xl border border-teal-200/60 bg-teal-50/50 p-4 text-sm text-slate-800">
            Start your trainer application on{' '}
            <Link href="/apply/trainer">Apply to become a trainer</Link>. Or{' '}
            <Link href="/contact">contact us</Link> to get started.
          </p>
        </div>
      </SiteMain>
    </div>
  )
}
