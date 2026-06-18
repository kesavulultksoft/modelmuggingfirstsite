/** Display helpers for BG investigator portal (legacy parity). */

export type BgRow = Record<string, unknown>

export const BG_OFFICE_CHECKBOX_KEYS = [
  { key: 'la', label: 'LA C/C X' },
  { key: 'oc', label: 'OC C/C' },
  { key: 'vent', label: 'VENT C/C' },
  { key: 'riv', label: 'RIV C/C' },
  { key: 'sor', label: 'SOR X' },
  { key: 'sb', label: 'SB C/C' },
  { key: 'sd', label: 'SD C/C' },
  { key: 'other', label: 'Other' },
  { key: 'ssn', label: 'SSN X' },
  { key: 'dl', label: 'DL/ID' },
  { key: 'wc', label: 'WC' },
] as const

function digitsOnly(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '')
}

/** Show xxx-**-1234 (last 4 visible) for investigator view. */
export function maskSsnForBgAgentDisplay(v: unknown): string {
  const raw = String(v ?? '').trim()
  if (!raw) return '—'
  if (/\*{2,}/.test(raw)) return raw
  const d = digitsOnly(raw)
  if (d.length < 4) return 'xxx-**-****'
  const last4 = d.slice(-4)
  return `xxx-**-${last4}`
}

/** Show ****1234 for tax id. */
export function maskTaxIdForBgAgentDisplay(v: unknown): string {
  const raw = String(v ?? '').trim()
  if (!raw) return '—'
  if (/\*{2,}/.test(raw)) return raw
  const d = digitsOnly(raw)
  if (d.length < 4) return '****'
  return `****${d.slice(-4)}`
}

export function resolveApplicantEmail(row: BgRow | null | undefined): string {
  if (!row) return ''
  for (const key of ['applicantEmail', 'emailId', 'email', 'emailAddress', 'userEmail']) {
    const s = String(row[key] ?? '').trim()
    if (s && s !== '—') return s
  }
  return ''
}

export function applicantDisplayName(row: BgRow): string {
  const fn = String(row.firstName ?? '').trim()
  const ln = String(row.lastName ?? '').trim()
  const n = `${fn} ${ln}`.trim()
  if (n) return n
  return String(row.applicantName ?? '').trim() || 'Applicant'
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function bgStatusTone(status: unknown): 'amber' | 'emerald' | 'rose' | 'sky' | 'slate' {
  const s = String(status ?? '').toLowerCase()
  if (s === 'successful' || s === 'approved' || s === 'verified') return 'emerald'
  if (s === 'unsuccessful' || s === 'rejected' || s === 'paymentfail') return 'rose'
  if (s === 'paid' || s === 'inprogress') return 'sky'
  if (s === 'submitted' || s === 'pending') return 'amber'
  return 'slate'
}

/** Legacy approved/rejected queues: view-only after investigator marks Successful / Unsuccessful. */
export function isBgVerificationFinalized(row: BgRow | null | undefined): boolean {
  if (!row) return false
  const s = String(row.status ?? '').trim().toLowerCase()
  return (
    s === 'successful' ||
    s === 'unsuccessful' ||
    s === 'approved' ||
    s === 'rejected' ||
    s === 'verified'
  )
}

export function bgStatusBadgeClass(tone: ReturnType<typeof bgStatusTone>): string {
  const map = {
    amber: 'bg-amber-50 text-amber-900 ring-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
    rose: 'bg-rose-50 text-rose-900 ring-rose-200/80',
    sky: 'bg-sky-50 text-sky-900 ring-sky-200/80',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[tone]}`
}

export function isBoolTrue(v: unknown): boolean {
  if (v === true) return true
  const s = String(v).toLowerCase()
  return s === 'true' || s === 'yes' || s === 'on' || s === '1'
}

export function supportingDocMeta(row: BgRow): { filename: string; index: number }[] {
  const att = row.supportingDocuments
  if (!Array.isArray(att)) return []
  return att.map((item, index) => {
    const doc = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const filename = String(doc.filename ?? `Document ${index + 1}`)
    return { filename, index }
  })
}

export function bgAgentDocMeta(row: BgRow): { filename: string; index: number; legacyOnly?: boolean }[] {
  const att = row.bgAgentDocuments
  if (!Array.isArray(att)) return []
  return att.map((item, index) => {
    if (typeof item === 'string') {
      return { filename: item, index, legacyOnly: true }
    }
    const doc = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const filename = String(doc.filename ?? `Investigator file ${index + 1}`)
    return { filename, index }
  })
}

export function candidateLegacyFileNames(row: BgRow): string[] {
  const f = row.file
  if (!Array.isArray(f)) return []
  return f.map((x) => String(x).trim()).filter(Boolean)
}
