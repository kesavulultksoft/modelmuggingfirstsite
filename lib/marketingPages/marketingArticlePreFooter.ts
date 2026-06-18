import type { ResourceGridLink } from '@/components/site/siteMarketingLinks'
import { OVERVIEW_TESTIMONIALS_BUCKET, WHY_NAV } from '@/components/site/siteMarketingLinks'

function withTrailingSlash(href: string) {
  if (href.endsWith('/')) return href
  return `${href}/`
}

/** Rich cards for “Why Model Mugging” cluster (from legacy nav). */
const MORE_IN_WHY_BASE: ResourceGridLink[] = WHY_NAV.map((l) => ({
  href: withTrailingSlash(l.href),
  label: l.label,
  description: `Open ${l.label} details and local context.`,
  linkLabel: 'Open page',
}))

export function getMoreInWhyModelMuggingLinks(routePath: string): ResourceGridLink[] {
  const normalized = routePath.replace(/\/$/, '')
  return MORE_IN_WHY_BASE.filter((l) => l.href.replace(/^\//, '').replace(/\/$/, '') !== normalized)
}

const MORE_IN_TESTIMONIALS_BASE: ResourceGridLink[] = OVERVIEW_TESTIMONIALS_BUCKET.map((l) => ({
  href: withTrailingSlash(l.href),
  label: l.label,
  description: `Open ${l.label.replace(/\s+/g, ' ')} details and context.`,
  linkLabel: 'Open page',
}))

export function getMoreInTestimonialsLinks(routePath: string): ResourceGridLink[] {
  const normalized = routePath.replace(/\/$/, '')
  return MORE_IN_TESTIMONIALS_BASE.filter((l) => l.href.replace(/^\//, '').replace(/\/$/, '') !== normalized)
}
