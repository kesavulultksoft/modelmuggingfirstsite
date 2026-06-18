import type { PortableTextBlock } from '@portabletext/react'

import { isPortableWithContent, paragraphLinesToPortable } from '@/lib/marketingPages/mensBasicPortable'
import { portableToPlainText } from '@/lib/marketingPages/donateToEmpowerment/portable'

export { portableToPlainText }

export function resolvePortableBody(
  cms: PortableTextBlock[] | undefined,
  fallbackLines: string[] | undefined,
  keyPrefix: string,
): PortableTextBlock[] {
  if (isPortableWithContent(cms)) return cms
  const lines = (fallbackLines ?? []).map((l) => l.trim()).filter(Boolean)
  return paragraphLinesToPortable(lines, keyPrefix)
}

export function resolvePortableFromPlain(
  cms: PortableTextBlock[] | undefined,
  fallbackPlain: string | undefined,
  keyPrefix: string,
): PortableTextBlock[] {
  if (isPortableWithContent(cms)) return cms
  const text = fallbackPlain?.trim()
  if (!text) return []
  return paragraphLinesToPortable(
    text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
    keyPrefix,
  )
}
