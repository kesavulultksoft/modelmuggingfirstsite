import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'about'

const fallbackMetadata: Metadata = {
  title: 'About Model Mugging',
  description:
    'Since 1971, Model Mugging — full-force self defense, padded-assailant training, small classes.',
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function AboutPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  return (
    <div>
      <PageHero maxWidth="7xl" eyebrow="About" title="About Model Mugging" />
      <SiteMain>
        <div className="prose-site text-base">
          <p>
            Model Mugging started as research into what works when someone is attacked. The answer
            was <strong>stress training</strong> — practicing under adrenaline with a padded
            role-player so your body responds when it counts.
          </p>
          <section
            id="why-model-mugging"
            className="scroll-mt-24 rounded-2xl border border-teal-100 bg-gradient-to-br from-slate-50 to-teal-50/40 p-6 sm:p-8"
          >
            <h2 className="!mt-0 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              Why Model Mugging?
            </h2>
            <p className="!mb-0 text-slate-700">
              Unlike lecture-only or one-off workshops, you train at full intensity against padded
              gear — so if you ever need to fight, you&apos;ve already done it under stress. Small
              classes, trauma-informed coaching, and a graduation that proves you finished something
              hard. That combination is why graduates report real-world success.
            </p>
          </section>
          <h2>What we believe</h2>
          <ul>
            <li>Everyone deserves to feel safer day to day.</li>
            <li>Small classes beat one-size-fits-all lectures.</li>
            <li>Full-force practice (safely) builds real confidence.</li>
            <li>Instructors respect boundaries and trauma.</li>
          </ul>
          <h2>Find a class</h2>
          <p>
            <Link href="/schedule">Browse the live schedule</Link> for cities and dates.
          </p>
        </div>
      </SiteMain>
    </div>
  )
}
