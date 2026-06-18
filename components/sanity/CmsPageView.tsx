import type { ReactNode } from 'react'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import JsonLd from '@/components/site/JsonLd'
import { ResourceLinksSection } from '@/components/site/MarketingResourceLinkGrid'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import { ArticleFooterNav } from '@/components/site/ArticleFooterNav'
import { getCmsAppendedResourceGrids } from '@/lib/cmsCuratedAppend'
import { SHOW_PAGE_CTA_SECTION } from '@/lib/sanity/cmsVisibility'
import type { CmsHeroSection, CmsPageDocument, CmsSection } from '@/lib/sanity/types'
import { CmsSectionBlocks } from './CmsSectionBlocks'

function heroTitle(page: CmsPageDocument) {
  const t = page.seo?.metaTitle || page.title
  return t.replace(/\s*\|\s*Model Mugging\s*$/i, '').trim()
}

export function CmsPageView({
  page,
  siteUrl,
  afterArticle,
}: {
  page: CmsPageDocument
  siteUrl: string
  /** Rendered inside the article, before the footer nav (e.g. contact form). */
  afterArticle?: ReactNode
}) {
  const sections = page.sections ?? []
  const path = page.routePath
  const url = canonicalPageUrl(siteUrl, path)

  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: heroTitle(page),
    description: page.seo?.metaDescription || page.title,
    url,
    publisher: { '@type': 'Organization', name: 'Model Mugging', url: siteUrl },
  }

  const heroSections = sections.filter((s): s is CmsHeroSection => s._type === 'heroSection')
  const nonHeroSections = sections.filter((s) => s._type !== 'heroSection') as CmsSection[]

  const nonHeroForLayout = SHOW_PAGE_CTA_SECTION
    ? nonHeroSections
    : (nonHeroSections.filter((s) => s._type !== 'ctaSection') as CmsSection[])

  const appendedResourceGrids = getCmsAppendedResourceGrids(path, nonHeroForLayout)

  const ctaSections = SHOW_PAGE_CTA_SECTION
    ? nonHeroForLayout.filter((s) => s._type === 'ctaSection')
    : []
  const sectionsBeforeResourceGrids = appendedResourceGrids
    ? (nonHeroForLayout.filter((s) => s._type !== 'ctaSection') as CmsSection[])
    : nonHeroForLayout

  return (
    <div>
      <JsonLd data={articleJson} />
      {heroSections.length > 0 ? (
        heroSections.map((h, i) => (
          <PageHero
            key={h._key || `hero-${i}-${h.title || 'untitled'}`}
            maxWidth="7xl"
            eyebrow={h.eyebrow ?? ''}
            title={(h.title || page.title).replace(/\s*\|\s*Model Mugging\s*$/i, '').trim()}
            subtitle={h.subtitle || page.seo?.metaDescription || ''}
            back={
              h.backHref && h.backLabel ? { href: h.backHref, label: h.backLabel } : undefined
            }
            showEyebrow={Boolean(h.eyebrow?.trim())}
          />
        ))
      ) : (
        <PageHero
          maxWidth="7xl"
          eyebrow=""
          title={heroTitle(page)}
          subtitle={page.seo?.metaDescription || ''}
          showEyebrow={false}
        />
      )}

      <SiteMain>
        <article itemScope itemType="https://schema.org/Article">
          <meta itemProp="headline" content={heroTitle(page)} />
          <CmsSectionBlocks sections={sectionsBeforeResourceGrids} />
          {appendedResourceGrids
            ? appendedResourceGrids.map((g, i) => (
                <ResourceLinksSection
                  key={i}
                  title={g.title}
                  subtitle={g.subtitle}
                  links={g.links}
                />
              ))
            : null}
          {appendedResourceGrids && ctaSections.length > 0 ? (
            <div className="mt-14 scroll-mt-24 border-t border-slate-200/90 pt-10 sm:mt-16 sm:pt-12">
              <CmsSectionBlocks sections={ctaSections} />
            </div>
          ) : null}
          {afterArticle ? <div className="mt-10">{afterArticle}</div> : null}
          <ArticleFooterNav />
        </article>
      </SiteMain>
    </div>
  )
}
