'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchMe,
  fetchEquipPending,
  fetchEquipApproved,
  fetchEquipReturned,
  fetchEquipRequestById,
  fetchEquipRequestHistory,
  updateEquipRequestStatus,
  getToken,
} from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Row = Record<string, unknown>
type Tab = 'pending' | 'approved' | 'returned'

export default function EquipPortalPage() {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  const [pending, setPending] = useState<Row[]>([])
  const [approved, setApproved] = useState<Row[]>([])
  const [returned, setReturned] = useState<Row[]>([])
  const [tab, setTab] = useState<Tab>('pending')
  const [selected, setSelected] = useState<Row | null>(null)
  const [history, setHistory] = useState<Row[]>([])
  const [adminNote, setAdminNote] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/equip')
      return
    }
    fetchMe().then((u) => {
      if (u?.role !== 'EQUIPSPECIALIST') router.replace('/portal')
      else {
        setOk(true)
        reloadAll()
      }
    })
  }, [router])

  if (!ok) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const rows = tab === 'pending' ? pending : tab === 'approved' ? approved : returned
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending approvals', count: pending.length },
    { id: 'approved', label: 'Approved / issued', count: approved.length },
    { id: 'returned', label: 'Returned', count: returned.length },
  ]

  async function reloadAll() {
    const [p, a, r] = await Promise.all([fetchEquipPending(), fetchEquipApproved(), fetchEquipReturned()])
    setPending(Array.isArray(p) ? p : [])
    setApproved(Array.isArray(a) ? a : [])
    setReturned(Array.isArray(r) ? r : [])
  }

  function requestIdOf(r: Row): string {
    const raw = r._id
    if (raw && typeof raw === 'object' && '$oid' in (raw as Record<string, unknown>)) {
      return String((raw as { $oid?: unknown }).$oid || '')
    }
    if (typeof raw === 'string') return raw
    return String(r.id || '')
  }

  async function openDetails(r: Row) {
    setStatusMsg('')
    const id = requestIdOf(r)
    if (!id) return
    const [d, h] = await Promise.all([fetchEquipRequestById(id), fetchEquipRequestHistory(id)])
    const detail = (d as Row | null) ?? r
    setSelected(detail)
    setAdminNote(String(detail.adminNote || ''))
    setHistory(Array.isArray(h) ? (h as Row[]) : [])
  }

  async function markStatus(next: 'Approved' | 'Returned' | 'Pending') {
    if (!selected) return
    const id = requestIdOf(selected)
    if (!id) return
    const res = await updateEquipRequestStatus(id, next, adminNote.trim() || undefined)
    if (!res.ok) {
      const t = await res.text()
      try {
        const j = JSON.parse(t) as { error?: string }
        setStatusMsg(j.error || 'Could not update request status')
      } catch {
        setStatusMsg(t || 'Could not update request status')
      }
      return
    }
    setStatusMsg(`Saved as ${next}`)
    await reloadAll()
    const d = await fetchEquipRequestById(id)
    if (d) setSelected(d as Row)
    const h = await fetchEquipRequestHistory(id)
    setHistory(Array.isArray(h) ? (h as Row[]) : [])
  }

  return (
    <>
      <PortalPageHeader
        title="Equipment specialist"
        subtitle="Legacy equipment workflow: pending approvals, approved/issued records, returned queue, and request history."
      />
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === t.id
                ? 'border-[#00d4aa] text-[#0f172a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold">Instructor</th>
              <th className="p-4 font-semibold">Item</th>
              <th className="p-4 font-semibold">Qty</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Created</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No equipment records
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${requestIdOf(r) || i}-${String(r.status || '')}`} className="border-t border-slate-100">
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">
                      {String(r.instructorName || `${String(r.firstName || '')} ${String(r.lastName || '')}` || '—')}
                    </p>
                    <p className="font-mono text-xs text-slate-500">{String(r.userId ?? '—')}</p>
                  </td>
                  <td className="p-4">{String(r.itemLabel || r.itemName || r.inventoryName || '—')}</td>
                  <td className="p-4">{String(r.quantity ?? r.qty ?? '—')}</td>
                  <td className="p-4">{String(r.status ?? '—')}</td>
                  <td className="p-4 text-slate-500">
                    {r.createdDate != null ? String(r.createdDate) : '—'}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => openDetails(r)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold hover:border-[#00d4aa]"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Request details - {String(selected.itemLabel || selected.itemName || selected.inventoryName || 'Equipment')}
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setHistory([])
                setStatusMsg('')
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructor</p>
              <p className="text-sm text-slate-800">
                {String(selected.instructorName || `${String(selected.firstName || '')} ${String(selected.lastName || '')}` || '—')}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
              <p className="font-mono text-sm text-slate-800">{String(selected.userId || '—')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
              <p className="text-sm text-slate-800">{String(selected.quantity ?? selected.qty ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="text-sm text-slate-800">{String(selected.status || '—')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available stock</p>
              <p className="text-sm text-slate-800">
                {selected.stockKnown === false ? 'Unknown' : String(selected.availableStock ?? 'Unknown')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
              <p className="text-sm text-slate-700">{String(selected.notes || selected.requestNotes || '—')}</p>
            </div>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Admin note
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="mt-1 min-h-[90px] w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => markStatus('Pending')}
              className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
            >
              Keep pending
            </button>
            <button
              type="button"
              onClick={() => markStatus('Approved')}
              className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              Mark approved
            </button>
            <button
              type="button"
              onClick={() => markStatus('Returned')}
              className="rounded border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800"
            >
              Mark returned
            </button>
          </div>
          {statusMsg && <p className="mt-3 text-sm text-slate-700">{statusMsg}</p>}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-slate-900">Item history</h4>
            <ul className="mt-2 space-y-2">
              {history.length === 0 ? (
                <li className="text-sm text-slate-500">No history rows found.</li>
              ) : (
                history.map((h, i) => (
                  <li key={`${requestIdOf(h) || i}`} className="rounded border border-slate-200 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{String(h.status || '—')}</span>
                      <span className="text-xs text-slate-500">{String(h.updatedAt || h.createdDate || '—')}</span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {String(h.userId || '—')} • Qty {String(h.quantity ?? h.qty ?? '—')}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
