/** Legacy `mm_cart` / `AddToCart` rows use string `amount` (dollars). */

export function emitInstructorCartChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('mm-instructor-cart-changed'))
}

export function parseCartAmountUsd(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = String(v).trim().replace(/[^0-9.-]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export function instructorCartTotalUsd(rows: Record<string, unknown>[]): number {
  let t = 0
  for (const r of rows) {
    t += parseCartAmountUsd(r.amount)
  }
  return Math.round(t * 100) / 100
}

/** Sidebar / mobile: `Cart ($50.00)` for one line, or `Cart (2) · $75.00` for several. */
export function formatInstructorCartNavLabel(rows: Record<string, unknown>[]): string {
  const n = rows.length
  if (n === 0) return 'Cart'
  const total = instructorCartTotalUsd(rows)
  const money = total > 0 ? `$${total.toFixed(2)}` : ''
  if (n === 1 && money) return `Cart (${money})`
  if (money) return `Cart (${n}) · ${money}`
  return `Cart (${n})`
}
