'use client'

import { authFetchJson } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalJsonTable from '@/components/portal/PortalJsonTable'
import { useEffect, useState } from 'react'

export type LegacyTabSpec = {
  id: string
  label: string
  /** Full path under API base, e.g. `/api/v1/admin/crm/tables/events` */
  endpoint: string
}

export default function AdminLegacyTabs({
  tabs,
  meReady,
  maxRows = 80,
  defaultTabId,
}: {
  tabs: LegacyTabSpec[]
  meReady: boolean
  maxRows?: number
  /** Deep-link from legacy route, e.g. interview-questions → ?tab=questions */
  defaultTabId?: string
}) {
  const [tab, setTab] = useState(tabs[0]?.id ?? '')
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (defaultTabId && tabs.some((t) => t.id === defaultTabId)) {
      setTab(defaultTabId)
    }
  }, [defaultTabId, tabs])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [err, setErr] = useState('')
  const [rowFilter, setRowFilter] = useState('')

  useEffect(() => {
    if (!meReady) return
    const s = tabs.find((t) => t.id === tab) ?? tabs[0]
    if (!s) return
    setErr('')
    let cancelled = false
    authFetchJson<unknown>(s.endpoint)
      .then((d) => {
        if (!cancelled) setRows(legacyAsObjectArray(d))
      })
      .catch((e) => {
        if (!cancelled) setErr(String((e as Error).message || e))
      })
    return () => {
      cancelled = true
    }
  }, [meReady, tab, tabs])

  if (!tabs.length) return null
  const q = rowFilter.trim().toLowerCase()
  const filteredRows = q
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
    : rows

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    // Reset paging when changing filters/tabs.
    setPage(1)
  }, [tab, rowFilter, rows.length])

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
              tab === t.id
                ? 'bg-[#0f172a] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-[#00d4aa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">
          Search current tab
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Filter by name, email, type, status..."
            value={rowFilter}
            onChange={(e) => setRowFilter(e.target.value)}
          />
        </label>
      </div>
      {err && <p className="mb-4 text-sm text-red-700">{err}</p>}
      <PortalJsonTable rows={pageRows} maxRows={PAGE_SIZE} />

      {filteredRows.length > PAGE_SIZE ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{' '}
            <span className="font-semibold text-slate-900">{filteredRows.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-slate-800">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
