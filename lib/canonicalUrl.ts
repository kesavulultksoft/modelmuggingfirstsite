/** Canonical article URL with trailing slash (matches `trailingSlash: true` in next.config). */
export function canonicalPageUrl(siteBaseUrl: string, routePath: string): string {
  const base = siteBaseUrl.replace(/\/$/, '')
  const path = routePath.replace(/^\/|\/$/g, '')
  return `${base}/${path}/`
}
