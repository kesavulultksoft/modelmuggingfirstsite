/**
 * Marketing pages that use the men's-basic course layout (`mensBasic*` fields +
 * `buildTrainingCourseMarketingPageDoc`). Excludes hub landings only.
 */
import {
  LOCATIONS_NAV,
  TESTIMONIALS_NAV,
  TRAINING_NAV,
  WHY_NAV,
  type NavChild,
} from '@/components/site/siteMarketingLinks'

/** Hub pages that stay on generic CMS / dedicated hub layouts (not course-style). */
export const COURSE_STYLE_HUB_EXCLUDED = new Set([
  'locations',
  'training',
  'types-of-training',
  'home',
])

function hrefToRoutePath(href: string): string {
  const noQuery = href.split('?')[0].split('#')[0]
  return noQuery.replace(/^\/+|\/+$/g, '')
}

function pathsFromNav(nav: NavChild[]): string[] {
  return nav
    .map((item) => hrefToRoutePath(item.href))
    .filter((p) => p.length > 0 && !COURSE_STYLE_HUB_EXCLUDED.has(p))
}

const trainingCoursePaths = pathsFromNav(TRAINING_NAV)
const locationPaths = pathsFromNav(LOCATIONS_NAV)
const whyPaths = pathsFromNav(WHY_NAV)
const testimonialPaths = pathsFromNav(TESTIMONIALS_NAV)

export const COURSE_STYLE_MARKETING_ROUTE_PATHS: readonly string[] = [
  ...new Set([
    ...trainingCoursePaths,
    ...locationPaths,
    ...whyPaths,
    ...testimonialPaths,
    'contact',
    'group-course-application',
  ]),
].sort()

const ROUTE_SET = new Set<string>(COURSE_STYLE_MARKETING_ROUTE_PATHS)

export function isCourseStyleMarketingRoute(routePath: string | null | undefined): boolean {
  if (!routePath) return false
  return ROUTE_SET.has(routePath)
}

/** Training dropdown course pages (subset of course-style routes). */
export const TRAINING_COURSE_MARKETING_ROUTE_PATHS: readonly string[] = trainingCoursePaths

export type TrainingCourseMarketingRoutePath = (typeof TRAINING_COURSE_MARKETING_ROUTE_PATHS)[number]

export function isTrainingCourseMarketingRoute(routePath: string | null | undefined): boolean {
  return isCourseStyleMarketingRoute(routePath)
}
