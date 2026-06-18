/** Parse tier display amount ("$25", "$1,000", "Custom") to USD dollars, or null for custom. */
export function parseTierAmountDollars(amountLabel: string): number | null {
  const raw = String(amountLabel || '').trim()
  if (!raw || /^custom$/i.test(raw)) return null
  const digits = raw.replace(/[^0-9.]/g, '')
  const n = parseFloat(digits)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function formatTierAmountLabel(dollars: number): string {
  if (!(dollars > 0)) return ''
  return dollars >= 1000
    ? `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${dollars % 1 === 0 ? dollars : dollars.toFixed(2)}`
}
