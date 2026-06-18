import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import { formatTitleCase } from '@/lib/formatTitleCase'
import SiteMain from '@/components/site/SiteMain'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'faq'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Model Mugging full-force self defense courses.',
}

const ITEMS = [
  {
    q: 'What makes Model Mugging different?',
    a: 'Small classes, a padded assailant, and full-force practice so your body remembers under stress — not just theory.',
  },
  {
    q: 'How do I register for a class?',
    a: 'Browse the schedule, choose your city and dates, open the course page, and complete registration and payment online.',
  },
  {
    q: 'Who can take a basic course?',
    a: 'Most basic courses are designed for women; we also offer programs for teens, children, and men’s courses in select regions. Check the schedule for offerings near you.',
  },
  {
    q: 'Do you offer group or corporate training?',
    a: 'Yes. See our group course application and hosting overview, or contact us with your organization’s needs.',
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function FaqPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  return (
    <div>
      <PageHero
        maxWidth="7xl"
        eyebrow="Help"
        title="Frequently asked questions"
        subtitle="Quick answers about training, registration, and what to expect."
      />
      <SiteMain>
        <div className="space-y-3">
          {ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:shadow-md"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-2">
                  {item.q}
                  <span className="text-teal-600 transition group-open:rotate-180">▼</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-sm text-slate-600">
          More questions?{' '}
          <Link href="/contact" className="font-semibold text-teal-700 hover:underline">
            {formatTitleCase('Contact us')}
          </Link>{' '}
          or browse{' '}
          <Link href="/training" className="font-semibold text-teal-700 hover:underline">
            {formatTitleCase('training types')}
          </Link>
          .
        </p>
      </SiteMain>
    </div>
  )
}
