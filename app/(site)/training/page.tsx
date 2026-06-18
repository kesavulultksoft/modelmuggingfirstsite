import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import { formatTitleCase } from '@/lib/formatTitleCase'
import SiteMain from '@/components/site/SiteMain'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'
import { CmsPageView } from '@/components/sanity/CmsPageView'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'training'

export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'What we teach',
  description:
    "Women's basic, teens, men's basics, advanced, instructor certification — Model Mugging programs.",
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function TrainingPage() {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return <CmsPageView page={cms} siteUrl={site} />
  const types = [
    {
      name: "Women's basic course",
      desc: 'Flagship weekend or multi-session intensive. Full-force scenarios and graduation demo.',
    },
    {
      name: 'Young teens & children',
      desc: 'Age-appropriate awareness and physical options without overwhelming younger students.',
    },
    {
      name: "Men's basic",
      desc: 'Same methodology, adapted for men seeking realistic self-defense.',
    },
    {
      name: 'Advanced course',
      desc: 'For graduates who want deeper skills and harder scenarios.',
    },
    {
      name: 'Instructor certification',
      desc: 'Application, background check, interviews, and training for future teachers.',
    },
    {
      name: 'Workshops & lectures',
      desc: 'Shorter sessions for schools, workplaces, and communities.',
    },
  ]
  return (
    <div>
      <PageHero
        maxWidth="7xl"
        eyebrow="Programs"
        title="What we teach"
        subtitle="Not sure which fits you? The schedule labels every listing."
      />
      <SiteMain>
        <ul className="space-y-5">
          {types.map((t) => (
            <li
              key={t.name}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-teal-300/50 hover:shadow-md"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
                {t.name}
              </h2>
              <p className="mt-2 text-slate-600">{t.desc}</p>
            </li>
          ))}
        </ul>
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
            Detailed program pages
          </h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['Types of training', '/types-of-training'],
              ['Women’s Basic Course', '/basic-self-defense-class-for-women'],
              ['Course description', '/course-description'],
              ['Teenage self defense', '/teenage-self-defense'],
              ['Classes for children', '/self-defense-classes-for-children'],
              ['For girls', '/self-defense-classes-for-girls'],
              ['Advanced class', '/advanced-self-defense-class'],
              ['Instructor certification', '/self-defense-instructor-training-and-certification'],
              ["Men's basic", '/mens-basic-self-defense'],
              ['Hosting a class', '/hosting-self-defense-classes-or-training'],
              ['Crime prevention lectures', '/crime-prevention-lectures-and-short-courses'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="font-semibold text-teal-700 hover:underline">
                  {formatTitleCase(label)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-slate-50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-900">Ready for dates &amp; cities?</p>
          <Link
            href="/schedule"
            className="inline-flex shrink-0 rounded-xl bg-[#0f172a] px-8 py-3.5 font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a]"
          >
            {formatTitleCase('Open schedule')}
          </Link>
        </div>
      </SiteMain>
    </div>
  )
}
