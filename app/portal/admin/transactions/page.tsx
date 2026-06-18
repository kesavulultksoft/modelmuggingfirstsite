'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Search } from 'lucide-react'
import { fetchAdminTransactionsAll, fetchAdminUsers, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type TxRow = Record<string, unknown>
type EnrichedTx = TxRow & { _displayName: string; _displayEmail: string }
type UserRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function instructorNameFromUser(u: UserRow | undefined): string {
  if (!u) return ''
  return `${str(u.firstName)} ${str(u.lastName)}`.trim() || str(u.email)
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatMoney(v: unknown): string {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function statusTone(status: string): string {
  const s = status.toLowerCase()
  if (/successful|paid|complete/.test(s)) return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  if (/fail|declin|error/.test(s)) return 'bg-red-100 text-red-800 ring-red-200'
  if (/pend|hold/.test(s)) return 'bg-amber-100 text-amber-900 ring-amber-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function sourceLabel(row: TxRow): string {
  const src = str(row.source)
  if (src === 'admin-payroll') return 'Instructor payout'
  if (src.startsWith('stripe-course-enrollment')) return 'Class tuition (Stripe)'
  if (src.startsWith('stripe-instructor-cart')) return 'Cart (Stripe)'
  if (src.startsWith('stripe-tshirt')) return 'T-shirt (Stripe)'
  if (src.startsWith('stripe-bg')) return 'Background (Stripe)'
  if (src.includes('stripe')) return 'Stripe'
  return src || '—'
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<TxRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/transactions')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    setLoading(true)
    setErr('')
    Promise.all([fetchAdminTransactionsAll(), fetchAdminUsers()])
      .then(([tx, u]) => {
        setRows(legacyAsObjectArray(tx))
        setUsers(legacyAsObjectArray(u))
      })
      .catch((e) => setErr(String((e as Error).message || e)))
      .finally(() => setLoading(false))
  }, [me])

  const usersById = useMemo(() => {
    const m = new Map<string, UserRow>()
    for (const u of users) {
      const id = str(u.id) || str(u._id) || str(u.dumId)
      if (id) m.set(id, u)
      const linkId = str(u.primaryInstructorId)
      if (linkId) m.set(linkId, u)
    }
    return m
  }, [users])

  const enriched = useMemo((): EnrichedTx[] => {
    return rows.map((r) => {
      const uid = str(r.userId)
      const instructorKey = str(r.instructorId)
      const u =
        (uid ? usersById.get(uid) : undefined) ||
        (instructorKey ? usersById.get(instructorKey) : undefined)
      const isInstructorPayout =
        str(r.type).toUpperCase() === 'INSTRUCTOR_PAYMENT' || str(r.source) === 'admin-payroll'
      const instructorLabel =
        str(r.instructorName) ||
        str(r.name) ||
        instructorNameFromUser(u) ||
        uid ||
        instructorKey
      const name = isInstructorPayout
        ? `${instructorLabel} (instructor)`
        : `${str(u?.firstName)} ${str(u?.lastName)}`.trim() ||
          str(u?.email) ||
          str(r.name) ||
          uid ||
          '—'
      const email = isInstructorPayout ? 'Instructor payout' : str(u?.email) || '—'
      return { ...r, _displayName: name, _displayEmail: email } as EnrichedTx
    })
  }, [rows, usersById])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return enriched
    return enriched.filter((r) => {
      const blob = [
        r._displayName,
        r._displayEmail,
        r.purpose,
        r.type,
        r.status,
        r.source,
        r.stripePaymentIntentId,
        r.transactionId,
        r.userId,
        r.amount,
      ]
        .map((x) => String(x ?? '').toLowerCase())
        .join(' ')
      return blob.includes(q)
    })
  }, [enriched, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stats = useMemo(() => {
    let totalUsd = 0
    let stripeCart = 0
    for (const r of enriched) {
      const n = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount ?? ''))
      if (Number.isFinite(n)) totalUsd += n
      if (str(r.source).startsWith('stripe-instructor-cart')) stripeCart++
    }
    return {
      count: enriched.length,
      shown: filtered.length,
      totalUsd: Math.round(totalUsd * 100) / 100,
      stripeCart,
    }
  }, [enriched, filtered.length])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Transactions"
        subtitle="Payment ledger from mm_transactions — course enrollments, instructor cart, background verification, t-shirt orders, and legacy imports."
      />

      {err && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Transactions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.count}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sum of amounts</p>
          <p className="mt-1 text-2xl font-bold text-[#0d9488]">{formatMoney(stats.totalUsd)}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">Listed rows only (not financial audit)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cart checkouts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.stripeCart}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Matching search</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.shown}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, purpose, Stripe id…"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (!me) return
            setLoading(true)
            Promise.all([fetchAdminTransactionsAll(), fetchAdminUsers()])
              .then(([tx, u]) => {
                setRows(legacyAsObjectArray(tx))
                setUsers(legacyAsObjectArray(u))
              })
              .catch((e) => setErr(String((e as Error).message || e)))
              .finally(() => setLoading(false))
          }}
          className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-14 text-center text-sm text-slate-500">Loading transactions…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-slate-500">No transactions match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5">When</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Purpose</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r, i) => {
                  const status = str(r.status) || '—'
                  const ref = str(r.stripePaymentIntentId) || str(r.transactionId) || '—'
                  return (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                        {formatWhen(r.date ?? r.createdDate ?? r.transactionDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <CreditCard className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">{str(r._displayName)}</p>
                            <p className="truncate text-xs text-slate-500">{str(r._displayEmail)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5">
                        <p className="font-medium text-slate-900">{str(r.purpose) || str(r.type) || '—'}</p>
                        {str(r.type) && str(r.purpose) && str(r.type) !== str(r.purpose) ? (
                          <p className="text-xs text-slate-500">{str(r.type)}</p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-slate-900">
                        {formatMoney(r.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusTone(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{sourceLabel(r)}</td>
                      <td className="max-w-[180px] truncate px-4 py-3.5 font-mono text-xs text-slate-600" title={ref}>
                        {ref}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span>
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
      )}
    </>
  )
}
