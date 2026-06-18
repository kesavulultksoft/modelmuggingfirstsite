/**
 * Line-item layout from legacy `static/instructor/t-shirt-polo-shirt.html` +
 * `InstructorDressController.js` default `order` shape (field names match Mongo / Java).
 */

export type TshirtLineSpec = {
  id: string
  label: string
  sizes: readonly [string, string, string, string, string]
  qtyKey: string
  totalKey: string
}

/** Same five rows as the legacy table (S, M, LG, XL, 2XL columns). */
export const TSHIRT_LEGACY_LINE_SPECS: readonly TshirtLineSpec[] = [
  {
    id: 'womenBlue',
    label: "Women's Blue T-Shirt",
    sizes: ['blueShirtS1', 'blueShirtM1', 'blueShirtLG1', 'blueShirtXL1', 'blueShirt2X1'],
    qtyKey: 'blueShirtQN1',
    totalKey: 'blueShirtTotal1',
  },
  {
    id: 'womenPolo',
    label: "Women's Black/Gray Stripe Polo",
    sizes: ['blackGrayS1', 'blackGrayM1', 'blackGrayLG1', 'blackGrayXL1', 'blackGray2X1'],
    qtyKey: 'blackGrayQN1',
    totalKey: 'blackGrayTotal1',
  },
  {
    id: 'blackSweat',
    label: 'Black Sweat Shirt',
    sizes: ['blackSweatS1', 'blackSweatM1', 'blackSweatLG1', 'blackSweatXL1', 'blackSweat2X1'],
    qtyKey: 'blackSweatQN1',
    totalKey: 'blackSweatTotal1',
  },
  {
    id: 'menPolo',
    label: "Men's Black/Gray Polo Stripe Shirt",
    sizes: ['menBlackGrayS', 'menBlackGrayM', 'menBlackGrayLG', 'menBlackGrayXL', 'menBlackGray2X'],
    qtyKey: 'menBlackGrayQN',
    totalKey: 'menBlackGrayTotal',
  },
  {
    id: 'menSuit',
    label: "Men's Long Sleeve Suit Shirt",
    sizes: [
      'menLongSleeveSuitShirtS1',
      'menLongSleeveSuitShirtM1',
      'menLongSleeveSuitShirtLG1',
      'menLongSleeveSuitShirtXL1',
      'menLongSleeveSuitShirt2X1',
    ],
    qtyKey: 'menLongSleeveSuitShirtQN1',
    totalKey: 'menLongSleeveSuitShirtTotal1',
  },
] as const

const ALL_GRID_KEYS = new Set(
  TSHIRT_LEGACY_LINE_SPECS.flatMap((row) => [...row.sizes, row.qtyKey, row.totalKey]),
)

export function orderLooksLikeLegacyTshirtGrid(o: Record<string, unknown>): boolean {
  for (const k of ALL_GRID_KEYS) {
    const v = o[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return true
  }
  return false
}

function cell(o: Record<string, unknown>, key: string): string {
  const v = o[key]
  if (v === undefined || v === null || String(v).trim() === '') return '—'
  return String(v)
}

/** Legacy checkbox label bound to `order.checkedbox`. */
export function readUniformAlreadyHaveFlag(o: Record<string, unknown>): boolean | null {
  const v = o.checkedbox ?? o.checkedBox ?? o.uniformAlreadyHave
  if (v === undefined || v === null) return null
  if (typeof v === 'boolean') return v
  const s = String(v).trim().toLowerCase()
  if (s === '' || s === 'false' || s === '0' || s === 'no') return false
  return true
}

export function readLegacyGrandTotal(o: Record<string, unknown>): string | null {
  const g = o.grandTotal ?? o.grandtotal
  if (g === undefined || g === null || String(g).trim() === '') return null
  return String(g)
}

/** Sum line totals if grandTotal missing (best-effort). */
export function sumLineTotals(o: Record<string, unknown>): number | null {
  let sum = 0
  let any = false
  for (const row of TSHIRT_LEGACY_LINE_SPECS) {
    const t = o[row.totalKey]
    if (t === undefined || t === null || String(t).trim() === '') continue
    const n = Number(t)
    if (!Number.isFinite(n)) continue
    any = true
    sum += n
  }
  return any ? sum : null
}

export type LegacyGridRow = {
  label: string
  s: string
  m: string
  lg: string
  xl: string
  x2: string
  qty: string
  total: string
}

export function legacyTshirtGridRows(o: Record<string, unknown>): LegacyGridRow[] {
  return TSHIRT_LEGACY_LINE_SPECS.map((spec) => ({
    label: spec.label,
    s: cell(o, spec.sizes[0]),
    m: cell(o, spec.sizes[1]),
    lg: cell(o, spec.sizes[2]),
    xl: cell(o, spec.sizes[3]),
    x2: cell(o, spec.sizes[4]),
    qty: cell(o, spec.qtyKey),
    total: cell(o, spec.totalKey),
  }))
}

function nonNegativeInt(v: unknown): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9-]/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Total pieces ordered — per-size counts first; line QN totals if sizes are empty. */
export function tshirtOrderTotalQty(o: Record<string, unknown>): number {
  let fromSizes = 0
  for (const spec of TSHIRT_LEGACY_LINE_SPECS) {
    for (const sizeKey of spec.sizes) {
      fromSizes += nonNegativeInt(o[sizeKey])
    }
  }
  if (fromSizes > 0) return fromSizes
  let fromQn = 0
  for (const spec of TSHIRT_LEGACY_LINE_SPECS) {
    fromQn += nonNegativeInt(o[spec.qtyKey])
  }
  return fromQn
}
