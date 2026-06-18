import {
  SAN_DIEGO_CITY_PAGE,
  SAN_DIEGO_WORKSHOPS_ROUTE,
} from '@/lib/marketingPages/locationCity/sanDiegoCityPage'
import { enrichLocationCityPlainDefaults } from '@/lib/marketingPages/locationCity/enrichLocationCityPlainDefaults'
import { mergeLocationCityContent } from '@/lib/marketingPages/locationCity/mergeLocationCityContent'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { getCachedCmsPage } from '@/lib/sanity/queries'

const BY_PATH: Record<string, LocationCityPageContent> = {
  'san-diego-self-defense-classes-for-women': SAN_DIEGO_CITY_PAGE,
  [SAN_DIEGO_WORKSHOPS_ROUTE]: {
    ...SAN_DIEGO_CITY_PAGE,
    routePath: SAN_DIEGO_WORKSHOPS_ROUTE,
  },
}

export function getLocationCityPageDefaults(path: string): LocationCityPageContent | null {
  return BY_PATH[path] ?? null
}

/** Code defaults merged with Sanity `locationCityContent` when present. */
export async function getLocationCityPage(path: string): Promise<LocationCityPageContent | null> {
  const base = getLocationCityPageDefaults(path)
  if (!base) return null
  const cms = await getCachedCmsPage(path)
  const merged = mergeLocationCityContent(base, cms?.locationCityContent)
  return enrichLocationCityPlainDefaults(merged)
}
