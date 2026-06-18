import type { Metadata } from 'next'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import type { CmsPageDocument } from './types'

function displayTitle(page: CmsPageDocument) {
  if (page.seo?.metaTitle?.trim()) return page.seo.metaTitle.trim()
  const t = page.title.trim()
  if (t.includes('|')) return t
  return `${t.replace(/\s*\|\s*Model Mugging\s*$/i, '').trim()} | Model Mugging`
}

export function buildCmsPageMetadata(page: CmsPageDocument, site: string): Metadata {
  const path = page.routePath
  const url = canonicalPageUrl(site, path)
  const title = displayTitle(page)
  const description = page.seo?.metaDescription || page.title
  const canonical = page.seo?.canonicalUrl?.trim() || url

  return {
    title,
    description,
    keywords: page.seo?.keywords,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'Model Mugging',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}
