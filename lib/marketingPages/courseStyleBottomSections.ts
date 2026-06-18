import type { CmsImageCardsSection } from '@/lib/sanity/types'
import { getMoreInLocationsLinksForPath } from '@/lib/marketingPages/locationHubPreFooter'
import {
  getMoreInTestimonialsLinks,
  getMoreInWhyModelMuggingLinks,
} from '@/lib/marketingPages/marketingArticlePreFooter'
import { isLocationMigratedHubPath } from '@/lib/marketingPages/locationMigratedHubPaths'
import { isMarketingTestimonialsHubPath } from '@/lib/marketingPages/marketingArticleMigratedHubPaths'
import { isMarketingKnowledgeHubPath } from '@/lib/marketingPages/marketingArticleMigratedHubPaths'
import mensDefaults from '@/lib/marketingPages/mens-basic.defaults.json'
import { TRAINING_COURSE_MARKETING_ROUTE_PATHS } from '@/lib/marketingPages/courseStyleMarketingRoutes'

const TRAINING_COURSE_ROUTE_SET = new Set<string>(TRAINING_COURSE_MARKETING_ROUTE_PATHS)

function cardsFromLinks(
  links: { href: string; label: string; description?: string; linkLabel?: string }[],
  keyPrefix: string,
): NonNullable<CmsImageCardsSection['cards']> {
  return links.map((link, i) => ({
    _key: `${keyPrefix}-${i}`,
    _type: 'object' as const,
    title: link.label,
    description: link.description || `Open ${link.label} details and context.`,
    href: link.href.replace(/\/$/, '') || link.href,
    linkLabel: link.linkLabel || 'Open page',
  }))
}

function section(
  title: string,
  subtitle: string,
  cards: CmsImageCardsSection['cards'],
  key: string,
): CmsImageCardsSection {
  return {
    _key: key,
    _type: 'imageCardsSection',
    title,
    subtitle,
    cards,
  }
}

/** Default bottom link grids per route cluster (matches men's basic pattern). */
export function getDefaultCourseStyleBottomSections(routePath: string): CmsImageCardsSection[] {
  if (routePath === 'contact') {
    return [
      section(
        'Helpful links',
        'Common next actions from the contact page.',
        cardsFromLinks(
          [
            { href: '/schedule', label: 'Class schedule', linkLabel: 'Open schedule' },
            { href: '/locations', label: 'Locations', linkLabel: 'Browse locations' },
            { href: '/training', label: 'Training overview', linkLabel: 'Open page' },
          ],
          'contact',
        ),
        'contact-links',
      ),
    ]
  }

  if (routePath === 'group-course-application') {
    return [
      section(
        'More for organizations',
        'Continue browsing related pages from the same section.',
        cardsFromLinks(
          [
            {
              href: '/schedule',
              label: 'Class schedule',
              description: 'Browse open public courses and regional dates.',
              linkLabel: 'Open page',
            },
            {
              href: '/hosting-self-defense-classes-or-training',
              label: 'Hosting overview',
              description: 'How hosting works, minimums, and venue expectations.',
              linkLabel: 'Open page',
            },
            {
              href: '/contact',
              label: 'Contact',
              description: 'Ask questions or follow up on a submitted application.',
              linkLabel: 'Open page',
            },
          ],
          'group-course',
        ),
        'group-course-links',
      ),
    ]
  }

  if (isLocationMigratedHubPath(routePath)) {
    const cards = cardsFromLinks(getMoreInLocationsLinksForPath(routePath), `loc-${routePath}`) ?? []
    if (!cards.length) return []
    return [
      section(
        'More in Locations',
        'Continue browsing related pages from the same section.',
        cards,
        `more-locations-${routePath}`,
      ),
    ]
  }

  if (isMarketingKnowledgeHubPath(routePath)) {
    const cards = cardsFromLinks(getMoreInWhyModelMuggingLinks(routePath), `why-${routePath}`) ?? []
    if (!cards.length) return []
    return [
      section(
        'More in Why Model Mugging',
        'Continue browsing related pages from the same section.',
        cards,
        `more-why-${routePath}`,
      ),
    ]
  }

  if (isMarketingTestimonialsHubPath(routePath)) {
    const cards = cardsFromLinks(getMoreInTestimonialsLinks(routePath), `test-${routePath}`) ?? []
    if (!cards.length) return []
    return [
      section(
        'More in Testimonials',
        'Continue browsing related pages from the same section.',
        cards,
        `more-testimonials-${routePath}`,
      ),
    ]
  }

  if (TRAINING_COURSE_ROUTE_SET.has(routePath)) {
    return (mensDefaults.mensBasicPageSections || []) as CmsImageCardsSection[]
  }

  return (mensDefaults.mensBasicPageSections || []) as CmsImageCardsSection[]
}
