import { isLocationMigratedHubPath } from '@/lib/marketingPages/locationMigratedHubPaths'
import {
  isMarketingKnowledgeHubPath,
  isMarketingTestimonialsHubPath,
} from '@/lib/marketingPages/marketingArticleMigratedHubPaths'

export function getCourseStyleHeroEyebrow(routePath: string): string {
  if (routePath === 'contact') return 'Contact'
  if (routePath === 'group-course-application') return 'Organizations'
  if (isLocationMigratedHubPath(routePath)) return 'Locations'
  if (isMarketingKnowledgeHubPath(routePath)) return 'Why Model Mugging'
  if (isMarketingTestimonialsHubPath(routePath)) return 'Testimonials'
  return 'Training'
}
