import { coerceMongoIdFromRow, mongoIdToString } from '@/lib/legacyHelpers'

function csvEscape(v: unknown): string {
  if (v == null) return ''
  const s =
    typeof v === 'object'
      ? JSON.stringify(v)
      : String(v)
  const needsQuotes = /[",\r\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function scalarForCsv(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'object' && !Array.isArray(v)) {
    const id = mongoIdToString(v)
    if (id) return id
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  if (Array.isArray(v)) {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v).trim()
}

/** Flatten a CRM row to string columns (skips password fields). */
export function flattenRowForCsv(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  const id = coerceMongoIdFromRow(row)
  if (id) out.id = id
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_') || key === 'password') continue
    if (key === 'id' && out.id) continue
    out[key] = scalarForCsv(value)
  }
  return out
}

function collectHeaders(rows: Record<string, string>[]): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) set.add(key)
  }
  const headers = Array.from(set)
  headers.sort((a, b) => {
    if (a === 'id') return -1
    if (b === 'id') return 1
    return a.localeCompare(b)
  })
  return headers
}

export function rowsToCsv(rows: Record<string, unknown>[], preferredColumns?: string[]): string {
  const flat = rows.map((r) => flattenRowForCsv(r))
  if (!flat.length) return ''
  const headers = preferredColumns?.length
    ? preferredColumns.filter((h) => flat.some((r) => h in r))
    : collectHeaders(flat)
  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(','))
  for (const row of flat) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','))
  }
  return lines.join('\r\n')
}

export function triggerCsvDownload(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadRowsAsCsv(
  filename: string,
  rows: Record<string, unknown>[],
  preferredColumns?: string[],
) {
  const csv = rowsToCsv(rows, preferredColumns)
  triggerCsvDownload(filename, csv || 'column\n')
}

export function downloadSummaryAsCsv(filename: string, summary: Record<string, unknown>) {
  const row: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(summary)) {
    if (k === 'generatedAt' && v != null) {
      row[k] = v instanceof Date ? v.toISOString() : String(v)
    } else {
      row[k] = v
    }
  }
  downloadRowsAsCsv(filename, [row])
}
