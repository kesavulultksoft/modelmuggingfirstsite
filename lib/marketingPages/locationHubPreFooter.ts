import type { ResourceGridLink } from '@/components/site/siteMarketingLinks'

/** Cross-links shown before the footer on every location migrated hub page (matches prior CMS pattern). */
const MORE_IN_LOCATIONS_RELATED: ResourceGridLink[] = [
  {
    href: '/california-self-defense-training-locations',
    label: 'California',
    description: 'Open California details and local context.',
    linkLabel: 'Open page',
  },
  {
    href: '/san-francisco-bay-area-self-defense-classes-for-women',
    label: 'San Francisco Bay Area',
    description: 'Open San Francisco Bay Area details and local context.',
    linkLabel: 'Open page',
  },
  {
    href: '/los-angeles-self-defense',
    label: 'Los Angeles',
    description: 'Open Los Angeles details and local context.',
    linkLabel: 'Open page',
  },
  {
    href: '/san-diego-self-defense-classes-for-women',
    label: 'San Diego',
    description: 'Open San Diego details and local context.',
    linkLabel: 'Open page',
  },
  {
    href: '/seattle-tacoma-self-defense-classes-for-women',
    label: 'Seattle / Tacoma',
    description: 'Open Seattle / Tacoma details and local context.',
    linkLabel: 'Open page',
  },
  {
    href: '/boston-self-defense-classes-for-women',
    label: 'Boston',
    description: 'Open Boston details and local context.',
    linkLabel: 'Open page',
  },
]

export function getMoreInLocationsLinksForPath(routePath: string): ResourceGridLink[] {
  return MORE_IN_LOCATIONS_RELATED.filter((l) => l.href.replace(/^\//, '') !== routePath)
}
