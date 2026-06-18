import {
  LOCATIONS_NAV,
  TRAINING_NAV,
  WHY_NAV,
  TESTIMONIALS_NAV,
  type NavChild,
} from '@/components/site/siteMarketingLinks'
import type { CmsNavigation } from './types'
import { normalizeNavigation } from './queries'

export type MarketingDropdown = {
  id: string
  label: string
  href: string
  children: NavChild[]
}

const DEFAULT_DROPDOWNS: MarketingDropdown[] = [
  { id: 'locations', label: 'Locations', href: '/locations', children: LOCATIONS_NAV },
  { id: 'training', label: 'Training', href: '/training', children: TRAINING_NAV },
  { id: 'why', label: 'Why us', href: '/why-model-mugging-self-defense', children: WHY_NAV },
  {
    id: 'testimonials',
    label: 'Testimonials',
    href: '/self-defense-testimonials',
    children: TESTIMONIALS_NAV,
  },
]

const DEFAULT_FLAT: NavChild[] = [
  { href: '/schedule', label: 'Find a class' },
  { href: '/contact', label: 'Contact' },
]

/** Flat header links removed by request (still available in footer / deep links). */
function navPathKey(href: string): string {
  const h = href.trim()
  try {
    if (/^https?:\/\//i.test(h)) {
      const u = new URL(h)
      let p = u.pathname
      if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1)
      return p.toLowerCase() || '/'
    }
  } catch {
    /* ignore */
  }
  let p = h.split('?')[0].split('#')[0]
  if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1)
  return p.toLowerCase() || '/'
}

function isAboutSummaryDropdownLink(link: { href?: string | null; label?: string | null }): boolean {
  const path = navPathKey(link.href || '')
  if (path === '/about') return true
  const lab = (link.label || '').trim().toLowerCase()
  if (lab === 'about (summary)') return true
  return false
}

function isExcludedHeaderFlatLink(href: string, label: string): boolean {
  const path = navPathKey(href)
  if (path === '/faq' || path === '/trainers' || path === '/apply/trainer') return true
  const lab = label.trim().toLowerCase()
  if (lab === 'faq') return true
  if (lab.includes('become') && lab.includes('trainer')) return true
  return false
}

/** Right-side utility links (Login, Donate, etc.) — not in center nav. */
function isHeaderUtilityLink(href: string, label: string): boolean {
  const path = navPathKey(href)
  if (path === '/login' || path === '/donate' || path === '/donate-to-empowerment' || path === '/group-course-application')
    return true
  const lab = label.trim().toLowerCase()
  if (lab === 'login') return true
  if (lab === 'donate') return true
  if (lab.includes('group') && lab.includes('course')) return true
  return false
}

const DONATE_EMPOWERMENT_HREF = '/donate-to-empowerment/'

function normalizeHeaderUtilityLink(link: NavChild): NavChild {
  const path = navPathKey(link.href)
  const lab = link.label.trim().toLowerCase()
  if (path === '/donate' || path === '/donate-to-empowerment' || lab === 'donate') {
    return { ...link, href: DONATE_EMPOWERMENT_HREF }
  }
  return link
}

const DEFAULT_UTILITY_LINKS: NavChild[] = [
  { href: '/group-course-application', label: 'Group courses' },
  { href: DONATE_EMPOWERMENT_HREF, label: 'Donate' },
  { href: '/login', label: 'Login' },
]

export function getMarketingDropdowns(cmsNav?: CmsNavigation | null): MarketingDropdown[] {
  const n = normalizeNavigation(cmsNav ?? null)
  if (n?.groups?.length) {
    return n.groups.map((g, i) => ({
      id: `cms-${i}-${(g.label || 'group').replace(/\s+/g, '-').toLowerCase()}`,
      label: g.label || '',
      href: g.overviewHref || '/',
      children: ((g.links ?? []) as NavChild[]).filter((l) => !isAboutSummaryDropdownLink(l)),
    }))
  }
  return DEFAULT_DROPDOWNS
}

export function getMarketingFlatLinks(cmsNav?: CmsNavigation | null): NavChild[] {
  const n = normalizeNavigation(cmsNav ?? null)
  if (n?.flatLinks?.length) {
    return n.flatLinks
      .map((l) => ({
        href: l.href || '#',
        label: l.label || '',
      }))
      .filter(
        (l) => !isExcludedHeaderFlatLink(l.href, l.label) && !isHeaderUtilityLink(l.href, l.label),
      )
  }
  return DEFAULT_FLAT
}

export function getHeaderUtilityLinks(cmsNav?: CmsNavigation | null): NavChild[] {
  const n = normalizeNavigation(cmsNav ?? null)
  if (n?.flatLinks?.length) {
    const fromCms = n.flatLinks
      .map((l) => normalizeHeaderUtilityLink({ href: l.href || '#', label: l.label || '' }))
      .filter((l) => isHeaderUtilityLink(l.href, l.label))
    if (fromCms.length) return fromCms
  }
  return DEFAULT_UTILITY_LINKS
}
