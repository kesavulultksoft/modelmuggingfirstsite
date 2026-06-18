import { unstable_cache } from 'next/cache'

import { getSanityClient } from '@/lib/sanity/client'
import { categorizeRoutePath, routePathToHref } from '@/lib/siteSearch/categorize'
import { extractPageSearchText } from '@/lib/siteSearch/extractText'
import type { SiteSearchEntry } from '@/lib/siteSearch/types'

function normalizeSearchBlob(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

const SEARCH_INDEX_QUERY = `*[_type == "page" && defined(routePath)]{
  routePath,
  title,
  seo,
  sections,
  mensBasicContent,
  mensBasicBodyContent,
  mensBasicPlanNextStep,
  mensBasicPageSections,
  mensBasicMainStories,
  mensBasicMainStory,
  homeLandingContent
}`

const STATIC_ENTRIES: SiteSearchEntry[] = [
  {
    id: 'schedule',
    title: 'Class schedule',
    href: '/schedule/',
    category: 'Schedule',
    text: 'schedule classes dates registration enroll find a class upcoming training',
  },
  {
    id: 'register',
    title: 'Enroll / Create account',
    href: '/register/',
    category: 'Account',
    text: 'register enroll create account sign up student portal',
  },
]

async function loadSearchIndexFromSanity(): Promise<SiteSearchEntry[]> {
  const client = getSanityClient()
  const fromCms: SiteSearchEntry[] = []

  if (client) {
    const docs = await client.fetch<Record<string, unknown>[]>(SEARCH_INDEX_QUERY)
    for (const doc of docs || []) {
      const routePath = String(doc.routePath || '').trim()
      if (!routePath) continue
      const title =
        String(doc.title || '').trim() ||
        String((doc.seo as { metaTitle?: string } | undefined)?.metaTitle || '').replace(
          /\s*\|\s*Model Mugging\s*$/i,
          '',
        ) ||
        routePath
      const text = extractPageSearchText(doc)
      fromCms.push({
        id: routePath,
        title,
        href: routePathToHref(routePath),
        category: categorizeRoutePath(routePath),
        text: normalizeSearchBlob(`${title} ${text}`),
      })
    }
  }

  const byId = new Map<string, SiteSearchEntry>()
  for (const e of [...fromCms, ...STATIC_ENTRIES]) {
    byId.set(e.id, e)
  }
  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title))
}

export const getSiteSearchIndex = unstable_cache(
  async () => loadSearchIndexFromSanity(),
  ['site-search-index-v1'],
  { revalidate: 300, tags: ['site-search'] },
)
