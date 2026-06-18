export type SiteSearchEntry = {
  id: string
  title: string
  href: string
  category: string
  /** Lowercased blob for matching */
  text: string
}

export type SiteSearchResult = {
  id: string
  title: string
  href: string
  category: string
  snippet: string
  score: number
}
