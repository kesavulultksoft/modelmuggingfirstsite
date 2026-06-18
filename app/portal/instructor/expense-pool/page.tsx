'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmProfile,
  fetchInstructorCrmView,
  fetchInstructorExpensePool,
  fetchInstructorTravelInfo,
  fetchMe,
  getToken,
  updateInstructorExpensePool,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray, legacyAsRecord, mongoIdToString } from '@/lib/legacyHelpers'
import { emitInstructorCartChanged } from '@/lib/instructorCartSummary'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { crmDateFieldToUs } from '@/lib/usDate'

/** Option values match legacy `instructorExpensePool.html` (including legacy spelling). */
const DIET_OPTIONS = [
  '',
  'Meat Based',
  'Lacto-Ovo Vegitarian',
  'Lacto-Ovo Vegetarian',
  'Vegan',
  'Gluten Free',
] as const

const MARITAL_OPTIONS = ['', 'Married', 'Single', 'Other'] as const

const ACCOMMODATION_LOCATION_OPTIONS = [
  { value: '', label: 'Select accommodation' },
  { value: 'primaryLocation', label: 'Primary accommodation and fee amount' },
  { value: 'secondaryLocation', label: 'Secondary accommodation and fee amount' },
] as const

function strTrim(v: unknown): string {
  return String(v ?? '').trim()
}

function firstNonBlank(...vals: unknown[]): string {
  for (const v of vals) {
    const t = strTrim(v)
    if (t) return t
  }
  return ''
}

/** Best-effort label from portal “trainer-assigned-courses” (location + description). */
function trainingEventHintFromCourses(courses: Record<string, unknown>[]): string {
  if (!courses.length) return ''
  const c = courses[0]
  const loc = strTrim(c.locationName)
  const desc = strTrim(c.description)
  if (loc && desc) return `${loc} — ${desc}`
  return loc || desc
}

function eventMongoId(ev: Record<string, unknown>): string {
  return mongoIdToString(ev._id)
}

