import type { PortableTextBlock } from '@portabletext/react'

import type { CmsImageField, CmsMensBasicParagraphRow } from '@/lib/sanity/types'

/** Required on each array item for Sanity Studio to show object fields. */
export const MENS_BASIC_PARAGRAPH_ROW_TYPE = 'mensBasicParagraphRow' as const

/** Plain paragraph copy: prefers `text`; falls back to legacy `body`. */
export function paragraphRowPlainText(row: CmsMensBasicParagraphRow): string {
  if (typeof row.text === 'string' && row.text.trim()) return row.text
  if (typeof row.body === 'string' && row.body.trim()) return row.body
  return ''
}

function stampParagraphRow(row: CmsMensBasicParagraphRow): CmsMensBasicParagraphRow {
  const text = paragraphRowPlainText(row)
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  const out: CmsMensBasicParagraphRow = {
    _type: MENS_BASIC_PARAGRAPH_ROW_TYPE,
    _key: row._key,
    title,
    text,
    ...(row.image ? { image: row.image } : {}),
  }
  if (row.image && row.imageLayout != null && String(row.imageLayout).length > 0) {
    out.imageLayout = row.imageLayout
  }
  return out
}

export function stampParagraphRows(rows: CmsMensBasicParagraphRow[]): CmsMensBasicParagraphRow[] {
  return rows.map(stampParagraphRow)
}

export function assetHasRef(asset: unknown): boolean {
  if (!asset || typeof asset !== 'object') return false
  const a = asset as { _ref?: string; _id?: string; url?: string }
  return Boolean(a._ref || a._id || (typeof a.url === 'string' && a.url.length > 0))
}

export function paragraphRowsHaveContent(rows: unknown): rows is CmsMensBasicParagraphRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return false
  return rows.some((r) => {
    const row = r as CmsMensBasicParagraphRow
    const hasTitle = typeof row.title === 'string' && row.title.trim().length > 0
    const hasCopy = paragraphRowPlainText(row).trim().length > 0
    return hasTitle || hasCopy || assetHasRef(row.image?.asset)
  })
}

function portableBlockToPlainText(block: PortableTextBlock): string {
  const ch = block.children as { text?: string }[] | undefined
  if (!Array.isArray(ch)) return ''
  return ch.map((c) => String(c?.text ?? '')).join('')
}

/** Turn legacy portable blocks into one row per text block; images attach to the preceding row. */
export function portableToParagraphRows(blocks: PortableTextBlock[]): CmsMensBasicParagraphRow[] {
  const rows: CmsMensBasicParagraphRow[] = []
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const rec = item as { _type?: string; _key?: string }
    if (rec._type === 'block') {
      const plain = portableBlockToPlainText(item as PortableTextBlock).trim()
      if (plain) rows.push({ _type: MENS_BASIC_PARAGRAPH_ROW_TYPE, _key: rec._key, title: '', text: plain })
    } else if (rec._type === 'image') {
      const img = item as unknown as CmsImageField
      if (rows.length > 0) {
        const last = rows[rows.length - 1]
        rows[rows.length - 1] = { ...stampParagraphRow(last), image: img }
      } else {
        rows.push({ _type: MENS_BASIC_PARAGRAPH_ROW_TYPE, _key: rec._key, title: '', text: '', image: img })
      }
    }
  }
  return rows.filter(
    (r) =>
      (typeof r.title === 'string' && r.title.trim().length > 0) ||
      paragraphRowPlainText(r).trim().length > 0 ||
      assetHasRef(r.image?.asset),
  )
}

export function linesToParagraphRows(lines: string[], keyPrefix: string): CmsMensBasicParagraphRow[] {
  return (lines || [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .map((text, idx) => ({
      _type: MENS_BASIC_PARAGRAPH_ROW_TYPE,
      _key: `${keyPrefix}-${idx}`,
      title: '',
      text,
    }))
}

export function paragraphLinesToPortable(lines: string[], keyPrefix: string): PortableTextBlock[] {
  return (lines || [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .map((line, idx) => ({
      _type: 'block' as const,
      _key: `${keyPrefix}-${idx}`,
      style: 'normal' as const,
      markDefs: [],
      children: [{ _type: 'span' as const, text: line, marks: [] }],
    }))
}

export function singleParagraphPortable(text: string, key: string): PortableTextBlock[] {
  const t = String(text || '').trim()
  if (!t) return []
  return paragraphLinesToPortable([t], key)
}

export function isPortableWithContent(body: unknown): body is PortableTextBlock[] {
  return Array.isArray(body) && body.length > 0
}

/** True when portable text includes at least one inline link mark. */
export function portableHasInlineLinks(body: unknown): boolean {
  if (!Array.isArray(body)) return false
  return body.some((block) => {
    if (!block || typeof block !== 'object') return false
    const defs = (block as PortableTextBlock).markDefs
    if (!Array.isArray(defs)) return false
    return defs.some((def) => {
      if (!def || typeof def !== 'object') return false
      const d = def as { _type?: string; href?: string }
      return d._type === 'link' && Boolean(String(d.href || '').trim())
    })
  })
}

/**
 * When editors still have full copy in legacy portable but only a few (or empty)
 * paragraph rows in the new field, prefer portable so the site matches the richer source.
 * After migrating rows in Studio, legacy portable can be removed.
 */
export function coalesceParagraphRowsPreferRicher(
  rows: CmsMensBasicParagraphRow[] | undefined,
  portable: PortableTextBlock[] | undefined,
): CmsMensBasicParagraphRow[] {
  const fromRows = paragraphRowsHaveContent(rows) ? stampParagraphRows(rows!) : []
  const fromPortable = isPortableWithContent(portable) ? portableToParagraphRows(portable) : []
  if (fromPortable.length > fromRows.length) return fromPortable
  if (fromRows.length > 0) return fromRows
  if (fromPortable.length > 0) return fromPortable
  return []
}
