'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import {
  deleteInstructorLiabilityHealth,
  downloadInstructorLiabilityHealthFile,
  fetchInstructorCrmProfile,
  fetchInstructorCrmView,
  fetchInstructorLiabilityHealth,
  postInstructorLiabilityHealth,
  uploadInstructorLiabilityHealthFile,
  type LiabilityHealthRow,
  type MeUser,
} from '@/lib/portalApi'
import { captureElementAsPdfDataUrl } from '@/lib/liabilityPdf'
import { coerceMongoIdFromRow, legacyAsObjectArray, legacyAsRecord } from '@/lib/legacyHelpers'
import { formatUsPhoneInput, isValidUsPhone10 } from '@/lib/phoneUs'
import { crmDateFieldToUs, formatUsDate } from '@/lib/usDate'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'

const WAIVER_PARAGRAPHS = [
  'I am aware that the course involves strenuous physical activities and personal body contact, and that I will be participating in simulated rape scenarios, which can be physically harmful and/or emotionally stressful.',
  'I am voluntarily taking MODEL MUGGING SELF-DEFENSE with knowledge of the danger involved and I agree to accept any and all risks of injury.',
  'If I have a disability, illness, or am currently seeing a therapist, I promise to consult with my physician or therapist before taking MODEL MUGGING SELF-DEFENSE. If I am pregnant, have a disability or illness, I will provide written consent from my physician and attach to this release.',
  'I agree that I, my heirs, legal representatives and assigns (1) will not make a claim against MODEL MUGGING SELF-DEFENSE for any injury or damage resulting from my participation in the Course, and (2) will release and discharge MODEL MUGGING SELF-DEFENSE from all claims or demands arising from injury or damage to me caused by my participation in the course.',
  'I do not intend to use the information learned in these practice sessions to violate any federal, state, or local laws. I will use the techniques only if I believe I or another innocent person is in unavoidable danger of great bodily harm or death.',
  'I promise to defend, indemnify, and hold MODEL MUGGING SELF-DEFENSE harmless from any claims and actions by third parties alleging injury from my use of the techniques learned in the course.',
  'I HAVE CAREFULLY READ THIS AGREEMENT AND FULLY UNDERSTAND ITS CONTENTS. I AM AWARE THAT THIS IS A RELEASE OF LIABILITY AND A CONTRACT BETWEEN MYSELF AND MODEL MUGGING SELF-DEFENSE, AND SIGN IT OF MY OWN FREE WILL.',
]

const fieldClass =
  'mt-1 box-border block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

const datePickerClass =
  'mt-1 h-auto min-h-[2.5rem] w-full justify-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

type ParticipantFields = {
  trainerName: string
  contactNumber: string
  dob: string
  address: string
  city: string
  state: string
  zipCode: string
  signature: string
}

function mergeParticipantAutofill(
  current: ParticipantFields,
  profile: Record<string, unknown> | null,
  me: MeUser | null,
): ParticipantFields {
  const p = profile ?? {}
  const out = { ...current }
  const fill = (key: keyof ParticipantFields, value: string) => {
    if (!value || out[key]?.trim()) return
    out[key] = value
  }
  const name = `${str(p.firstName) || me?.firstName || ''} ${str(p.lastName) || me?.lastName || ''}`.trim()
  fill('trainerName', name)
  fill('signature', name)
  const phone = str(p.phoneNumber) || str(p.contactPhoneSnapshot) || str(p.contactNumber)
  if (phone) fill('contactNumber', formatUsPhoneInput(phone))
  const dobRaw = str(p.dob) || str(p.dateOfBirth)
  if (dobRaw) fill('dob', crmDateFieldToUs(dobRaw))
  fill('address', str(p.address) || str(p.contactAddressSnapshot))
  fill('city', str(p.city))
  fill('state', str(p.state))
  fill('zipCode', str(p.zipCode))
  return out
}

function rowId(row: LiabilityHealthRow): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatUsDateValue(v: unknown): string {
  if (v == null || v === '') return ''
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return formatUsDate(d)
}

