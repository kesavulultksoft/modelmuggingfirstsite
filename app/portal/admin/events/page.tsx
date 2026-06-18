'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAdminEvent,
  deleteAdminEvent,
  fetchMe,
  getToken,
  updateAdminEvent,
  type MeUser,
} from '@/lib/portalApi'
import { authFetchJson } from '@/lib/portalApi'
import { legacyAsObjectArray, coerceMongoIdFromRow, mongoHexIdForUiState } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { crmDateFieldToUs } from '@/lib/usDate'
import UsDatePicker from '@/components/portal/UsDatePicker'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'

export default function AdminEventsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('Planned')
  const [accommodationRoomExpenses, setAccommodationRoomExpenses] = useState('')
  const [secondaryLocationFee, setSecondaryLocationFee] = useState('')
  const [primaryBedsAvailable, setPrimaryBedsAvailable] = useState('')
  const [secondaryBedsAvailable, setSecondaryBedsAvailable] = useState('')
  const [combinedExpensePoolFee, setCombinedExpensePoolFee] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/events')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
    authFetchJson<unknown>('/api/v1/admin/crm/tables/events').then((d) =>
      setRows(legacyAsObjectArray(d))
    )
  }, [router])

  async function refresh() {
    const d = await authFetchJson<unknown>('/api/v1/admin/crm/tables/events')
    setRows(legacyAsObjectArray(d))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!title.trim()) {
      setMsg('Title required.')
      return
    }
    const body: Record<string, unknown> = {
      title,
      startDate,
      endDate,
      location,
      status,
      accommodationRoomExpenses: accommodationRoomExpenses.trim() || undefined,
      secondaryLocationFee: secondaryLocationFee.trim() || undefined,
      primaryBedsAvailable: primaryBedsAvailable.trim() || undefined,
      secondaryBedsAvailable: secondaryBedsAvailable.trim() || undefined,
      combinedExpensePoolFee: combinedExpensePoolFee.trim() || undefined,
    }
    Object.keys(body).forEach((k) => {
      if (body[k] === undefined) delete body[k]
    })
    const res = id ? await updateAdminEvent(mongoHexIdForUiState(id), body) : await createAdminEvent(body)
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      setMsg(
        t
          ? `Failed to save event (${res.status}): ${t.slice(0, 400)}`
          : `Failed to save event (${res.status}).`
      )
      return
    }
    setMsg(id ? 'Event updated.' : 'Event created.')
    setId('')
    setTitle('')
    setStartDate('')
    setEndDate('')
    setLocation('')
    setStatus('Planned')
    setAccommodationRoomExpenses('')
    setSecondaryLocationFee('')
    setPrimaryBedsAvailable('')
    setSecondaryBedsAvailable('')
    setCombinedExpensePoolFee('')
    await refresh()
  }

  async function del() {
    if (!mongoHexIdForUiState(id)) return
    if (!window.confirm('Delete this event?')) return
    const res = await deleteAdminEvent(mongoHexIdForUiState(id))
    if (res.ok || res.status === 204) {
      setMsg('Event deleted.')
      setId('')
      setTitle('')
      setStartDate('')
      setEndDate('')
      setLocation('')
      setStatus('Planned')
      setAccommodationRoomExpenses('')
      setSecondaryLocationFee('')
      setPrimaryBedsAvailable('')
      setSecondaryBedsAvailable('')
      setCombinedExpensePoolFee('')
      await refresh()
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Pre-instructor events"
        subtitle="Create and edit mm_events. Start/end are the training window for this row (legacy InstrTrainingSchedule had many milestone dates; the portal uses one pair for listings, instructor views, and expense-pool context). Set combined expense pool fee (legacy combinedExpensePoolFee) for meals/incidentals; accommodation fields drive per-bed pricing and inventory."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">
            {mongoHexIdForUiState(id) ? 'Editing event' : 'Create event'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Title
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={title} onChange={(e)=>setTitle(e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-600">Training window</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                From / to bound when this training runs for catalog and instructor UIs. They are not a one-to-one
                replacement for every legacy milestone date unless you add those fields later.
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Start date
                  <div className="mt-1">
                    <UsDatePicker
                      id="admin-event-start"
                      value={startDate}
                      onChange={setStartDate}
                      buttonClassName="min-h-[2.5rem] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none"
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  End date
                  <div className="mt-1">
                    <UsDatePicker
                      id="admin-event-end"
                      value={endDate}
                      onChange={setEndDate}
                      buttonClassName="min-h-[2.5rem] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none"
                    />
                  </div>
                </label>
              </div>
            </div>
            <GooglePlacesAutocomplete
              id="admin-event-location"
              className="text-xs font-semibold text-slate-600 sm:col-span-2"
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="Start typing for address suggestions"
              inputClassName="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
            />
            <label className="text-xs font-semibold text-slate-600">
              Status
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)} />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
            <h3 className="text-sm font-bold text-slate-800">Accommodation fees (expense pool)</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Enter <strong>primary</strong> and <strong>secondary</strong> per-bed amounts in USD. These map to legacy{' '}
              <code className="rounded bg-white/80 px-0.5 text-[10px]">accommodationRoomExpenses</code> and{' '}
              <code className="rounded bg-white/80 px-0.5 text-[10px]">secondaryLocationFee</code> on{' '}
              <code className="text-[10px]">mm_events</code> and drive instructor expense-pool pricing and cart lines.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Primary accommodation fee (USD per bed)
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g. 85"
                value={accommodationRoomExpenses}
                onChange={(e) => setAccommodationRoomExpenses(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Secondary accommodation fee (USD per bed)
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g. 95"
                value={secondaryLocationFee}
                onChange={(e) => setSecondaryLocationFee(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Primary beds available (inventory)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                inputMode="numeric"
                placeholder="e.g. 6"
                value={primaryBedsAvailable}
                onChange={(e) => setPrimaryBedsAvailable(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Secondary beds available (inventory)
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                inputMode="numeric"
                placeholder="e.g. 4"
                value={secondaryBedsAvailable}
                onChange={(e) => setSecondaryBedsAvailable(e.target.value)}
              />
            </label>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-sm font-bold text-slate-800">Expense pool (meals / incidentals)</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Legacy <code className="rounded bg-white/80 px-0.5 text-[10px]">preInstructorEvent</code> field{' '}
              <code className="rounded bg-white/80 px-0.5 text-[10px]">combinedExpensePoolFee</code> on{' '}
              <code className="text-[10px]">mm_events</code>. When set, the instructor expense pool page can pre-fill the
              food pool USD amount for that training event (instructors may still edit before save).
            </p>
            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Combined expense pool fee (USD)
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g. 150"
                value={combinedExpensePoolFee}
                onChange={(e) => setCombinedExpensePoolFee(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white">
              {mongoHexIdForUiState(id) ? 'Update event' : 'Create event'}
            </button>
            {mongoHexIdForUiState(id) && (
              <button type="button" onClick={del} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700">
                Delete
              </button>
            )}
          </div>
          {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
        </form>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-bold text-slate-800">Existing events</p>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {rows.map((r, i) => {
              const hexId = coerceMongoIdFromRow(r)
              const rid = hexId || `row-${i}`
              return (
                <button
                  key={rid}
                  type="button"
                  onClick={() => {
                    if (!hexId) {
                      setMsg('Could not read this event’s id from the server response. Refresh the page or check API JSON for _id.')
                      return
                    }
                    setId(hexId)
                    setTitle(String(r.title || ''))
                    setStartDate(crmDateFieldToUs(r.startDate ?? ''))
                    setEndDate(crmDateFieldToUs(r.endDate ?? ''))
                    setLocation(String(r.location || ''))
                    setStatus(String(r.status || 'Planned'))
                    setAccommodationRoomExpenses(String(r.accommodationRoomExpenses ?? ''))
                    setSecondaryLocationFee(String(r.secondaryLocationFee ?? ''))
                    setPrimaryBedsAvailable(String(r.primaryBedsAvailable ?? ''))
                    setSecondaryBedsAvailable(String(r.secondaryBedsAvailable ?? ''))
                    setCombinedExpensePoolFee(String(r.combinedExpensePoolFee ?? ''))
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-[#00d4aa]"
                >
                  <p className="text-sm font-semibold text-slate-900">{String(r.title || 'Untitled')}</p>
                  <p className="text-xs text-slate-500">
                    {crmDateFieldToUs(r.startDate ?? '')}
                    {crmDateFieldToUs(r.endDate ?? '') ? ` – ${crmDateFieldToUs(r.endDate ?? '')}` : ''}
                  </p>
                  {(r.accommodationRoomExpenses != null && String(r.accommodationRoomExpenses).trim() !== '') ||
                  (r.secondaryLocationFee != null && String(r.secondaryLocationFee).trim() !== '') ||
                  (r.combinedExpensePoolFee != null && String(r.combinedExpensePoolFee).trim() !== '') ? (
                    <p className="mt-1 text-[11px] font-medium text-teal-800">
                      {String(r.accommodationRoomExpenses ?? '').trim()
                        ? `Primary fee: $${String(r.accommodationRoomExpenses).trim()}`
                        : ''}
                      {String(r.accommodationRoomExpenses ?? '').trim() &&
                      String(r.secondaryLocationFee ?? '').trim()
                        ? ' · '
                        : ''}
                      {String(r.secondaryLocationFee ?? '').trim()
                        ? `Secondary fee: $${String(r.secondaryLocationFee).trim()}`
                        : ''}
                      {(String(r.accommodationRoomExpenses ?? '').trim() ||
                        String(r.secondaryLocationFee ?? '').trim()) &&
                      String(r.combinedExpensePoolFee ?? '').trim()
                        ? ' · '
                        : ''}
                      {String(r.combinedExpensePoolFee ?? '').trim()
                        ? `Pool fee: $${String(r.combinedExpensePoolFee).trim()}`
                        : ''}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
