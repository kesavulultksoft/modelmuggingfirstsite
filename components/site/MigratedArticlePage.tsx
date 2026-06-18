import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import JsonLd from '@/components/site/JsonLd'
import { HubLinksPresetContent } from '@/components/site/HubLinksPreset'
import { ResourceLinksSection } from '@/components/site/MarketingResourceLinkGrid'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import { ArticleFooterNav } from '@/components/site/ArticleFooterNav'
import { formatTitleCase } from '@/lib/formatTitleCase'
import type { MigratedPageDef } from '@/lib/migratedSitePages'
import { isLocationMigratedHubPath } from '@/lib/marketingPages/locationMigratedHubPaths'
import { getMoreInLocationsLinksForPath } from '@/lib/marketingPages/locationHubPreFooter'
import {
  isMarketingArticleHubPath,
  isMarketingKnowledgeHubPath,
  isMarketingTestimonialsHubPath,
} from '@/lib/marketingPages/marketingArticleMigratedHubPaths'
import {
  getMoreInTestimonialsLinks,
  getMoreInWhyModelMuggingLinks,
} from '@/lib/marketingPages/marketingArticlePreFooter'

export type MigratedArticlePageProps = {
  def: MigratedPageDef
  path: string
  siteUrl: string
  livePs: string[] | null
  heroEyebrow: string
  heroTitle: string
  heroSubtitle: string
  back?: { href: string; label: string }
  showEyebrow: boolean
}

export function MigratedArticlePage({
  def,
  path,
  siteUrl,
  livePs,
  heroEyebrow,
  heroTitle,
  heroSubtitle,
  back,
  showEyebrow,
}: MigratedArticlePageProps) {
  const isHub = Boolean(def.hubPreset)
  const hasResourceGrids = Boolean(def.resourceGrids?.length)
  const isMarketingArticle = isMarketingArticleHubPath(path)
  const useLive = Boolean(livePs && livePs.length >= 3 && !isHub && !isMarketingArticle)

  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: heroTitle,
    description: def.description,
    url: canonicalPageUrl(siteUrl, path),
    publisher: { '@type': 'Organization', name: 'Model Mugging', url: siteUrl },
  }

  return (
    <div>
      <JsonLd data={articleJson} />
      <PageHero
        maxWidth="7xl"
        eyebrow={heroEyebrow}
        title={heroTitle}
        subtitle={heroSubtitle}
        back={back}
        showEyebrow={showEyebrow}
      />
      <SiteMain>
        <article itemScope itemType="https://schema.org/Article">
          <meta itemProp="headline" content={heroTitle} />
          <div className="text-base">
            {useLive ? (
              <div className="prose-site space-y-5 leading-relaxed text-slate-800">
                {livePs!.map((para, i) => (
                  <p key={i} itemProp={i === 0 ? 'description' : undefined}>
                    {para}
                  </p>
                ))}
                {!hasResourceGrids ? (
                  <aside className="rounded-2xl border border-teal-100 bg-teal-50/40 px-5 py-4 text-sm text-slate-600">
                    Primary copy is synced from the public Model Mugging site for accuracy.{' '}
                    <a
                      href={`https://modelmugging.org/${path}/`}
                      className="font-semibold text-teal-800 underline hover:text-teal-950"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open original page
                    </a>
                  </aside>
                ) : null}
              </div>
            ) : (
              <div className="prose-site">
                {def.sections.map((s, i) => (
                  <section key={i} className="mb-10 scroll-mt-24">
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                      {s.heading}
                    </h2>
                    {s.paragraphs.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </section>
                ))}
                {!isHub && !hasResourceGrids ? (
                  <aside className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                    Showing curated summary — live site sync unavailable.{' '}
                    <a
                      href={`https://modelmugging.org/${path}/`}
                      className="font-semibold text-teal-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read full page on modelmugging.org
                    </a>
                  </aside>
                ) : null}
              </div>
            )}
            {hasResourceGrids
              ? def.resourceGrids!.map((g, i) => (
                  <ResourceLinksSection
                    key={i}
                    title={g.title}
                    subtitle={g.subtitle}
                    links={g.links}
                  />
                ))
              : null}
            {isHub && def.hubPreset ? (
              <HubLinksPresetContent preset={def.hubPreset} title="Browse resources" />
            ) : null}
            {isLocationMigratedHubPath(path)
              ? (() => {
                  const moreLinks = getMoreInLocationsLinksForPath(path)
                  return moreLinks.length > 0 ? (
                    <ResourceLinksSection
                      title="More in Locations"
                      subtitle="Continue browsing related pages from the same section."
                      links={moreLinks}
                    />
                  ) : null
                })()
              : null}
            {isMarketingKnowledgeHubPath(path)
              ? (() => {
                  const moreLinks = getMoreInWhyModelMuggingLinks(path)
                  return moreLinks.length > 0 ? (
                    <ResourceLinksSection
                      title="More in Why Model Mugging"
                      subtitle="Continue browsing related pages from the same section."
                      links={moreLinks}
                    />
                  ) : null
                })()
              : null}
            {isMarketingTestimonialsHubPath(path)
              ? (() => {
                  const moreLinks = getMoreInTestimonialsLinks(path)
                  return moreLinks.length > 0 ? (
                    <ResourceLinksSection
                      title="More in Testimonials"
                      subtitle="Continue browsing related pages from the same section."
                      links={moreLinks}
                    />
                  ) : null
                })()
              : null}
            {isLocationMigratedHubPath(path) || isMarketingArticleHubPath(path) ? (
              <section className="mt-12 scroll-mt-24 border-t border-slate-200/90 pt-10">
                <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                  Quick questions
                </h2>
                <div className="space-y-3">
                  <details className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm open:shadow-md">
                    <summary className="cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-2">
                        How do I register?
                        <span className="text-teal-600 transition group-open:rotate-180">▼</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      Open the{' '}
                      <Link href="/schedule/" className="font-semibold text-teal-800 underline hover:text-teal-950">
                        {formatTitleCase('class schedule')}
                      </Link>
                      , pick your city and dates, and follow the registration flow for that course. If you get
                      stuck, use{' '}
                      <Link href="/contact/" className="font-semibold text-teal-800 underline hover:text-teal-950">
                        Contact
                      </Link>{' '}
                      and we will help.
                    </p>
                  </details>
                  <details className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm open:shadow-md">
                    <summary className="cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-2">
                        Can I ask for help choosing the right class?
                        <span className="text-teal-600 transition group-open:rotate-180">▼</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      Yes. Read the{' '}
                      <Link href="/training/" className="font-semibold text-teal-800 underline hover:text-teal-950">
                        {formatTitleCase('training overview')}
                      </Link>{' '}
                      to see how programs fit together, or use{' '}
                      <Link href="/contact/" className="font-semibold text-teal-800 underline hover:text-teal-950">
                        Contact
                      </Link>{' '}
                      with your city and availability—we will suggest the right format.
                    </p>
                  </details>
                </div>
              </section>
            ) : null}
          </div>
          <ArticleFooterNav />
        </article>
      </SiteMain>
    </div>
  )
}
