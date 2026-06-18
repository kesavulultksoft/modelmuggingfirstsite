'use client'

import { formatUsPhoneDisplay, isUsPhoneFormField } from '@/lib/phoneUs'

/** Renders array of objects as a wide table; good for legacy Mongo docs */
export default function PortalJsonTable({
  rows,
  maxRows = 80,
  emptyMessage = 'No records.',
}: {
  rows: Record<string, unknown>[]
  maxRows?: number
  emptyMessage?: string
}) {
  if (!rows.length) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
  }
  const slice = rows.slice(0, maxRows)
  const keys = new Set<string>()
  slice.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)))
  const cols = Array.from(keys).filter((k) => !k.startsWith('_')).slice(0, 12)

  function headerLabel(colKey: string): string {
    if (colKey === 'amount') return 'Amount ($)'
    return colKey
  }

  function cell(colKey: string, v: unknown): string {
    if (v == null) return '—'
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 80)
    if (isUsPhoneFormField(colKey)) {
      const f = formatUsPhoneDisplay(v)
      return f ? f.slice(0, 200) : '—'
    }
    return String(v).slice(0, 200)
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">
                {headerLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/80">
              {cols.map((c) => (
                <td key={c} className="max-w-[280px] truncate px-3 py-3 text-slate-600" title={cell(c, row[c])}>
                  {cell(c, row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-500">
          Showing {maxRows} of {rows.length}
        </p>
      )}
    </div>
  )
}
