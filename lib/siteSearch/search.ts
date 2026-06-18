import type { SiteSearchEntry, SiteSearchResult } from './types'

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function snippetAround(text: string, query: string, maxLen = 140): string {
  const lower = text.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')

  const terms = q.split(/\s+/).filter(Boolean)
  let idx = -1
  for (const term of terms) {
    const i = lower.indexOf(term)
    if (i >= 0) {
      idx = i
      break
    }
  }
  if (idx < 0) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')

  const start = Math.max(0, idx - 50)
  const slice = text.slice(start, start + maxLen).trim()
  const prefix = start > 0 ? '…' : ''
  const suffix = start + maxLen < text.length ? '…' : ''
  return `${prefix}${slice}${suffix}`
}

function scoreEntry(entry: SiteSearchEntry, query: string): number {
  const q = normalize(query)
  if (!q) return 0

  const title = normalize(entry.title)
  const text = entry.text
  const terms = q.split(/\s+/).filter(Boolean)
  if (!terms.length) return 0

  let score = 0
  for (const term of terms) {
    if (title.includes(term)) score += 40
    if (title === term) score += 30
    if (text.includes(term)) score += 12
    if (entry.id.includes(term.replace(/\s+/g, '-'))) score += 8
  }

  if (title.includes(q)) score += 25
  if (text.includes(q)) score += 15

  return score
}

export function searchSiteIndex(
  entries: SiteSearchEntry[],
  query: string,
  limit = 20,
): SiteSearchResult[] {
  const q = query.trim()
  if (!q || q.length < 2) return []

  const ranked = entries
    .map((entry) => {
      const score = scoreEntry(entry, q)
      if (score <= 0) return null
      const raw = entry.text
      const snippet = snippetAround(raw, q)
      return {
        id: entry.id,
        title: entry.title,
        href: entry.href,
        category: entry.category,
        snippet,
        score,
      } satisfies SiteSearchResult
    })
    .filter((r): r is SiteSearchResult => r != null)
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, limit)
}
