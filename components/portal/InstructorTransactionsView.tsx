'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { fetchInstructorCrmView, type MeUser } from '@/lib/portalApi'
import { coerceMongoIdFromRow, legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsDateTime } from '@/lib/usDate'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { cn } from '@/lib/utils'

type TxRow = Record<string, unknown>
type StatusFilter = 'all' | 'success' | 'failed' | 'cart'

const PAGE_SIZE = 25

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function parseWhen(v: unknown): Date | null {
  if (v == null || v === '') return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatWhen(v: unknown): string {
  const d = parseWhen(v)
  if (!d) return '—'
  return formatUsDateTime(d)
}

function formatRelative(v: unknown): string {
  const d = parseWhen(v)
  if (!d) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return formatUsDateTime(d)
}

function formatMoney(v: unknown): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function txWhen(row: TxRow): unknown {
  return row.date ?? row.createdDate ?? row.transactionDate ?? row.createdAt
}

function txStatus(row: TxRow): string {
  return str(row.status) || '—'
}

function isSuccessStatus(status: string): boolean {
  const s = status.toLowerCase()
  return /successful|paid|complete|succeed/.test(s)
}

function isFailedStatus(status: string): boolean {
  const s = status.toLowerCase()
  return /fail|declin|error|cancel/.test(s)
}

function isCartSource(row: TxRow): boolean {
  return str(row.source).startsWith('stripe-instructor-cart')
}

function isInstructorPayout(row: TxRow): boolean {
  return str(row.type).toUpperCase() === 'INSTRUCTOR_PAYMENT' || str(row.source) === 'admin-payroll'
}

function statusTone(status: string): string {
  if (isFailedStatus(status)) return 'bg-red-50 text-red-800 ring-red-200/80'
  if (isSuccessStatus(status)) return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (/pend|hold|process/.test(status.toLowerCase())) return 'bg-amber-50 text-amber-900 ring-amber-200/80'
  return 'bg-slate-100 text-slate-700 ring-slate-200/80'
}

function purposeLabel(row: TxRow): string {
  if (isInstructorPayout(row)) return 'Instructor payout'
  const purpose = str(row.purpose)
  const type = str(row.type)
  if (purpose) return purpose
  if (type) return type
  return 'Payment'
}

function sourceLabel(row: TxRow): string {
  const src = str(row.source)
  if (src === 'admin-payroll') return 'Payroll'
  if (src.startsWith('stripe-instructor-cart')) return 'Instructor cart'
  if (src.startsWith('stripe-course-enrollment')) return 'Class tuition'
  if (src.startsWith('stripe-tshirt')) return 'T-shirt order'
  if (src.startsWith('stripe-bg')) return 'Background check'
  if (src.startsWith('stripe-event') || src.includes('event')) return 'Pre-instructor event'
  if (src.includes('stripe')) return 'Card payment'
  return src || '—'
}

function referenceId(row: TxRow): string {
  return str(row.stripePaymentIntentId) || str(row.transactionId) || '—'
}

function rowKey(row: TxRow, index: number): string {
  return coerceMongoIdFromRow(row) || str(row.transactionId) || `tx-${index}`
}

export default function InstructorTransactionsView({ me }: { me: MeUser }) {
  const [rows, setRows] = useState<TxRow[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<TxRow | null>(null)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const d = await fetchInstructorCrmView('transactions')
      const list = legacyAsObjectArray(d)
      list.sort((a, b) => {
        const ta = parseWhen(txWhen(a))?.getTime() ?? 0
        const tb = parseWhen(txWhen(b))?.getTime() ?? 0
        return tb - ta
      })
      setRows(list)
    } catch (e) {
      setRows([])
      setErr(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter === 'success') {
      list = list.filter((r) => isSuccessStatus(txStatus(r)))
    } else if (statusFilter === 'failed') {
      list = list.filter((r) => isFailedStatus(txStatus(r)))
    } else if (statusFilter === 'cart') {
      list = list.filter((r) => isCartSource(r))
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => {
      const blob = [
        purposeLabel(r),
        sourceLabel(r),
        txStatus(r),
        referenceId(r),
        formatMoney(r.amount),
        formatWhen(txWhen(r)),
        str(r.courseName),
        str(r.courseId),
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stats = useMemo(() => {
    let totalUsd = 0
    let success = 0
    let failed = 0
    let cart = 0
    let payouts = 0
    for (const r of rows) {
      const n = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount ?? ''))
      if (Number.isFinite(n)) totalUsd += n
      const st = txStatus(r)
      if (isFailedStatus(st)) failed++
      else if (isSuccessStatus(st)) success++
      if (isCartSource(r)) cart++
      if (isInstructorPayout(r)) payouts++
    }
    return {
      total: rows.length,
      shown: filtered.length,
      totalUsd: Math.round(totalUsd * 100) / 100,
      success,
      failed,
      cart,
      payouts,
    }
  }, [rows, filtered.length])

  return (
    <>
      <PortalPageHeader
        title="Transactions"
        subtitle={`Payment history for ${me.email} — cart checkouts, event fees, background verification, t-shirt orders, and instructor payouts.`}
      />

      {err ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4 text-[#0d9488]" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Total recorded</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#0d9488]">{formatMoney(stats.totalUsd)}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{stats.total} transaction{stats.total === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Successful</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-900">{stats.success}</p>
        </div>
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Failed</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-red-900">{stats.failed}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-800">
            <ShoppingCart className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Cart checkouts</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-900">{stats.cart}</p>
        </div>
        <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/80 to-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 text-teal-800">
            <CreditCard className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Payouts</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-teal-900">{stats.payouts}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative max-w-xl flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search purpose, status, source, or reference…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'success' as const, label: 'Successful' },
              { id: 'failed' as const, label: 'Failed' },
              { id: 'cart' as const, label: 'Cart' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                statusFilter === f.id
                  ? 'bg-[#0f172a] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadTransactions()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4 px-4 py-4 sm:px-5">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CreditCard className="h-7 w-7" aria-hidden />
            </span>
            <p className="text-base font-semibold text-slate-800">No transactions found</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {rows.length === 0
                ? 'Charges from your instructor cart, events, and fees will appear here after payment.'
                : 'Try a different search or filter.'}
            </p>
            {rows.length === 0 ? (
              <Link
                href="/portal/instructor/cart"
                className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d9488]"
              >
                Open cart
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5">
                    Payment
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">When</th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="hidden px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 lg:table-cell">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r, i) => {
                  const status = txStatus(r)
                  const failed = isFailedStatus(status)
                  const payout = isInstructorPayout(r)
                  return (
                    <tr
                      key={rowKey(r, i)}
                      className="group cursor-pointer transition hover:bg-slate-50/90"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                              payout
                                ? 'bg-teal-50 text-teal-700 ring-teal-100'
                                : failed
                                  ? 'bg-red-50 text-red-600 ring-red-100'
                                  : 'bg-indigo-50 text-indigo-700 ring-indigo-100',
                            )}
                          >
                            <CreditCard className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 group-hover:text-[#0d9488]">
                              {purposeLabel(r)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">{sourceLabel(r)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-medium text-slate-800" title={formatWhen(txWhen(r))}>
                          {formatRelative(txWhen(r))}
                        </p>
                        <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                          {formatWhen(txWhen(r))}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <p
                          className={cn(
                            'text-base font-bold tabular-nums',
                            payout ? 'text-teal-800' : 'text-slate-900',
                          )}
                        >
                          {formatMoney(r.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
                            statusTone(status),
                          )}
                        >
                          {failed ? (
                            <XCircle className="h-3 w-3 shrink-0" aria-hidden />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="hidden max-w-[200px] truncate px-4 py-4 font-mono text-xs text-slate-500 lg:table-cell">
                        {referenceId(r)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:px-5">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
              <span className="font-semibold text-slate-900">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Prev
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close transaction details"
            onClick={() => setSelected(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="instructor-tx-detail-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,480px)] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction details</p>
                <h2 id="instructor-tx-detail-title" className="mt-0.5 text-lg font-bold text-slate-900">
                  {purposeLabel(selected)}
                </h2>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#0d9488]">
                  {formatMoney(selected.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                  statusTone(txStatus(selected)),
                )}
              >
                {txStatus(selected)}
              </span>
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Date</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{formatWhen(txWhen(selected))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Source</dt>
                    <dd className="mt-0.5 text-slate-800">{sourceLabel(selected)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Type</dt>
                    <dd className="mt-0.5 text-slate-800">{str(selected.type) || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Reference</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs text-slate-700">{referenceId(selected)}</dd>
                  </div>
                </dl>
              </section>
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-semibold text-slate-500">All stored fields</summary>
                <dl className="mt-2 grid gap-2 text-xs">
                  {Object.entries(selected)
                    .filter(([k]) => !k.startsWith('_') && k !== 'password')
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[minmax(0,120px)_1fr] gap-2 border-b border-slate-100 pb-2">
                        <dt className="font-mono text-slate-500">{k}</dt>
                        <dd className="break-all text-slate-800">
                          {v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </details>
              <p className="mt-4 text-xs text-slate-500">
                Save the reference ID if you need to contact Model Mugging support about this charge.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
