import type { PortableTextBlock } from '@portabletext/react'

import {
  isPortableWithContent,
  paragraphLinesToPortable,
  paragraphRowPlainText,
} from '@/lib/marketingPages/mensBasicPortable'
import type { CmsMensBasicParagraphRow } from '@/lib/sanity/types'

function nonEmptyStrings(arr: string[] | undefined): string[] {
  return (arr || []).map((s) => String(s || '').trim()).filter(Boolean)
}

/**
 * Men's Basic pilot: render Portable Text (inline links) instead of plain paragraph rows.
 * Prefers CMS rich text; otherwise converts plain paragraphs / merged rows for display.
 */
export function resolveMensBasicRichTextSection(params: {
  cmsPortable?: PortableTextBlock[]
  cmsParagraphs?: string[]
  mergedRows: CmsMensBasicParagraphRow[]
}): { content: PortableTextBlock[]; paragraphRows: CmsMensBasicParagraphRow[] } {
  const { cmsPortable, cmsParagraphs, mergedRows } = params

  if (isPortableWithContent(cmsPortable)) {
    return { content: cmsPortable, paragraphRows: [] }
  }

  const fromParagraphs = nonEmptyStrings(cmsParagraphs)
  if (fromParagraphs.length > 0) {
    return { content: paragraphLinesToPortable(fromParagraphs, 'cms-para'), paragraphRows: [] }
  }

  const fromRows = mergedRows.map(paragraphRowPlainText).filter(Boolean)
  if (fromRows.length > 0) {
    return { content: paragraphLinesToPortable(fromRows, 'merged-rows'), paragraphRows: [] }
  }

  return { content: [], paragraphRows: mergedRows }
}
