import type { CmsPageDocument } from '@/lib/sanity/types'
import { buildTrainingCourseMarketingPageDoc } from '@/lib/marketingPages/trainingCourseMarketingPage'

export const MENS_BASIC_ROUTE_PATH = 'mens-basic-self-defense'

export function buildMensBasicCoursePageDoc(cms: CmsPageDocument | null): CmsPageDocument {
  return buildTrainingCourseMarketingPageDoc(cms, MENS_BASIC_ROUTE_PATH)
}
