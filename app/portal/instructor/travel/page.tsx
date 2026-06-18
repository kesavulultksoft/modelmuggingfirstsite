'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorTravelInfo,
  fetchMe,
  getToken,
  updateInstructorTravelInfo,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { isMultilineFieldKey, labelForFormField } from '@/lib/humanizeFieldLabel'
import { crmDateFieldToUs } from '@/lib/usDate'

/**
 * Order roughly matches legacy `instructorTravelInfo.html` (plane block → relationship → partner → dates/times → rental).
 * Extra keys (`preferredAirport`, `airline`, `hotel`, `confirmationNumber`, `notes`) stay for rows that already have them in Mongo.
 */
const FIELD_ORDER = [
  'travelMode',
  'arrivalAirportName',
  'departureAirportName',
  'flightNumber',
  'preferredAirport',
  'airline',
  'maritalStatus',
  'otherStatusDescription',
  'travelPartnerName',
  'arrivalDate',
  'timeOfArrival',
  'departureDate',
  'timeOfDeparture',
  'rentalCar',
  'hotel',
  'confirmationNumber',
  'notes',
] as const

const TRAVEL_MODES = ['', 'Plane', 'Drive', 'Train', 'Bus'] as const
const MARITAL_OPTIONS = ['', 'Married', 'Single', 'Other'] as const

const PLANE_ONLY = new Set([
  'arrivalAirportName',
  'departureAirportName',
  'flightNumber',
  'preferredAirport',
  'airline',
])

function normalizeTravelRecord(rec: Record<string, unknown>) {
  const out = { ...rec }
  const t1 = String(out.timeOfArrival ?? '').trim()
  const t2 = String(out.timeOfArraival ?? '').trim()
  if (!t1 && t2) out.timeOfArrival = t2
  delete out.timeOfArraival
  return out
}

function orderedKeys(form: Record<string, string>): string[] {
  const set = new Set(Object.keys(form))
  const ordered: string[] = []
  for (const k of FIELD_ORDER) {
    if (set.has(k)) ordered.push(k)
  }
  const rest = [...set].filter((k) => !ordered.includes(k)).sort((a, b) => a.localeCompare(b))
  return [...ordered, ...rest]
}

export default function InstructorTravelPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/travel')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me?.id) return
    fetchInstructorTravelInfo()
      .then((d) => {
        const rec = normalizeTravelRecord(legacyAsRecord(d) ?? {})
        const next: Record<string, string> = {}
        for (const k of FIELD_ORDER) {
          const raw = rec[k]
          next[k] =
            k === 'arrivalDate' || k === 'departureDate' ? crmDateFieldToUs(raw) : String(raw ?? '')
        }
        Object.keys(rec).forEach((k) => {
          if (k.startsWith('_') || k === 'userId' || k === 'updatedAt') return
          if (next[k] === undefined) {
            next[k] = k === 'arrivalDate' || k === 'departureDate' ? crmDateFieldToUs(rec[k]) : String(rec[k] ?? '')
          }
        })
        setForm(next)
      })
      .catch(() => setForm(Object.fromEntries(FIELD_ORDER.map((k) => [k, '']))))
  }, [me?.id])

  const keys = useMemo(() => orderedKeys(form), [form])
  const planeMode = (form.travelMode ?? '').trim() === 'Plane'

  const visibleKeys = useMemo(() => {
    return keys.filter((k) => {
      if (k === 'status' || k === 'timeOfArraival') return false
      if (PLANE_ONLY.has(k) && !planeMode) return false
      if (k === 'otherStatusDescription' && (form.maritalStatus ?? '').trim() !== 'Other') return false
      return true
    })
  }, [keys, planeMode, form.maritalStatus])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  async function save() {
    setErr('')
    setMsg('')
    const body: Record<string, unknown> = {}
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim() === '') return
      if (k === 'status') return
      if (k === 'timeOfArraival') return
      body[k] = v.trim()
    })
    const res = await updateInstructorTravelInfo(body)
    if (!res.ok) {
      setErr((await res.text()) || 'Save failed')
      return
    }
    setMsg('Travel info saved.')
  }

  const dateFieldClass =
    'mt-1 h-auto min-h-[2.5rem] w-full justify-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-none hover:bg-slate-50'
  const textInputClass = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900'

  return (
    <>
      <PortalPageHeader
        title="Travel information"
        subtitle="Arrival and departure coordination — aligned with legacy instructorTravelInfo.html; stored in mm_travel_infos."
      />
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Enter how you are traveling so staff can coordinate pickups and housing. For flights, spell out full airport
        names (no abbreviations). Relationship status and rental-car radios match the legacy Angular form; airport and
        flight fields only appear when travel mode is Plane.
      </p>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleKeys.map((k) => {
            if (k === 'travelMode') {
              return (
                <label key={k} className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  {labelForFormField(k)}
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  >
                    {TRAVEL_MODES.map((opt) => (
                      <option key={opt || 'empty'} value={opt}>
                        {opt || 'Select type'}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
            if (k === 'maritalStatus') {
              return (
                <label key={k} className="text-sm font-semibold text-slate-700">
                  {labelForFormField(k)}
                  <select
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  >
                    {MARITAL_OPTIONS.map((opt) => (
                      <option key={opt || 'empty'} value={opt}>
                        {opt || 'Select status'}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
            if (k === 'rentalCar') {
              return (
                <fieldset key={k} className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  <legend className="mb-1">{labelForFormField(k)}</legend>
                  <div className="mt-1 flex flex-wrap gap-6 text-sm font-normal">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rentalCar"
                        value="Yes"
                        checked={(form.rentalCar ?? '').trim() === 'Yes'}
                        onChange={() => setForm((p) => ({ ...p, rentalCar: 'Yes' }))}
                      />
                      Yes
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rentalCar"
                        value="No"
                        checked={(form.rentalCar ?? '').trim() === 'No'}
                        onChange={() => setForm((p) => ({ ...p, rentalCar: 'No' }))}
                      />
                      No
                    </label>
                  </div>
                </fieldset>
              )
            }
            if (k === 'arrivalDate' || k === 'departureDate') {
              return (
                <label key={k} className="text-sm font-semibold text-slate-700">
                  {labelForFormField(k)}
                  <UsDatePicker
                    id={`travel-${k}`}
                    value={form[k] ?? ''}
                    onChange={(v) => setForm((p) => ({ ...p, [k]: v }))}
                    buttonClassName={dateFieldClass}
                  />
                </label>
              )
            }
            if (k === 'timeOfArrival' || k === 'timeOfDeparture') {
              return (
                <label key={k} className="text-sm font-semibold text-slate-700">
                  {labelForFormField(k)}
                  <input
                    className={textInputClass}
                    placeholder="e.g. 2:30 PM or 14:30 (legacy Kendo times are accepted as text)"
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  />
                </label>
              )
            }
            return (
              <label
                key={k}
                className={`text-sm font-semibold text-slate-700 ${isMultilineFieldKey(k) ? 'sm:col-span-2' : ''}`}
              >
                {labelForFormField(k)}
                {isMultilineFieldKey(k) ? (
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                    rows={3}
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  />
                ) : (
                  <input
                    className={textInputClass}
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  />
                )}
              </label>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Legacy Angular bound arrival time to the misspelled field <code className="rounded bg-slate-100 px-1">timeOfArraival</code>
          ; this portal reads that into <code className="rounded bg-slate-100 px-1">timeOfArrival</code> and saves the corrected key.
        </p>
        <button
          type="button"
          onClick={save}
          className="mt-4 rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e]"
        >
          Save travel info
        </button>
      </div>
    </>
  )
}
