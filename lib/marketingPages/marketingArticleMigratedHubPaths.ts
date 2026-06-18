/**
 * Marketing / testimonials article routes that always use `MigratedArticlePage`
 * (legacy copy + optional CMS hero), same routing pattern as location hubs.
 */
export const MARKETING_ARTICLE_HUB_PATH_SET = new Set<string>([
  'why-model-mugging-self-defense',
  'crime-prevention',
  'about-self-defense',
  'self-defense-videos',
  'about-us',
  'self-defense-testimonials',
  'personal-testimonials-model-mugging-graduates',
  'success-rate-of-graduates-fighting-back',
  'four-common-self-defense-testimonials',
  'model-mugging-saved-my-life',
  'self-defense-success-stories',
])

/** “Why us” cluster — cross-links under `WHY_NAV` (minus summary About page). */
export const MARKETING_KNOWLEDGE_HUB_PATH_SET = new Set<string>([
  'why-model-mugging-self-defense',
  'crime-prevention',
  'about-self-defense',
  'self-defense-videos',
  'about-us',
])

export function isMarketingArticleHubPath(path: string): boolean {
  return MARKETING_ARTICLE_HUB_PATH_SET.has(path)
}

export function isMarketingKnowledgeHubPath(path: string): boolean {
  return MARKETING_KNOWLEDGE_HUB_PATH_SET.has(path)
}

export function isMarketingTestimonialsHubPath(path: string): boolean {
  return isMarketingArticleHubPath(path) && !MARKETING_KNOWLEDGE_HUB_PATH_SET.has(path)
}
