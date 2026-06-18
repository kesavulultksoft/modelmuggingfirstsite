/**
 * Marketing hub landings that use generic `sections[]` (hero + rich text + link grids),
 * not the men's-basic `mensBasic*` course template.
 */
export const MARKETING_HUB_ROUTE_PATHS = ['types-of-training'] as const

const HUB_SET = new Set<string>(MARKETING_HUB_ROUTE_PATHS)

export function isMarketingHubRoute(routePath: string | null | undefined): boolean {
  if (!routePath) return false
  return HUB_SET.has(routePath)
}
