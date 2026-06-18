import { LOCATIONS_NAV, type NavChild, type ResourceGridLink } from '@/components/site/siteMarketingLinks'
import { isCourseStyleMarketingRoute } from '@/lib/marketingPages/courseStyleMarketingRoutes'
import { isMarketingHubRoute } from '@/lib/marketingPages/marketingHubRoutes'
import { MIGRATED_SITE_PAGES } from '@/lib/migratedSitePages'
import type { CmsSection } from '@/lib/sanity/types'

export type CmsAppendedResourceGrid = {
  title: string
  subtitle?: string
  links: (NavChild | ResourceGridLink)[]
}

/**
 * When a route is served from Sanity but Studio has no hub/resource link block,
 * append the same curated grids as the migrated fallback (types-of-training, locations).
 */
export function getCmsAppendedResourceGrids(
  routePath: string,
  sections: CmsSection[]
): CmsAppendedResourceGrid[] | null {
  if (sections.some((s) => s._type === 'hubLinksSection' || s._type === 'imageCardsSection')) {
    return null
  }

  if (isMarketingHubRoute(routePath)) return null

  if (isCourseStyleMarketingRoute(routePath)) return null

  if (routePath === 'locations') {
    return [{ title: 'Browse resources', links: LOCATIONS_NAV }]
  }

  const def = MIGRATED_SITE_PAGES[routePath]
  if (def?.resourceGrids?.length) return def.resourceGrids

  return null
}
