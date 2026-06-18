/** Dashboard hubs only highlight on exact path; deeper nav items use prefix match. */
const HUBS = new Set([
  '/portal/student',
  '/portal/instructor',
  '/portal/admin',
  '/portal/bgagent',
  '/portal/equip',
])

/** Current URL search e.g. "tab=training" or "" (no leading ?) */
export function isPortalNavActive(
  pathname: string | null,
  href: string,
  currentSearch?: string | null
): boolean {
  if (!pathname) return false
  const hrefParts = href.split('?')
  const hrefPath = hrefParts[0]
  const hrefQuery = hrefParts[1] || ''
  const cur = (currentSearch?.replace(/^\?/, '') || '').trim()

  if (hrefQuery) {
    if (pathname !== hrefPath) return false
    const want = new URLSearchParams(hrefQuery)
    const have = new URLSearchParams(cur)
    for (const [k, v] of want.entries()) {
      if (have.get(k) !== v) return false
    }
    return true
  }

  if (pathname === hrefPath || pathname === href) return true
  if (href === '/' || href.startsWith('/#')) return false
  if (HUBS.has(href)) return false
  if (href.includes('#')) {
    const base = href.split('#')[0]
    return pathname === base || pathname.startsWith(base + '/')
  }
  return pathname.startsWith(hrefPath.endsWith('/') ? hrefPath.slice(0, -1) + '/' : hrefPath + '/')
}
