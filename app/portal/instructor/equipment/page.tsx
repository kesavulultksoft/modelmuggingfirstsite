'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createInstructorEquipmentRequest,
  fetchInstructorCrmView,
  fetchInstructorInventoryNames,
  fetchMe,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

function rowLabel(r: Record<string, unknown>): string {
  return String(r.name || r.itemName || r.title || r.label || r.description || 'Item').trim() || 'Item'
}

function rowId(r: Record<string, unknown>, i: number): string {
  const id = r._id
  if (id && typeof id === 'object' && id !== null && '$oid' in id) return String((id as { $oid: string }).$oid)
  if (typeof id === 'string') return id
  return `inv-${i}`
}

export default function InstructorEquipmentPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [catalog, setCatalog] = useState<Record<string, unknown>[]>([])
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/equipment')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me) return
    setErr('')
    fetchInstructorInventoryNames()
      .then((rows) => setCatalog(Array.isArray(rows) ? rows : []))
      .catch(() => setCatalog([]))
    fetchInstructorCrmView('equipment-approval')
      .then((d) => setRequests(legacyAsObjectArray(d)))
      .catch(() => setRequests([]))
  }, [me])

  const selectedCatalog = useMemo(() => {
    const id = inventoryItemId
    if (!id) return null
    return catalog.find((r, i) => rowId(r, i) === id) || null
  }, [catalog, inventoryItemId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setErr('')
    if (!inventoryItemId) {
      setErr('Select an equipment item from the admin catalog.')
      return
    }
    setSaving(true)
    const body: Record<string, unknown> = {
      inventoryNameId: inventoryItemId,
      itemLabel: selectedCatalog ? rowLabel(selectedCatalog) : '',
      quantity: Number(quantity) || 1,
      notes: notes.trim(),
      requestNotes: notes.trim(),
    }
    const res = await createInstructorEquipmentRequest(body)
    setSaving(false)
    if (!res.ok) {
      setErr((await res.text()) || 'Could not submit request.')
      return
    }
    setMsg('Request submitted for admin review.')
    setNotes('')
    setQuantity('1')
    fetchInstructorCrmView('equipment-approval')
      .then((d) => setRequests(legacyAsObjectArray(d)))
      .catch(() => {})
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Equipment requests"
        subtitle="Pick items from the admin equipment catalog (InventoryName), then submit quantity and notes. Staff approve requests from Admin → Equipment center → Approval requests or the equipment specialist queue."
      />
      {err && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}
      {msg && <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">New request</h2>
          <p className="mt-1 text-sm text-slate-600">
            Items are defined in the admin equipment center (Inventory names). Choose what you need; staff will approve or follow up.
          </p>
          <label className="mt-4 block text-sm font-semibold text-slate-700">{`Equipment item`}</label>
          <select
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={inventoryItemId}
            onChange={(e) => setInventoryItemId(e.target.value)}
          >
            <option value="">{`Select from catalog…`}</option>
            {catalog.map((r, i) => (
              <option key={rowId(r, i)} value={rowId(r, i)}>
                {rowLabel(r)}
              </option>
            ))}
          </select>
          {catalog.length === 0 && (
            <p className="mt-2 text-xs text-amber-800">
              No catalog items yet. Ask an admin to add equipment under Admin → Equipment center → Equipment catalog.
            </p>
          )}
          <label className="mt-4 block text-sm font-semibold text-slate-700">{`Quantity`}</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <label className="mt-4 block text-sm font-semibold text-slate-700">{`Notes for admin`}</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Size, color, shipping address if needed…"
          />
          <button
            type="submit"
            disabled={saving || catalog.length === 0}
            className="mt-6 w-full rounded-xl bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit request'}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
          <h2 className="text-lg font-bold text-slate-900">Your requests</h2>
          <p className="mt-1 text-sm text-slate-600">Rows from your mm_equipment_approval_requests history.</p>
          <ul className="mt-4 space-y-3">
            {requests.length === 0 ? (
              <li className="text-sm text-slate-500">No requests yet.</li>
            ) : (
              requests.map((r, i) => (
                <li key={String(r._id || r.id || i)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {String(r.itemLabel || r.itemName || r.name || r.inventoryName || 'Request')}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">
                      {String(r.status || '—')}
                    </span>
                  </div>
                  {r.qty != null || r.quantity != null ? (
                    <p className="mt-1 text-xs text-slate-500">Qty: {String(r.quantity ?? r.qty)}</p>
                  ) : null}
                  {r.notes || r.requestNotes ? (
                    <p className="mt-1 text-slate-600">{String(r.notes || r.requestNotes)}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  )
}
