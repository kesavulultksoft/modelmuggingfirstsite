import { isCourseStyleMarketingRoute } from '@/lib/marketingPages/courseStyleMarketingRoutes'

/** Course-style pages use Portable Text with inline links in Sanity. */
export function usesCourseStyleRichText(routePath: string | null | undefined): boolean {
  return isCourseStyleMarketingRoute(routePath)
}
