/**
 * Client-side preview of legacy `InstructorDressController.js#quantityCheck` math
 * (must stay aligned with `PortalCrmService#recomputeTshirtQuantitiesAndTotals`).
 */

export type TshirtComputed = {
  blueShirtQN1: number
  blackGrayQN1: number
  blackSweatQN1: number
  menBlackGrayQN: number
  menLongSleeveSuitShirtQN1: number
  blueShirtTotal1: number
  blackGrayTotal1: number
  blackSweatTotal1: number
  menBlackGrayTotal: number
  menLongSleeveSuitShirtTotal1: number
  grandTotal: number
}

function nz(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.round(v))
  const n = parseInt(String(v).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function money(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, v)
  const s = String(v).replace(/[^0-9.-]/g, '')
  if (!s || s === '-') return 0
  const x = parseFloat(s)
  return Number.isFinite(x) && x > 0 ? x : 0
}

export function computeTshirtOrderTotals(
  o: Record<string, unknown>,
  prices: Record<string, unknown> | null | undefined,
): TshirtComputed {
  const p = prices ?? {}

  const blueS = nz(o.blueShirtS1)
  const blueM = nz(o.blueShirtM1)
  const blueL = nz(o.blueShirtLG1)
  const blueX = nz(o.blueShirtXL1)
  const blue2 = nz(o.blueShirt2X1)
  const blueQn = blueS + blueM + blueL + blueX + blue2

  const bgS = nz(o.blackGrayS1)
  const bgM = nz(o.blackGrayM1)
  const bgL = nz(o.blackGrayLG1)
  const bgX = nz(o.blackGrayXL1)
  const bg2 = nz(o.blackGray2X1)
  const bgQn = bgS + bgM + bgL + bgX + bg2

  const swS = nz(o.blackSweatS1)
  const swM = nz(o.blackSweatM1)
  const swL = nz(o.blackSweatLG1)
  const swX = nz(o.blackSweatXL1)
  const sw2 = nz(o.blackSweat2X1)
  const swQn = swS + swM + swL + swX + sw2

  const mbS = nz(o.menBlackGrayS)
  const mbM = nz(o.menBlackGrayM)
  const mbL = nz(o.menBlackGrayLG)
  const mbX = nz(o.menBlackGrayXL)
  const mb2 = nz(o.menBlackGray2X)
  const mbQn = mbS + mbM + mbL + mbX + mb2

  const suS = nz(o.menLongSleeveSuitShirtS1)
  const suM = nz(o.menLongSleeveSuitShirtM1)
  const suL = nz(o.menLongSleeveSuitShirtLG1)
  const suX = nz(o.menLongSleeveSuitShirtXL1)
  const su2 = nz(o.menLongSleeveSuitShirt2X1)
  const suQn = suS + suM + suL + suX + su2

  const blueTotal = Math.max(0, (blueQn - blue2) * money(p.womenBlueShirtPrice) + blue2 * money(p.womenBlueShirt2xlPrice))
  const blackGrayTotal = Math.max(0, (bgQn - bg2) * money(p.womenBlackGrayPrice) + bg2 * money(p.womenBlackGray2xlPrice))
  const blackSweatTotal = Math.max(0, (swQn - sw2) * money(p.blackSweatPrice) + sw2 * money(p.blackSweat2xlPrice))
  const menBlackGrayTotal = Math.max(0, (mbQn - mb2) * money(p.menBlackGrayPrice) + mb2 * money(p.menBlackGray2xlPrice))
  const menLongSleeveSuitShirtTotal1 = Math.max(
    0,
    (suQn - su2) * money(p.menLongSleeveSuitShirtPrice) + su2 * money(p.menLongSleeveSuitShirt2xlPrice),
  )

  const grandTotal =
    blueTotal + blackGrayTotal + blackSweatTotal + menBlackGrayTotal + menLongSleeveSuitShirtTotal1

  return {
    blueShirtQN1: blueQn,
    blackGrayQN1: bgQn,
    blackSweatQN1: swQn,
    menBlackGrayQN: mbQn,
    menLongSleeveSuitShirtQN1: suQn,
    blueShirtTotal1: blueTotal,
    blackGrayTotal1: blackGrayTotal,
    blackSweatTotal1: blackSweatTotal,
    menBlackGrayTotal: menBlackGrayTotal,
    menLongSleeveSuitShirtTotal1: menLongSleeveSuitShirtTotal1,
    grandTotal,
  }
}

/** First chart file from admin list; may be PDF or image filename. */
export function firstCatalogFilename(list: unknown): string {
  if (list == null) return ''
  if (Array.isArray(list) && list.length > 0) return String(list[0] ?? '').trim()
  return ''
}

const RESOURCE_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TSHIRT_RESOURCE_BASE
    ? String(process.env.NEXT_PUBLIC_TSHIRT_RESOURCE_BASE).replace(/\/$/, '')
    : ''

export function tshirtResourceHref(filename: string): string {
  const f = String(filename || '').trim()
  if (!f) return ''
  if (/^https?:\/\//i.test(f)) return f
  if (RESOURCE_BASE) return `${RESOURCE_BASE}/${encodeURIComponent(f)}`
  return `/resources/tshirt/${encodeURIComponent(f)}`
}
