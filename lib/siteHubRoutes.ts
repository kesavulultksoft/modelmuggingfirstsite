/**
 * CMS hub pages for home section CTAs — paths match Sanity `routePath` (no leading slash, no trailing slash in CMS).
 * Site uses `trailingSlash: true`; use `hubHref()` for Link hrefs (public URLs end with `/`).
 *
 * In Sanity Studio, create one **Page** per row with this exact URL path + a **Hero** block and a **Resource links (hub)**
 * block using the matching preset:
 *
 * | routePath | hub preset | Optional Sanity images |
 * |-----------|------------|-------------------------|
 * | self-defense-training-program-overview | trainingProgramOverview | Three bucket headers (training / locations / testimonials) |
 * | defend-time-and-money-in-self-defense-training | defendTimeAndMoney | Two bucket headers (planning & value, video series) |
 * | self-defense-media-and-products | mediaAndProducts | Podcast + videos |
 * | become-part-of-the-personal-safety-collective | safetyCollective | Give & train, stay informed, reach us |
 * | self-defense-knowledge-center | knowledgeCenter | Philosophy & science, choices & prevention, tools & articles |
 *
 * **Seed default Sanity documents** (from `mmcms/`, with Studio env configured):
 * - `npm run seed:marketing` — core marketing pages **plus** hub landings and hub bucket pages (same as the two commands below).
 * - `npm run seed:hub-pages` — five hub landing Pages only (hero + intro + hub link preset).
 * - `npm run seed:hub-buckets` — thirteen bucket destination Pages only (hero + intro + CTA).
 * Next.js still serves built-in copy from `MIGRATED_SITE_PAGES` when no CMS document exists.
 */
export const SITE_HUB_ROUTES = {
  trainingProgramOverview: 'self-defense-training-program-overview',
  defendTimeAndMoney: 'defend-time-and-money-in-self-defense-training',
  mediaAndProducts: 'self-defense-media-and-products',
  safetyCollective: 'become-part-of-the-personal-safety-collective',
  knowledgeCenter: 'self-defense-knowledge-center',
} as const

export type SiteHubKey = keyof typeof SITE_HUB_ROUTES

export function hubHref(key: SiteHubKey): string {
  return `/${SITE_HUB_ROUTES[key]}/`
}
