'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Eye, MoreVertical, Search, Shirt, Trash2 } from 'lucide-react'
import {
  completeAdminTshirtOrder,
  deleteAdminTshirtOrder,
  fetchAdminCompletedInstructors,
  fetchAdminTshirtOrders,
  fetchAdminTshirtOrdersByItem,
  fetchAdminUsers,
  fetchMe,
  getToken,
  type AdminTshirtItemAggregate,
  type MeUser,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow, legacyAsObjectArray, mongoIdToString } from '@/lib/legacyHelpers'
import { tshirtOrderTotalQty } from '@/lib/tshirtLegacyOrderDisplay'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminPortalUserDetailDrawer, {
  type PortalUserRow,
} from '@/components/portal/AdminPortalUserDetailDrawer'
import AdminTshirtOrderDetailDrawer from '@/components/portal/AdminTshirtOrderDetailDrawer'

type Tab = 'open' | 'completed' | 'byItem'
type OrderRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatMoney(v: unknown, fallback?: unknown): string {
  const raw = v ?? fallback
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function orderId(row: OrderRow): string {
  const dum = str(row.dumId)
  if (/^[a-fA-F0-9]{24}$/.test(dum)) return dum
  return (
    mongoIdToString(row.orderId) ||
    coerceMongoIdFromRow(row) ||
    mongoIdToString(row._id) ||
    ''
  )
}

function userId(row: OrderRow): string {
  return mongoIdToString(row.userId) || str(row.instructorUserId) || ''
}

function instructorNameFromRow(row: OrderRow): string {
  return (
    `${str(row.firstName)} ${str(row.lastName)}`.trim() ||
    str(row.fullName) ||
    str(row.name) ||
    str(row.emailId) ||
    str(row.email) ||
    ''
  )
}

function displayName(
  row: OrderRow,
  usersById: Map<string, PortalUserRow>,
  instructorsByUserKey: Map<string, OrderRow>
): string {
  const fromParts = `${str(row.portalUserFirstName)} ${str(row.portalUserLastName)}`.trim()
  const fromApi =
    str(row.instructorDisplayName) ||
    str(row.instructorName) ||
    str(row.portalUserDisplayName) ||
    fromParts ||
    str(row.portalUserEmail) ||
    str(row.emailId)
  if (fromApi) return fromApi
  const uid = userId(row)
  if (uid) {
    const inst = instructorsByUserKey.get(uid)
    if (inst) {
      const fromInst = instructorNameFromRow(inst)
      if (fromInst) return fromInst
    }
    const u = usersById.get(uid)
    if (u) {
      const fromUser = `${str(u.firstName)} ${str(u.lastName)}`.trim() || str(u.email)
      if (fromUser) return fromUser
    }
  }
  return '—'
}

function displayEmail(
  row: OrderRow,
  usersById: Map<string, PortalUserRow>,
  instructorsByUserKey: Map<string, OrderRow>
): string {
  const fromApi = str(row.portalUserEmail) || str(row.emailId)
  if (fromApi) return fromApi
  const uid = userId(row)
  if (uid) {
    const inst = instructorsByUserKey.get(uid)
    const fromInst = str(inst?.emailId) || str(inst?.email)
    if (fromInst) return fromInst
    const u = usersById.get(uid)
    if (u?.email) return str(u.email)
  }
  return '—'
}

function orderQty(row: OrderRow): number {
  const fromApi = Number(row.totalItemQty)
  if (Number.isFinite(fromApi) && fromApi > 0) return fromApi
  return tshirtOrderTotalQty(row)
}

function statusTone(status: string): string {
  const s = status.toLowerCase()
  if (/paid|successful|complete|fulfilled/.test(s)) return 'bg-emerald-100 text-emerald-800'
  if (/submitted|pending|open|new/.test(s)) return 'bg-amber-100 text-amber-900'
  if (/reject|fail|cancel/.test(s)) return 'bg-red-100 text-red-800'
  return 'bg-slate-100 text-slate-800'
}

function isOpenFulfillmentStatus(status: string): boolean {
  const s = status.toLowerCase()
  return /successful|paid|submitted|pending|open|new/.test(s) && !/complete|fulfilled|done/.test(s)
}

export default function AdminTshirtOrdersPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<Tab>('open')
  const [rows, setRows] = useState<OrderRow[]>([])
  const [itemRows, setItemRows] = useState<AdminTshirtItemAggregate[]>([])
  const [usersById, setUsersById] = useState<Map<string, PortalUserRow>>(new Map())
  const [instructorsByUserKey, setInstructorsByUserKey] = useState<Map<string, OrderRow>>(new Map())
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailUser, setDetailUser] = useState<PortalUserRow | null>(null)
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [drawerMsg, setDrawerMsg] = useState('')
  const [drawerOk, setDrawerOk] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const reloadOrders = useCallback(async () => {
    const d = await fetchAdminTshirtOrders(tab === 'completed')
    setRows(legacyAsObjectArray(d))
  }, [tab])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/tshirt-orders')
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
    fetchAdminUsers()
      .then((list) => {
        const map = new Map<string, PortalUserRow>()
        for (const u of legacyAsObjectArray(list)) {
          const id = str(u.id) || coerceMongoIdFromRow(u)
          if (id) map.set(id, u as PortalUserRow)
        }
        setUsersById(map)
      })
      .catch(() => setUsersById(new Map()))
  }, [me])

  useEffect(() => {
    if (!me) return
    fetchAdminCompletedInstructors(false)
      .then((list) => {
        const map = new Map<string, OrderRow>()
        for (const row of legacyAsObjectArray(list)) {
          const uid = mongoIdToString(row.userId) || str(row.userId)
          if (uid) map.set(uid, row)
          const hex = coerceMongoIdFromRow(row)
          if (hex) map.set(hex, row)
        }
        setInstructorsByUserKey(map)
      })
      .catch(() => setInstructorsByUserKey(new Map()))
  }, [me])

  useEffect(() => {
    if (!me || tab === 'byItem') return
    let cancelled = false
    setLoading(true)
    setErr('')
    fetchAdminTshirtOrders(tab === 'completed')
      .then((d) => {
        if (!cancelled) setRows(legacyAsObjectArray(d))
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([])
          setErr(String((e as Error).message || e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [me, tab])

  useEffect(() => {
    if (!me || tab !== 'byItem') return
    let cancelled = false
    setLoading(true)
    setErr('')
    fetchAdminTshirtOrdersByItem(fromDate || undefined, toDate || undefined)
      .then((d) => {
        if (!cancelled) setItemRows(Array.isArray(d) ? d : [])
      })
      .catch((e) => {
        if (!cancelled) {
          setItemRows([])
          setErr(String((e as Error).message || e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [me, tab, fromDate, toDate])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [rows, search])

  const stats = useMemo(() => {
    let totalUsd = 0
    let totalQty = 0
    for (const r of filteredRows) {
      const g = r.grandTotal ?? r.totalAmount
      const n = typeof g === 'number' ? g : parseFloat(String(g ?? '').replace(/[^0-9.-]/g, ''))
      if (Number.isFinite(n)) totalUsd += n
      totalQty += orderQty(r)
    }
    return { count: filteredRows.length, totalUsd, totalQty }
  }, [filteredRows])

  function openUserDetail(row: OrderRow) {
    const uid = userId(row)
    if (!uid) return
    const fromUsers = usersById.get(uid)
    const name = displayName(row, usersById, instructorsByUserKey)
    const parts = name.split(/\s+/).filter(Boolean)
    setDetailUser(
      fromUsers ?? {
        id: uid,
        email: row.portalUserEmail ?? row.emailId,
        firstName: row.portalUserFirstName ?? parts[0],
        lastName: row.portalUserLastName ?? parts.slice(1).join(' '),
        role: row.portalUserRole ?? 'INSTRUCTOR',
        phone: row.portalUserPhone,
        portalUserDisplayName: name,
        displayRole: 'INSTRUCTOR',
      }
    )
  }

  function openOrderDetail(row: OrderRow) {
    setDetailOrder(row)
    setDrawerMsg('')
    setDrawerOk(false)
    setOpenMenuId(null)
  }

  async function handleComplete() {
    if (!detailOrder) return
    const oid = orderId(detailOrder)
    if (!oid) return
    if (!window.confirm('Mark this order as completed (fulfilled)?')) return
    setActionBusy(true)
    setDrawerMsg('')
    try {
      await completeAdminTshirtOrder(oid)
      setDrawerMsg('Order moved to completed.')
      setDrawerOk(true)
      setDetailOrder(null)
      await reloadOrders()
    } catch (e) {
      setDrawerMsg(String((e as Error).message || e))
      setDrawerOk(false)
    } finally {
      setActionBusy(false)
    }
  }

  async function handleDelete(row?: OrderRow) {
    const target = row ?? detailOrder
    if (!target) return
    const oid = orderId(target)
    if (!oid) return
    if (!window.confirm('Delete this order permanently?')) return
    setActionBusy(true)
    setDrawerMsg('')
    try {
      await deleteAdminTshirtOrder(oid)
      setDetailOrder(null)
      setOpenMenuId(null)
      await reloadOrders()
    } catch (e) {
      setDrawerMsg(String((e as Error).message || e))
      setDrawerOk(false)
    } finally {
      setActionBusy(false)
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const detailName = detailOrder
    ? displayName(detailOrder, usersById, instructorsByUserKey)
    : ''
  const detailEmail = detailOrder ? displayEmail(detailOrder, usersById, instructorsByUserKey) : ''
  const detailCanComplete =
    detailOrder != null &&
    tab === 'open' &&
    isOpenFulfillmentStatus(str(detailOrder.status) || 'Successful')

  return (
    <>
      <PortalPageHeader
        title="Shirts / uniforms — order management"
        subtitle={
          <>
            Fulfillment for instructor uniform orders (legacy open → completed workflow).{' '}
            <Link href="/portal/admin/tshirt-prices" className="font-semibold text-[#0d9488] hover:underline">
              Edit unit prices
            </Link>
          </>
        }
      />

      {tab !== 'byItem' && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Orders in view</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.count}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">Merchandise total</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{formatMoney(stats.totalUsd)}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">Items (qty)</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{stats.totalQty}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'open' as const, label: 'Open orders' },
            { id: 'completed' as const, label: 'Completed orders' },
            { id: 'byItem' as const, label: 'Orders by item' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
              tab === t.id ? 'bg-[#0f172a] text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            <Shirt className="h-4 w-4" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'byItem' ? (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Aggregate quantities across open (paid) orders — same as legacy &quot;Orders by Item&quot;. Optional date
            range filters on order placed date.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-slate-600">
              From
              <input
                type="date"
                className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              To
              <input
                type="date"
                className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </div>
        </section>
      ) : (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <label className="block text-xs font-semibold text-slate-600">
            Search orders
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                placeholder="Name, email, status, transaction id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> of {rows.length}{' '}
            {tab === 'completed' ? 'completed' : 'open'} orders
          </p>
        </section>
      )}

      {err && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}
      {loading && <p className="mb-4 text-sm text-slate-500">Loading…</p>}

      {tab === 'byItem' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5">Item</th>
                  <th className="px-4 py-3.5 text-center">S</th>
                  <th className="px-4 py-3.5 text-center">M</th>
                  <th className="px-4 py-3.5 text-center">LG</th>
                  <th className="px-4 py-3.5 text-center">XL</th>
                  <th className="px-4 py-3.5 text-center">2XL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemRows.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{row.small}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{row.medium}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{row.large}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{row.Xl}</td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{row.xxl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && itemRows.length === 0 && (
            <div className="px-6 py-14 text-center text-sm text-slate-600">No open orders to aggregate.</div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5">Instructor</th>
                  <th className="px-4 py-3.5">Order details</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Order placed</th>
                  {tab === 'completed' && <th className="px-4 py-3.5">Completed</th>}
                  <th className="px-4 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r, i) => {
                  const oid = orderId(r)
                  const uid = userId(r)
                  const name = displayName(r, usersById, instructorsByUserKey)
                  const status = str(r.status) || (tab === 'completed' ? 'Completed' : 'Open')
                  const placed = r.transactionDate ?? r.createdDate ?? r.createdAt
                  const completed = r.orderCompletionDate ?? r.completionDate
                  const txId = str(r.transactionId) || str(r.paymentIntentId) || '—'
                  const canComplete = tab === 'open' && isOpenFulfillmentStatus(status)
                  return (
                    <tr key={oid || i} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          disabled={!uid}
                          onClick={() => openUserDetail(r)}
                          className={`text-left font-semibold ${
                            uid
                              ? 'text-teal-800 underline-offset-2 hover:underline'
                              : 'cursor-not-allowed text-slate-400'
                          }`}
                        >
                          {name}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(r)}
                          className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                          View order details
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-900">
                        {formatMoney(r.grandTotal, r.totalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatWhen(placed)}</td>
                      {tab === 'completed' && (
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatWhen(completed)}</td>
                      )}
                      <td className="max-w-[140px] truncate px-4 py-3.5 font-mono text-xs text-slate-600" title={txId}>
                        {txId}
                      </td>
                      <td className="relative px-4 py-3.5">
                        <button
                          type="button"
                          aria-label="Actions"
                          onClick={() => setOpenMenuId(openMenuId === oid ? null : oid)}
                          className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </button>
                        {openMenuId === oid && (
                          <div className="absolute right-4 top-full z-20 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            {canComplete && (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={async () => {
                                  setOpenMenuId(null)
                                  if (!window.confirm('Move this order to completed?')) return
                                  setActionBusy(true)
                                  try {
                                    await completeAdminTshirtOrder(oid)
                                    await reloadOrders()
                                  } catch (e) {
                                    setErr(String((e as Error).message || e))
                                  } finally {
                                    setActionBusy(false)
                                  }
                                }}
                              >
                                <Archive className="h-4 w-4 text-slate-500" />
                                Move to completed
                              </button>
                            )}
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-800 hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuId(null)
                                void handleDelete(r)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!loading && filteredRows.length === 0 && (
            <div className="px-6 py-14 text-center">
              <Shirt className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
              <p className="text-base font-semibold text-slate-800">No orders in this view</p>
              <p className="mt-2 text-sm text-slate-600">
                {tab === 'open'
                  ? 'Open orders appear after instructors pay (status Successful).'
                  : 'Completed orders appear after you mark fulfillment done.'}
              </p>
            </div>
          )}
        </div>
      )}

      {detailUser && (
        <AdminPortalUserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      {detailOrder && (
        <AdminTshirtOrderDetailDrawer
          order={detailOrder}
          customerName={detailName}
          customerEmail={detailEmail}
          canComplete={detailCanComplete}
          busy={actionBusy}
          message={drawerMsg}
          messageOk={drawerOk}
          onClose={() => setDetailOrder(null)}
          onComplete={() => void handleComplete()}
          onDelete={() => void handleDelete()}
        />
      )}
    </>
  )
}