function courseLabel(c: Record<string, unknown>): string {
  const name = String(c.courseName || c.description || '').trim()
  const loc = String(c.locationName || '').trim()
  const start = c.courseStartDate ? formatUsDateValue(c.courseStartDate) : ''
  const end = c.courseEndDate ? formatUsDateValue(c.courseEndDate) : ''
  const dates = start && end ? `${start} – ${end}` : start || end
  return [name || loc, loc && name ? loc : '', dates].filter(Boolean).join(' · ')
}

export default function InstructorLiabilityHealthPanel({
  meReady,
  me,
  instructorName,
}: {
  meReady: boolean
  me: MeUser | null
  instructorName: string
}) {
  const formRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<LiabilityHealthRow[]>([])
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [courseId, setCourseId] = useState('')
  const [signature, setSignature] = useState('')
  const [liabilityDate, setLiabilityDate] = useState(() => formatUsDate(new Date()))
  const [trainerName, setTrainerName] = useState(instructorName)
  const [contactNumber, setContactNumber] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewRow, setViewRow] = useState<LiabilityHealthRow | null>(null)
  const prefillDone = useRef(false)

  const load = useCallback(async () => {
    const [docs, courseRows] = await Promise.all([
      fetchInstructorLiabilityHealth(),
      fetchInstructorCrmView('trainer-assigned-courses'),
    ])
    setRows(Array.isArray(docs) ? docs : [])
    setCourses(legacyAsObjectArray(courseRows))
  }, [])

  useEffect(() => {
    if (!meReady) return
    load().catch(() => setRows([]))
  }, [meReady, load])

  useEffect(() => {
    if (instructorName) setTrainerName((prev) => prev.trim() || instructorName)
  }, [instructorName])

  useEffect(() => {
    if (!meReady || !me || prefillDone.current) return
    prefillDone.current = true
    const empty: ParticipantFields = {
      trainerName: instructorName,
      contactNumber: '',
      dob: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      signature: instructorName,
    }
    fetchInstructorCrmProfile()
      .then((raw) => {
        const merged = mergeParticipantAutofill(empty, legacyAsRecord(raw), me)
        setTrainerName(merged.trainerName)
        setContactNumber(merged.contactNumber)
        setDob(merged.dob)
        setAddress(merged.address)
        setCity(merged.city)
        setState(merged.state)
        setZipCode(merged.zipCode)
        setSignature(merged.signature)
      })
      .catch(() => {
        const merged = mergeParticipantAutofill(empty, null, me)
        setTrainerName(merged.trainerName)
        setContactNumber(merged.contactNumber)
        setSignature(merged.signature)
      })
  }, [meReady, me, instructorName])

  async function handleSubmit() {
    if (!courseId.trim()) {
      setMsg('Please select a course.')
      return
    }
    if (!signature.trim()) {
      setMsg('Signature is required.')
      return
    }
    if (contactNumber.trim() && !isValidUsPhone10(contactNumber)) {
      setMsg('Phone must be 10 digits (999-999-9999).')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      let pdfDataUrl: string | undefined
      if (formRef.current) {
        pdfDataUrl = await captureElementAsPdfDataUrl(formRef.current)
      }
      const res = await postInstructorLiabilityHealth({
        courseId: courseId.trim(),
        signature: signature.trim(),
        liabilityDate: liabilityDate.trim(),
        trainerName: trainerName.trim(),
        contactNumber: contactNumber.trim(),
        dob: dob.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        pdfDataUrl,
      })
      if (!res.ok) {
        setMsg((await res.text()) || 'Submit failed.')
        return
      }
      setMsg('Liability & health form submitted.')
      await load()
    } catch (e) {
      setMsg(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this submission?')) return
    const res = await deleteInstructorLiabilityHealth(id)
    if (res.ok) await load()
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Your submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const id = rowId(r)
                return (
                  <tr key={id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium">{String(r.courseName || '—')}</td>
                    <td className="px-4 py-3">{String(r.locationName || '—')}</td>
                    <td className="px-4 py-3">{formatWhen(r.courseStartDate)}</td>
                    <td className="px-4 py-3">{formatWhen(r.createdDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setViewRow(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {r.hasAttachment && id ? (
                          <button
                            type="button"
                            onClick={() =>
                              void downloadInstructorLiabilityHealthFile(id).catch(() =>
                                setMsg('Download failed.')
                              )
                            }
                            className="rounded-lg border border-teal-200 px-2 py-1 text-xs font-bold text-teal-800"
                          >
                            PDF
                          </button>
                        ) : null}
                        {id ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No submissions yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm text-slate-600">
          Select your course, complete the waiver below, and submit. A PDF copy is stored like the legacy system.
        </p>
        <label className="block text-xs font-semibold text-slate-600">
          Course
          <select className={fieldClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((c) => {
              const id = String(c._id || c.dumId || '')
              return (
                <option key={id} value={id}>
                  {courseLabel(c)}
                </option>
              )
            })}
          </select>
        </label>

        <div ref={formRef} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-sm text-slate-800">
            This agreement is between <strong>{trainerName || 'the instructor'}</strong> and MODEL MUGGING
            SELF-DEFENSE, its employees, and the property owners or renters of the various practice locations.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {WAIVER_PARAGRAPHS.map((p) => (
              <li key={p.slice(0, 24)}>{p}</li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Date
              <UsDatePicker
                id="liability-waiver-date"
                value={liabilityDate}
                onChange={setLiabilityDate}
                buttonClassName={datePickerClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Signature (type full name)
              <input className={fieldClass} value={signature} onChange={(e) => setSignature(e.target.value)} />
            </label>
          </div>
          <h3 className="text-center text-sm font-bold text-[#0d9488]">Participant information</h3>
          <p className="text-center text-xs text-slate-500">
            Pre-filled from your instructor profile where available. You can edit before submitting.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Name
              <input className={fieldClass} value={trainerName} onChange={(e) => setTrainerName(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Phone
              <input
                className={fieldClass}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="999-999-9999"
                value={contactNumber}
                onChange={(e) => setContactNumber(formatUsPhoneInput(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Date of birth
              <UsDatePicker
                id="liability-participant-dob"
                value={dob}
                onChange={setDob}
                buttonClassName={datePickerClass}
                allowClear
              />
            </label>
            <GooglePlacesAutocomplete
              id="liability-participant-address"
              label="Address"
              value={address}
              onChange={setAddress}
              onPlaceSelect={(p) => {
                setAddress(p.address)
                if (p.city) setCity(p.city)
                if (p.state) setState(p.state)
                if (p.zipCode) setZipCode(p.zipCode)
              }}
              placeholder="Start typing for suggestions"
              className="sm:col-span-2"
              inputClassName={fieldClass}
            />
            <label className="text-xs font-semibold text-slate-600">
              City
              <input className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              State
              <input className={fieldClass} value={state} onChange={(e) => setState(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Zip code
              <input className={fieldClass} value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Submitting…' : 'Submit waiver'}
          </button>
          <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
            Upload PDF instead
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f || !courseId.trim()) {
                  setMsg('Select a course first.')
                  return
                }
                setBusy(true)
                void uploadInstructorLiabilityHealthFile(f, courseId)
                  .then(async (res) => {
                    if (!res.ok) setMsg('Upload failed.')
                    else {
                      setMsg('File uploaded.')
                      await load()
                    }
                  })
                  .finally(() => setBusy(false))
              }}
            />
          </label>
        </div>
        {msg ? <p className="mt-3 text-sm text-slate-700">{msg}</p> : null}
      </section>

      {viewRow ? (
        <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={() => setViewRow(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold">Submission details</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Course</dt>
                <dd>{String(viewRow.courseName || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Signed</dt>
                <dd>{String(viewRow.signature || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Date</dt>
                <dd>{String(viewRow.liabilityDate || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">Participant</dt>
                <dd>{String(viewRow.trainerName || viewRow.instructorName || '—')}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              onClick={() => setViewRow(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
