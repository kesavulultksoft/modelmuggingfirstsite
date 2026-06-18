/** Parse catalog feeDisplay (e.g. "$125.00") to integer cents. */
export function feeDisplayToCents(feeDisplay: string | undefined | null): number {
  if (!feeDisplay) return 0
  const s = feeDisplay.replace(/[^0-9.]/g, '').trim()
  if (!s) return 0
  const n = parseFloat(s)
  if (Number.isNaN(n)) return 0
  return Math.round(n * 100)
}
