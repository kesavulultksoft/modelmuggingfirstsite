import type { PortableTextBlock } from '@portabletext/react'

import {
  isPortableWithContent,
  paragraphLinesToPortable,
  portableToParagraphRows,
} from '@/lib/marketingPages/mensBasicPortable'

/** Portable text → plain strings (one per block) for simple paragraph rendering. */
export function portableToPlainParagraphs(body: PortableTextBlock[] | undefined): string[] {
  if (!isPortableWithContent(body)) return []
  return portableToParagraphRows(body)
    .map((r) => r.text?.trim() || '')
    .filter(Boolean)
}

export function portableToPlainText(body: PortableTextBlock[] | undefined): string {
  return portableToPlainParagraphs(body).join('\n\n')
}

export function resolvePortableBody(
  cms: PortableTextBlock[] | undefined,
  fallbackLines: string[],
  keyPrefix: string,
): PortableTextBlock[] {
  if (isPortableWithContent(cms)) return cms
  return paragraphLinesToPortable(fallbackLines, keyPrefix)
}

export function resolvePortableParagraph(
  cms: PortableTextBlock[] | undefined,
  fallback: string,
  keyPrefix: string,
): PortableTextBlock[] {
  if (isPortableWithContent(cms)) return cms
  return paragraphLinesToPortable(fallback ? [fallback] : [], keyPrefix)
}
