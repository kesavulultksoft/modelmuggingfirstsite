'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  CreditCard,
  GraduationCap,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react'
import { fetchMe, fetchStudentTransactions, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsDateTime } from '@/lib/usDate'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { cn } from '@/lib/utils'

type TxRow = Record<string, unknown>
type StatusFilter = 'all' | 'success' | 'failed'

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

function statusTone(status: string): string {
  if (isFailedStatus(status)) return 'bg-red-50 text-red-800 ring-red-200/80'
  if (isSuccessStatus(status)) return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (/pend|hold|process/.test(status.toLowerCase())) return 'bg-amber-50 text-amber-900 ring-amber-200/80'
  return 'bg-slate-100 text-slate-700 ring-slate-200/80'
}

function purposeLabel(row: TxRow): string {
  const purpose = str(row.purpose)
  const type = str(row.type)
  if (purpose) return purpose
  if (type) return type
  return 'Payment'
}

function sourceLabel(row: TxRow): string {
  const src = str(row.source)
  if (src.startsWith('stripe-course-enrollment')) return 'Class tuition'
  if (src.startsWith('stripe-instructor-cart')) return 'Instructor cart'
  if (src.startsWith('stripe-tshirt')) return 'T-shirt order'
  if (src.startsWith('stripe-bg')) return 'Background check'
  if (src.includes('stripe')) return 'Card payment'
  return src || '—'
}

function courseLabel(row: TxRow): string {
  return str(row.courseName) || str(row.courseId) || '—'
}

function referenceId(row: TxRow): string {
  return str(row.stripePaymentIntentId) || str(row.transactionId) || '—'
}

export default function StudentTransactionsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<TxRow[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<TxRow | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/transactions')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  async function loadTransactions() {
    setLoading(true)
    setErr('')
    try {
      const d = await fetchStudentTransactions()
      setRows(legacyAsObjectArray(d))
    } catch (e) {
      setRows([])
      setErr(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!me) return
    void loadTransactions()
  }, [me])

  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter === 'success') {
      list = list.filter((r) => isSuccessStatus(txStatus(r)))
    } else if (statusFilter === 'failed') {
      list = list.filter((r) => isFailedStatus(txStatus(r)))
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => {
      const blob = [
        purposeLabel(r),
        courseLabel(r),
        txStatus(r),
        sourceLabel(r),
        referenceId(r),
        formatMoney(r.amount),
        formatWhen(txWhen(r)),
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, statusFilter])

  const stats = useMemo(() => {
    let totalUsd = 0
    let success = 0
    let failed = 0
    let coursePayments = 0
    for (const r of rows) {
      const n = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount ?? ''))
      if (Number.isFinite(n)) totalUsd += n
      const st = txStatus(r)
      if (isFailedStatus(st)) failed++
      else if (isSuccessStatus(st)) success++
      if (str(r.source).includes('course') || str(r.purpose).toLowerCase().includes('course')) {
        coursePayments++
      }
    }
    return {
      total: rows.length,
      shown: filtered.length,
      totalUsd: Math.round(totalUsd * 100) / 100,
      success,
      failed,
      coursePayments,
    }
  }, [rows, filtered.length])

  if (!me) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <>
      <PortalPageHeader
        title="Transactions"
        subtitle="Your payment history for class tuition and other Model Mugging charges processed through the portal."
      />

      {err && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4 text-[#0d9488]" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Total paid</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#0d9488]">{formatMoney(stats.totalUsd)}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{stats.total} payment{stats.total === 1 ? '' : 's'}</p>
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="h-4 w-4 text-indigo-600" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Class payments</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{stats.coursePayments}</p>
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
            placeholder="Search purpose, course, status, or reference…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'success' as const, label: 'Successful' },
              { id: 'failed' as const, label: 'Failed' },
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

      <p className="mb-3 text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{stats.shown}</span> of{' '}
        <span className="font-semibold text-slate-700">{stats.total}</span> transactions
        {loading ? ' · Loading…' : ''}
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
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
            <p className="text-base font-semibold text-slate-800">No transactions yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {rows.length === 0
                ? 'When you pay for a class or other fee, your receipt will appear here.'
                : 'Try a different search or filter.'}
            </p>
            {rows.length === 0 && (
              <Link
                href="/portal/student/courses"
                className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d9488]"
              >
                Browse open classes
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5">
                    Payment
                  </th>
                  <th className="hidden px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">
                    Course
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    When
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, i) => {
                  const status = txStatus(r)
                  const failed = isFailedStatus(status)
                  const course = courseLabel(r)
                  const courseId = str(r.courseId)
                  return (
                    <tr
                      key={str(r.id) || str(r._id) || `tx-${i}`}
                      className="group cursor-pointer transition hover:bg-slate-50/90"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                              failed
                                ? 'bg-red-50 text-red-600 ring-red-100'
                                : 'bg-teal-50 text-[#0d9488] ring-teal-100',
                            )}
                          >
                            <CreditCard className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 group-hover:text-[#0d9488]">
                              {purposeLabel(r)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">{sourceLabel(r)}</p>
                            <p className="mt-1 truncate text-xs text-slate-400 md:hidden">{course}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden max-w-[200px] px-4 py-4 md:table-cell">
                        {courseId && course !== '—' ? (
                          <Link
                            href={`/portal/student/courses`}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate font-medium text-[#0d9488] hover:underline"
                            title={course}
                          >
                            {course}
                          </Link>
                        ) : (
                          <p className="truncate text-slate-700">{course}</p>
                        )}
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
                        <p className="text-base font-bold tabular-nums text-slate-900">
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
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
            aria-labelledby="tx-detail-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,480px)] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Transaction details
                </p>
                <h2 id="tx-detail-title" className="mt-0.5 text-lg font-bold text-slate-900">
                  {purposeLabel(selected)}
                </h2>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#0d9488]">
                  {formatMoney(selected.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                    statusTone(txStatus(selected)),
                  )}
                >
                  {txStatus(selected)}
                </span>
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <dl className="grid gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Date</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{formatWhen(txWhen(selected))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Type</dt>
                      <dd className="mt-0.5 text-slate-800">{sourceLabel(selected)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Course</dt>
                      <dd className="mt-0.5 text-slate-800">{courseLabel(selected)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Reference</dt>
                      <dd className="mt-0.5 break-all font-mono text-xs text-slate-700">
                        {referenceId(selected)}
                      </dd>
                    </div>
                  </dl>
                </section>
                <p className="text-xs text-slate-500">
                  Keep this reference if you need to contact support about this charge.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
