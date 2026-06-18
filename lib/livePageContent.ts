/**
 * Pull readable body copy from the live WordPress-style site when available.
 * Falls back to curated copy in migratedSitePages when fetch fails.
 */

const LIVE_ORIGIN = 'https://modelmugging.org'

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function stripTags(s: string): string {
  return decodeEntities(
    s
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Returns cleaned paragraphs from live HTML.
 * In development, returns null immediately (fast nav) unless MM_LIVE_SYNC_DEV=1.
 * Production uses a 6s cap so pages still render if the origin is slow.
 */
export async function fetchLiveParagraphs(path: string): Promise<string[] | null> {
  if (process.env.NODE_ENV === 'development' && process.env.MM_LIVE_SYNC_DEV !== '1') {
    return null
  }
  const url = `${LIVE_ORIGIN}/${path.replace(/^\/|\/$/g, '')}/`
  try {
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), 6000)
    const res = await fetch(url, {
      signal: ac.signal,
      headers: {
        Accept: 'text/html',
        'User-Agent': 'ModelMugging-NextSiteSync/1.0',
      },
      next: { revalidate: 86400 },
    })
    clearTimeout(to)
    if (!res.ok) return null
    const html = await res.text()
    const raw = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html
    const chunks = raw.split(/<\/p>/i)
    const out: string[] = []
    for (const c of chunks) {
      const inner = c.replace(/[\s\S]*<p[^>]*>/i, '')
      const t = stripTags(inner)
      if (t.length >= 50 && t.length < 2000) out.push(t)
    }
    if (out.length < 2) {
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      if (h1) {
        const t = stripTags(h1)
        if (t.length > 10) out.unshift(t)
      }
    }
    return out.length ? out.slice(0, 24) : null
  } catch {
    return null
  }
}

export function firstParagraphForDescription(paragraphs: string[]): string {
  const p = paragraphs.find((x) => x.length > 80) ?? paragraphs[0] ?? ''
  return p.slice(0, 165) + (p.length > 165 ? '…' : '')
}
