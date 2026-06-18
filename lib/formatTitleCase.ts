/** Title-case each word (client feedback: back links and breadcrumb labels). */
export function formatTitleCase(text: string | undefined | null): string {
  if (!text?.trim()) return ''
  return text.replace(/\b[a-zA-Z][a-zA-Z']*/g, (word) => {
    const lower = word.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  })
}

/** PageHero back label — arrow is rendered separately in the hero. */
export function formatHeroBackLabel(label: string): string {
  return formatTitleCase(label.replace(/^←\s*/, '').trim())
}

/** Inline back link with optional leading arrow (auth, checkout, portal). */
export function formatInlineBackLabel(label: string): string {
  const trimmed = label.trim()
  const hasArrow = /^←/.test(trimmed)
  const body = trimmed.replace(/^←\s*/, '')
  const formatted = formatTitleCase(body)
  return hasArrow ? `← ${formatted}` : formatted
}
