'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  authFetchJson,
  createInstructorEvent,
  deleteInstructorEvent,
  fetchMe,
  getToken,
  updateInstructorEvent,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray, mongoIdToString } from '@/lib/legacyHelpers'
import { crmDateFieldToUs } from '@/lib/usDate'
import UsDatePicker from '@/components/portal/UsDatePicker'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function InstructorMyTrainingPage() {
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
      router.replace('/login?next=/portal/instructor/my-training')
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
    refresh()
  }, [router])

  async function refresh() {
    const d = await authFetchJson<unknown>('/api/v1/instructor/crm/views/events').catch(() => [])
    setRows(legacyAsObjectArray(d))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!title.trim()) return setMsg('Title required.')
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
    const res = id ? await updateInstructorEvent(id, body) : await createInstructorEvent(body)
    if (!res.ok) return setMsg('Failed to save event.')
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
    if (!id || !window.confirm('Delete this event?')) return
    const res = await deleteInstructorEvent(id)
    if (!res.ok && res.status !== 204) return
    setId('')
    setMsg('Event deleted.')
    await refresh()
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Pre-instructor events"
        subtitle="Create mm_events for your training window. Set combined expense pool fee (legacy combinedExpensePoolFee) and/or per-bed fees and bed counts so the expense pool page can pre-fill food pool USD and price accommodation (legacy preInstructorEvent parity)."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">{id ? `Editing event ${id}` : 'Create event'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Start date</p>
              <UsDatePicker value={startDate} onChange={setStartDate} buttonClassName="min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">End date</p>
              <UsDatePicker value={endDate} onChange={setEndDate} buttonClassName="min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none" />
            </div>
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Status" value={status} onChange={(e)=>setStatus(e.target.value)} />
            <p className="text-xs text-slate-600 sm:col-span-2">
              Optional: per-bed USD rates and bed inventory (same fields as legacy pre-instructor event admin form).
            </p>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Primary per-bed fee (USD)"
              value={accommodationRoomExpenses}
              onChange={(e) => setAccommodationRoomExpenses(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Secondary per-bed fee (USD)"
              value={secondaryLocationFee}
              onChange={(e) => setSecondaryLocationFee(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Primary beds available"
              value={primaryBedsAvailable}
              onChange={(e) => setPrimaryBedsAvailable(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Secondary beds available"
              value={secondaryBedsAvailable}
              onChange={(e) => setSecondaryBedsAvailable(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Combined expense pool fee (USD) — optional, legacy mm_events field"
              value={combinedExpensePoolFee}
              onChange={(e) => setCombinedExpensePoolFee(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white">{id ? 'Update event' : 'Create event'}</button>
            {id && <button type="button" onClick={del} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700">Delete</button>}
          </div>
          {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
        </form>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-bold text-slate-800">Existing events</p>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {rows.map((r, i) => {
              const hexId =
                mongoIdToString(r._id) ||
                (typeof (r as { dumId?: unknown }).dumId === 'string'
                  ? String((r as { dumId: string }).dumId).trim()
                  : mongoIdToString((r as { dumId?: unknown }).dumId))
              const rid = hexId || `row-${i}`
              const mine = String(r.createdByUserId || '') === me.id
              return (
                <button
                  key={rid}
                  type="button"
                  disabled={!mine}
                  onClick={() => {
                    if (!mine || !hexId) return
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
                  className={`w-full rounded-xl border px-3 py-2 text-left ${mine ? 'border-slate-200 hover:border-[#00d4aa]' : 'border-slate-100 bg-slate-50 opacity-80'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{String(r.title || 'Untitled')}</p>
                  <p className="text-xs text-slate-500">{String(r.startDate || '')} {mine ? '' : '• shared event'}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