function parseUsd(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Matches backend: admin catalog mm_events omit portal user id fields and carry accommodation pricing. */
function portalUserScopeFieldBlank(ev: Record<string, unknown>, key: string): boolean {
  if (!(key in ev) || ev[key] == null) return true
  if (typeof ev[key] === 'string') return String(ev[key]).trim() === ''
  return false
}

function adminCatalogAccommodationEvent(ev: Record<string, unknown>): boolean {
  if (!portalUserScopeFieldBlank(ev, 'userId')) return false
  if (!portalUserScopeFieldBlank(ev, 'createdByUserId')) return false
  if (!portalUserScopeFieldBlank(ev, 'portalInstructorUserId')) return false
  const pri = parseUsd(ev.accommodationRoomExpenses)
  const sec = parseUsd(ev.secondaryLocationFee)
  const pb = Math.max(0, parseInt(String(ev.primaryBedsAvailable ?? '').replace(/\D/g, ''), 10) || 0)
  const sb = Math.max(0, parseInt(String(ev.secondaryBedsAvailable ?? '').replace(/\D/g, ''), 10) || 0)
  const poolFee = parseUsd(ev.combinedExpensePoolFee)
  return pri > 0 || sec > 0 || pb > 0 || sb > 0 || poolFee > 0
}

function combinedExpensePoolFeeUsd(ev: Record<string, unknown>): number {
  return parseUsd(ev.combinedExpensePoolFee)
}

function expensePoolPaymentDone(d: Record<string, unknown> | null): boolean {
  if (!d) return false
  const st = String(d.status ?? d.expensePoolStatus ?? '')
    .trim()
    .toLowerCase()
  return st === 'paid' || st === 'successful'
}

function expensePoolHasSavedRow(d: Record<string, unknown> | null): boolean {
  if (!d) return false
  const st = String(d.status ?? d.expensePoolStatus ?? '').trim()
  if (st) return true
  return Boolean(d.updatedAt || d._id || d.id)
}

function eventOptionLabel(ev: Record<string, unknown>): string {
  const title = strTrim(ev.title) || 'Untitled'
  const loc = strTrim(ev.location)
  const s = crmDateFieldToUs(ev.startDate ?? '')
  const e = crmDateFieldToUs(ev.endDate ?? '')
  const dates = s && e ? `${s} – ${e}` : s || e || ''
  const id = eventMongoId(ev)
  const idHint = id ? id.slice(-8) : ''
  const bits = [title, loc, dates].filter(Boolean)
  const pool = combinedExpensePoolFeeUsd(ev)
  if (pool > 0) bits.push(`Expense pool $${pool.toFixed(2)}`)
  return `${bits.join(' · ')}${idHint ? ` (${idHint})` : ''}`
}

export default function InstructorExpensePoolPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    eventAssigned: '',
    firstName: '',
    lastName: '',
    dietPreference: '',
    splDiet: '',
    amount: '',
    fee: '',
    preferredPaymentMethod: '',
    accommodationRequired: '',
    maritalStatus: '',
    otherStatusDescription: '',
    accommodationPreferLocation: '',
    totalPrimaryBeds: '',
    totalSecondaryBeds: '',
    linkedEventId: '',
    note: '',
  })

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/expense-pool')
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
    if (!me) return
    setErr('')
    Promise.all([
      fetchInstructorExpensePool(),
      fetchInstructorCrmProfile().catch(() => ({})),
      fetchInstructorTravelInfo().catch(() => ({})),
      fetchInstructorCrmView('trainer-assigned-courses').catch(() => []),
      fetchInstructorCrmView('events').catch(() => []),
    ])
      .then(([poolRaw, profileRaw, travelRaw, coursesRaw, eventsRaw]) => {
        const rec = legacyAsRecord(poolRaw) ?? {}
        const profile = legacyAsRecord(profileRaw) ?? {}
        const travel = legacyAsRecord(travelRaw) ?? {}
        const courses = legacyAsObjectArray(coursesRaw)
        const eventRows = legacyAsObjectArray(eventsRaw)
        const eventHint = trainingEventHintFromCourses(courses)
        const adminCatalogOnly = eventRows.filter(adminCatalogAccommodationEvent)
        const ctxFromPool = legacyAsRecord(rec.accommodationEventContext) ?? {}
        const ctxEventHex = mongoIdToString(ctxFromPool.eventId)
        const linkedFromRec = mongoIdToString(rec.linkedEventId)
        const linkedCandidate = linkedFromRec || ctxEventHex
        const linkedOk =
          linkedCandidate && adminCatalogOnly.some((ev) => eventMongoId(ev) === linkedCandidate)
            ? linkedCandidate
            : ''

        setEvents(eventRows)
        setDoc(rec)
        const suggestedUsd = parseUsd(ctxFromPool.combinedExpensePoolFeeUsd ?? ctxFromPool.combinedExpensePoolFee)
        const rawAmt = rec.amount != null ? String(rec.amount) : rec.fee != null ? String(rec.fee) : ''
        const amtNum = Number(String(rawAmt).replace(/[^0-9.-]/g, '')) || 0
        const useSuggested = (rawAmt.trim() === '' || amtNum <= 0) && suggestedUsd > 0
        const amt = useSuggested ? String(suggestedUsd) : rawAmt
        const feeStr = useSuggested ? String(suggestedUsd) : rec.fee != null ? String(rec.fee) : amt
        const preferLoaded = String(rec.accommodationPreferLocation ?? '').trim()
        const primaryBedsLoaded = String(rec.totalPrimaryBeds ?? '')
        const secondaryBedsLoaded = String(rec.totalSecondaryBeds ?? '')
        setForm({
          eventAssigned: firstNonBlank(rec.eventAssigned, profile.eventAssigned, eventHint),
          firstName: firstNonBlank(rec.firstName, profile.firstName, me.firstName),
          lastName: firstNonBlank(rec.lastName, profile.lastName, me.lastName),
          dietPreference: firstNonBlank(rec.dietPreference, profile.dietPreference, profile.dietaryPreference),
          splDiet: firstNonBlank(
            rec.splDiet,
            profile.splDiet,
            profile.specialDietNotes,
            profile.dietNotes,
            profile.specialDiet
          ),
          amount: amt,
          fee: feeStr,
          preferredPaymentMethod: firstNonBlank(
            rec.preferredPaymentMethod,
            profile.preferredPaymentMethod,
            profile.paymentPreference
          ),
          accommodationRequired: String(rec.accommodationRequired ?? ''),
          maritalStatus: firstNonBlank(rec.maritalStatus, travel.maritalStatus),
          otherStatusDescription: firstNonBlank(rec.otherStatusDescription, travel.otherStatusDescription),
          accommodationPreferLocation: preferLoaded,
          totalPrimaryBeds:
            preferLoaded === 'secondaryLocation' ? '' : primaryBedsLoaded,
          totalSecondaryBeds:
            preferLoaded === 'primaryLocation' ? '' : secondaryBedsLoaded,
          linkedEventId: linkedOk,
          note: String(rec.note ?? ''),
        })
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  const accYes = (form.accommodationRequired ?? '').trim() === 'Yes'
  const maritalOther = (form.maritalStatus ?? '').trim() === 'Other'
  const accPrefer = (form.accommodationPreferLocation ?? '').trim()
  const primaryBedsDisabled = accPrefer === 'secondaryLocation'
  const secondaryBedsDisabled = accPrefer === 'primaryLocation'

  const { adminCatalogEvents } = useMemo(() => {
    const admin = events.filter(adminCatalogAccommodationEvent)
    return { adminCatalogEvents: admin }
  }, [events])

  const accCtx = useMemo(() => legacyAsRecord(doc?.accommodationEventContext) ?? {}, [doc])
  const ctxEventIdStr = useMemo(() => mongoIdToString(accCtx.eventId), [accCtx])

  useEffect(() => {
    const lid = (form.linkedEventId || '').trim()
    let ev: Record<string, unknown> | undefined
    if (lid) ev = events.find((e) => eventMongoId(e) === lid)
    if (!ev && ctxEventIdStr) ev = events.find((e) => eventMongoId(e) === ctxEventIdStr)
    let usd = ev != null ? combinedExpensePoolFeeUsd(ev) : 0
    if (usd <= 0) usd = parseUsd(accCtx.combinedExpensePoolFeeUsd ?? accCtx.combinedExpensePoolFee)
    if (usd <= 0) return
    const s = String(usd)
    setForm((p) => (p.amount === s && p.fee === s ? p : { ...p, amount: s, fee: s }))
  }, [form.linkedEventId, ctxEventIdStr, events, accCtx])

  const liveAcc = useMemo(() => {
    if (!accYes) return null
    const prefer = (form.accommodationPreferLocation ?? '').trim()
    const evId = (form.linkedEventId ?? '').trim() || ctxEventIdStr
    const ev = events.find((e) => eventMongoId(e) === evId)
    const priRate =
      ev != null ? parseUsd(ev.accommodationRoomExpenses) : parseUsd(accCtx.primaryPerBedUsd)
    const secRate = ev != null ? parseUsd(ev.secondaryLocationFee) : parseUsd(accCtx.secondaryPerBedUsd)
    const pBeds = Math.max(0, parseInt(String(form.totalPrimaryBeds || '').replace(/\D/g, ''), 10) || 0)
    const sBeds = Math.max(0, parseInt(String(form.totalSecondaryBeds || '').replace(/\D/g, ''), 10) || 0)
    let line = 0
    if (prefer === 'primaryLocation') line = priRate * pBeds
    if (prefer === 'secondaryLocation') line = secRate * sBeds
    const capP = ev != null ? parseUsd(ev.primaryBedsAvailable) : parseUsd(accCtx.primaryBedsAvailable)
    const capS = ev != null ? parseUsd(ev.secondaryBedsAvailable) : parseUsd(accCtx.secondaryBedsAvailable)
    const bookedP = parseUsd(accCtx.primaryBedsBookedOthers)
    const bookedS = parseUsd(accCtx.secondaryBedsBookedOthers)
    const remP = capP > 0 ? Math.max(0, capP - bookedP) : null
    const remS = capS > 0 ? Math.max(0, capS - bookedS) : null
    return { priRate, secRate, pBeds, sBeds, line, prefer, remP, remS, capP, capS }
  }, [accYes, form, events, accCtx, ctxEventIdStr])

  async function save() {
    setErr('')
    setMsg('')
    if (accYes && !mongoIdToString(form.linkedEventId)) {
      setErr('Select an accommodation event from the list (Admin → Pre-instructor events).')
      return
    }
    const num = Number(form.amount || form.fee || 0)
    const body: Record<string, unknown> = {
      eventAssigned: form.eventAssigned.trim() || undefined,
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      dietPreference: form.dietPreference.trim() || undefined,
      splDiet: form.splDiet.trim() || undefined,
      preferredPaymentMethod: form.preferredPaymentMethod.trim() || undefined,
      accommodationRequired: form.accommodationRequired.trim() || undefined,
      note: form.note.trim() || undefined,
      amount: Number.isFinite(num) && num > 0 ? num : undefined,
      fee: form.fee.trim() || undefined,
    }
    if (accYes) {
      body.maritalStatus = form.maritalStatus.trim() || undefined
      if (maritalOther) body.otherStatusDescription = form.otherStatusDescription.trim() || undefined
      body.accommodationPreferLocation = form.accommodationPreferLocation.trim() || undefined
      body.totalPrimaryBeds = form.totalPrimaryBeds.trim() || undefined
      body.totalSecondaryBeds = form.totalSecondaryBeds.trim() || undefined
      if (form.linkedEventId.trim()) body.linkedEventId = mongoIdToString(form.linkedEventId)
    }
    Object.keys(body).forEach((k) => {
      if (body[k] === undefined) delete body[k]
    })
    const res = await updateInstructorExpensePool(body)
    if (!res.ok) {
      const t = await res.text()
      try {
        const j = JSON.parse(t) as { error?: string }
        setErr(j.error || t || 'Failed to submit expense pool request.')
      } catch {
        setErr(t || 'Failed to submit expense pool request.')
      }
      return
    }
    const updated = legacyAsRecord(await res.json())
    if (!updated) {
      setErr('Empty response from server.')
      return
    }
    if (updated.error) {
      setErr(String(updated.error))
      return
    }
    setDoc(updated)
    setForm((p) => ({
      ...p,
      linkedEventId: mongoIdToString(updated.linkedEventId) || p.linkedEventId,
      totalPrimaryBeds: String(updated.totalPrimaryBeds ?? p.totalPrimaryBeds),
      totalSecondaryBeds: String(updated.totalSecondaryBeds ?? p.totalSecondaryBeds),
      accommodationPreferLocation: String(updated.accommodationPreferLocation ?? p.accommodationPreferLocation),
    }))
    setMsg('Expense pool saved. Food pool and accommodation lines added to Cart.')
    emitInstructorCartChanged()
  }

  const displayPrimaryPerBed = useMemo(() => {
    if (liveAcc && liveAcc.priRate > 0) return `$${liveAcc.priRate.toFixed(2)}`
    if (doc != null && doc.primaryRoomExpenses != null && String(doc.primaryRoomExpenses).trim() !== '')
      return String(doc.primaryRoomExpenses)
    return '—'
  }, [liveAcc, doc])

  const displaySecondaryPerBed = useMemo(() => {
    if (liveAcc && liveAcc.secRate > 0) return `$${liveAcc.secRate.toFixed(2)}`
    if (doc != null && doc.secondaryRoomExpenses != null && String(doc.secondaryRoomExpenses).trim() !== '')
      return String(doc.secondaryRoomExpenses)
    return '—'
  }, [liveAcc, doc])

  const accommodationLineUsd = useMemo(() => {
    if (!accYes) return 0
    if (
      liveAcc &&
      (liveAcc.prefer === 'primaryLocation' || liveAcc.prefer === 'secondaryLocation') &&
      (liveAcc.pBeds > 0 || liveAcc.sBeds > 0)
    ) {
      return liveAcc.line
    }
    return parseUsd(doc?.accommodationRoomExpenses)
  }, [accYes, liveAcc, doc])

  const showGoToCart = expensePoolHasSavedRow(doc) && !expensePoolPaymentDone(doc)

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Expense pool"
        subtitle="Submit your pool request; food and accommodation lines sync to Cart when amounts apply. Combined expense pool fee and per-bed rates come from Admin → Pre-instructor events (mm_events). Pick an accommodation event below when you need a room."
      />
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          The expense pool covers shared training costs such as meals and water. Rental cars are not included. Submit
          your event assignment and diet needs; the food pool amount is set from staff on the linked pre-instructor event
          when applicable.
        </p>
      </div>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-600">Expense pool (main)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('eventAssigned')}
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Training event"
              value={form.eventAssigned}
              onChange={(e) => setForm((p) => ({ ...p, eventAssigned: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('firstName')}
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('lastName')}
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('dietPreference')}
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={form.dietPreference}
              onChange={(e) => setForm((p) => ({ ...p, dietPreference: e.target.value }))}
            >
              {DIET_OPTIONS.map((opt) => (
                <option key={opt || 'empty'} value={opt}>
                  {opt === 'Lacto-Ovo Vegetarian'
                    ? 'Lacto-Ovo Vegetarian (corrected spelling)'
                    : opt || 'Select preference'}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('splDiet')}
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.splDiet}
              onChange={(e) => setForm((p) => ({ ...p, splDiet: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Expense pool (USD)
            <input
              type="text"
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              value={form.amount}
              title="Set by staff on Admin → Pre-instructor events (combined expense pool fee)"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('preferredPaymentMethod')}
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Check, ACH"
              value={form.preferredPaymentMethod}
              onChange={(e) => setForm((p) => ({ ...p, preferredPaymentMethod: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('note')}
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-600">Accommodation / room expenses required</h2>
        <fieldset className="text-sm font-semibold text-slate-700">
          <legend className="mb-1">{labelForFormField('accommodationRequired')}</legend>
          <div className="mt-1 flex flex-wrap gap-6 text-sm font-normal">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="accommodationRequired"
                value="Yes"
                checked={(form.accommodationRequired ?? '').trim() === 'Yes'}
                onChange={() => setForm((p) => ({ ...p, accommodationRequired: 'Yes' }))}
              />
              Yes
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="accommodationRequired"
                value="No"
                checked={(form.accommodationRequired ?? '').trim() === 'No'}
                onChange={() => setForm((p) => ({ ...p, accommodationRequired: 'No' }))}
              />
              No
            </label>
          </div>
        </fieldset>

        {accYes && (
          <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                {labelForFormField('linkedEventId')}
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  value={mongoIdToString(form.linkedEventId)}
                  onChange={(e) => {
                    const v = mongoIdToString(e.target.value)
                    setForm((p) => {
                      const ev = events.find((e2) => eventMongoId(e2) === v)
                      const feeUsd = ev != null ? combinedExpensePoolFeeUsd(ev) : 0
                      if (feeUsd > 0) {
                        const s = String(feeUsd)
                        return { ...p, linkedEventId: v, amount: s, fee: s }
                      }
                      return { ...p, linkedEventId: v }
                    })
                  }}
                >
                  <option value="">Select</option>
                  {adminCatalogEvents.map((ev, idx) => {
                    const id = eventMongoId(ev)
                    return (
                      <option key={id || `adm-${idx}`} value={id}>
                        {eventOptionLabel(ev)}
                      </option>
                    )
                  })}
                </select>
              </label>
              {String(accCtx.eventId || '').trim() !== '' && (
                <p className="text-xs text-slate-600 sm:col-span-2">
                  Context event: <code className="text-[11px]">{String(accCtx.eventId)}</code>
                  {accCtx.title ? ` — ${String(accCtx.title)}` : ''}
                  {accCtx.primaryBedsAvailable != null ? (
                    <span>
                      {' '}
                      · Primary beds remaining (others excluded): {String(accCtx.primaryBedsRemaining ?? '—')}
                    </span>
                  ) : null}
                  {parseUsd(accCtx.combinedExpensePoolFeeUsd ?? accCtx.combinedExpensePoolFee) > 0 ? (
                    <span>
                      {' '}
                      · Staff combined expense pool fee: $
                      {parseUsd(accCtx.combinedExpensePoolFeeUsd ?? accCtx.combinedExpensePoolFee).toFixed(2)}
                    </span>
                  ) : null}
                </p>
              )}
              {liveAcc &&
                liveAcc.prefer === 'primaryLocation' &&
                liveAcc.remP != null &&
                liveAcc.pBeds > liveAcc.remP && (
                  <p className="text-sm text-red-600 sm:col-span-2">
                    Primary beds requested exceed remaining inventory for this event. Reduce beds or pick another
                    event.
                  </p>
                )}
              {liveAcc &&
                liveAcc.prefer === 'secondaryLocation' &&
                liveAcc.remS != null &&
                liveAcc.sBeds > liveAcc.remS && (
                  <p className="text-sm text-red-600 sm:col-span-2">
                    Secondary beds requested exceed remaining inventory for this event.
                  </p>
                )}
              <label className="text-sm font-semibold text-slate-700">
                {labelForFormField('maritalStatus')}
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  value={form.maritalStatus}
                  onChange={(e) => setForm((p) => ({ ...p, maritalStatus: e.target.value }))}
                >
                  {MARITAL_OPTIONS.map((opt) => (
                    <option key={opt || 'empty'} value={opt}>
                      {opt || 'Select status'}
                    </option>
                  ))}
                </select>
              </label>
              {maritalOther && (
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  {labelForFormField('otherStatusDescription')}
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                    rows={2}
                    value={form.otherStatusDescription}
                    onChange={(e) => setForm((p) => ({ ...p, otherStatusDescription: e.target.value }))}
                  />
                </label>
              )}
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                {labelForFormField('accommodationPreferLocation')}
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  value={form.accommodationPreferLocation}
                  onChange={(e) => {
                    const v = e.target.value
                    setForm((p) => ({
                      ...p,
                      accommodationPreferLocation: v,
                      ...(v === 'primaryLocation' ? { totalSecondaryBeds: '' } : {}),
                      ...(v === 'secondaryLocation' ? { totalPrimaryBeds: '' } : {}),
                    }))
                  }}
                >
                  {ACCOMMODATION_LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value || 'empty'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className={`text-sm font-semibold text-slate-700 ${primaryBedsDisabled ? 'opacity-50' : ''}`}
              >
                {labelForFormField('totalPrimaryBeds')}
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal disabled:cursor-not-allowed disabled:bg-slate-50"
                  inputMode="numeric"
                  disabled={primaryBedsDisabled}
                  value={form.totalPrimaryBeds}
                  onChange={(e) => setForm((p) => ({ ...p, totalPrimaryBeds: e.target.value }))}
                />
              </label>
              <label
                className={`text-sm font-semibold text-slate-700 ${secondaryBedsDisabled ? 'opacity-50' : ''}`}
              >
                {labelForFormField('totalSecondaryBeds')}
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal disabled:cursor-not-allowed disabled:bg-slate-50"
                  inputMode="numeric"
                  disabled={secondaryBedsDisabled}
                  value={form.totalSecondaryBeds}
                  onChange={(e) => setForm((p) => ({ ...p, totalSecondaryBeds: e.target.value }))}
                />
              </label>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm sm:col-span-2">
                <p className="font-semibold text-slate-700">Per-bed rates (saved on this request)</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">Primary ($/bed)</dt>
                    <dd className="text-slate-900">{displayPrimaryPerBed}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-slate-500">Secondary ($/bed)</dt>
                    <dd className="text-slate-900">{displaySecondaryPerBed}</dd>
                  </div>
                </dl>
                <p className="mt-3 font-semibold text-slate-700">Accommodation cart line (legacy total)</p>
                <p className="text-slate-900">
                  Line total (cart): <strong>${accommodationLineUsd.toFixed(2)}</strong>
                  {parseUsd(doc?.accommodationRoomExpenses) > 0 &&
                    Math.abs(parseUsd(doc?.accommodationRoomExpenses) - accommodationLineUsd) > 0.009 && (
                      <span className="ml-2 text-xs font-normal text-slate-600">
                        Last saved: ${parseUsd(doc?.accommodationRoomExpenses).toFixed(2)}
                      </span>
                    )}
                </p>
                {liveAcc && (
                  <p className="mt-1 text-xs text-slate-600">
                    {liveAcc.prefer === 'primaryLocation' && liveAcc.pBeds > 0 ? (
                      <>
                        Live preview: {liveAcc.priRate.toFixed(2)} × {liveAcc.pBeds} primary bed(s) = $
                        {liveAcc.line.toFixed(2)}
                      </>
                    ) : liveAcc.prefer === 'secondaryLocation' && liveAcc.sBeds > 0 ? (
                      <>
                        Live preview: {liveAcc.secRate.toFixed(2)} × {liveAcc.sBeds} secondary bed(s) = $
                        {liveAcc.line.toFixed(2)}
                      </>
                    ) : liveAcc.prefer === 'primaryLocation' || liveAcc.prefer === 'secondaryLocation' ? (
                      <>Enter bed count for your selected accommodation location.</>
                    ) : (
                      <>Choose primary or secondary accommodation above, then enter beds for that location.</>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-600">Cart preview (matches legacy mm_cart types)</h2>
        <ul className="list-inside list-disc text-sm text-slate-700">
          <li>
            <strong>Expense Pool</strong> (food / incidentals): $
            {(Number(form.amount || form.fee) || 0).toFixed(2)}
          </li>
          <li>
            <strong>Accommodation/Room Expenses</strong>: $
            {(accYes ? accommodationLineUsd : 0).toFixed(2)}
          </li>
        </ul>
        <Link href="/portal/instructor/cart" className="mt-3 inline-block text-sm font-semibold text-[#0d9488] underline">
          Open cart
        </Link>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e]"
          >
            Submit request
          </button>
          {showGoToCart && (
            <Link
              href="/portal/instructor/cart"
              className="rounded-xl border border-[#0d9488] bg-white px-5 py-2.5 text-sm font-bold text-[#0d9488] hover:bg-teal-50"
            >
              Go to Cart
            </Link>
          )}
        </div>
      </div>

      {doc && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold text-slate-500">Expense pool status</dt>
              <dd className="text-slate-900">{String(doc.status ?? doc.expensePoolStatus ?? '—')}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Admin note</dt>
              <dd className="text-slate-900">{String(doc.adminNote ?? '—')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-bold text-slate-500">Last updated</dt>
              <dd className="text-slate-900">{String(doc.updatedAt ?? doc.createdAt ?? '—')}</dd>
            </div>
          </dl>
        </div>
      )}
    </>
  )
}
