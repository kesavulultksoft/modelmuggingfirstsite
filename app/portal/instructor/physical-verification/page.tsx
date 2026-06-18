'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmProfile,
  fetchInstructorPhysicalVerification,
  fetchMe,
  getToken,
  updateInstructorPhysicalVerification,
  type MeUser,
} from '@/lib/portalApi'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { isMultilineFieldKey, labelForFormField } from '@/lib/humanizeFieldLabel'
import { formatUsPhoneInput, isUsPhoneFormField, normalizeFieldValueForForm } from '@/lib/phoneUs'

/** Legacy-aligned defaults; additional keys from the API are appended automatically. */
const FIELD_ORDER = [
  'firstName',
  'lastName',
  'instituteSendingCandidate',
  'candidatePhoneNumber',
  'candidateAddress',
  'doctorName',
  'doctorAddress',
  'doctorPhoneNumber',
  'physicianName',
  'physicianPhone',
  'limitations',
  'medications',
  'comments',
  'emergencyContactName',
  'emergencyContactPhone',
  'notes',
] as const

function normalizeLoadedRecord(rec: Record<string, unknown>) {
  const out = { ...rec }
  if (!String(out.doctorName ?? '').trim() && String(out.physicianName ?? '').trim()) {
    out.doctorName = out.physicianName
  }
  if (!String(out.doctorPhoneNumber ?? '').trim() && String(out.physicianPhone ?? '').trim()) {
    out.doctorPhoneNumber = out.physicianPhone
  }
  return out
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function isBlankField(v: string | undefined): boolean {
  return !String(v ?? '').trim()
}

/** Street + city/state/ZIP from CRM profile (same sources as background verification). */
function composeProfileMailingAddress(p: Record<string, unknown>): string {
  const line1 = str(p.address).trim() || str(p.contactAddressSnapshot).trim()
  const city = str(p.city).trim()
  const st = str(p.state).trim()
  const zip = str(p.zipCode).trim()
  const cityLine = [city, st, zip].filter(Boolean).join(', ')
  return [line1, cityLine].filter(Boolean).join('\n')
}

/**
 * When physical verification fields are still empty, prefill from instructor CRM profile
 * and portal account — mirrors legacy trainerDetails + contact info merge.
 */
function mergePhysicalVerificationAutofill(
  base: Record<string, string>,
  profile: Record<string, unknown> | null,
  me: MeUser,
): Record<string, string> {
  const p = profile ?? {}
  const out = { ...base }
  const fill = (key: string, value: string) => {
    if (!isBlankField(out[key])) return
    out[key] = normalizeFieldValueForForm(key, value)
  }

  fill('firstName', str(p.firstName) || me.firstName || '')
  fill('lastName', str(p.lastName) || me.lastName || '')
  const phone = str(p.phoneNumber) || str(p.contactPhoneSnapshot)
  if (phone) fill('candidatePhoneNumber', formatUsPhoneInput(phone))

  const mailing = composeProfileMailingAddress(p)
  if (mailing) fill('candidateAddress', mailing)

  const institute =
    str(p.facilityName) ||
    str(p.organizationName) ||
    str(p.companyName) ||
    str(p.affiliatedOrganization) ||
    str(p.instituteName)
  if (institute) fill('instituteSendingCandidate', institute)

  fill('emergencyContactName', str(p.emergencyContactName))
  const ecPhone = str(p.emergencyContactPhone)
  if (ecPhone) fill('emergencyContactPhone', formatUsPhoneInput(ecPhone))

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

export default function InstructorPhysicalVerificationPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/physical-verification')
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
    Promise.all([fetchInstructorPhysicalVerification(), fetchInstructorCrmProfile().catch(() => ({}))])
      .then(([d, profRaw]) => {
        const profile = legacyAsRecord(profRaw)
        const rec = normalizeLoadedRecord(legacyAsRecord(d) ?? {})
        const next: Record<string, string> = {}
        for (const k of FIELD_ORDER) {
          next[k] = normalizeFieldValueForForm(k, rec[k] ?? '')
        }
        Object.keys(rec).forEach((k) => {
          if (k.startsWith('_') || k === 'userId' || k === 'updatedAt') return
          if (next[k] === undefined) next[k] = normalizeFieldValueForForm(k, rec[k] ?? '')
        })
        setForm(mergePhysicalVerificationAutofill(next, profile, me))
      })
      .catch(() => {
        const blank = Object.fromEntries(FIELD_ORDER.map((k) => [k, '']))
        setForm(mergePhysicalVerificationAutofill(blank, null, me))
      })
  }, [me])

  const keys = useMemo(() => orderedKeys(form), [form])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const fieldInputClass =
    'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900'

  async function save() {
    setErr('')
    setMsg('')
    const body: Record<string, unknown> = {}
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'status') return
      if (v.trim() !== '') body[k] = v.trim()
    })
    const res = await updateInstructorPhysicalVerification(body)
    if (!res.ok) {
      setErr((await res.text()) || 'Save failed')
      return
    }
    setMsg('Physical verification form saved.')
  }

  return (
    <>
      <PortalPageHeader
        title="Physical verification"
        subtitle="Physician clearance for Model Mugging physical participation — matches legacy physicalverification.html; stored in mm_physical_verifications."
      />
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          Teaching involves strenuous activity while wearing protective equipment. Your physician must confirm you can
          safely participate. Enter your doctor’s contact information and any limitations or medications.
        </p>
      </div>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {keys.filter((k) => k !== 'status').map((k) => {
            if (k === 'doctorAddress' || k === 'candidateAddress') {
              return (
                <GooglePlacesAutocomplete
                  key={k}
                  id={k === 'candidateAddress' ? 'physical-candidate-address' : 'physical-doctor-address'}
                  label={<span className="text-sm font-semibold text-slate-700">{labelForFormField(k)}</span>}
                  value={form[k] ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, [k]: v }))}
                  placeholder="Start typing for suggestions"
                  className="block sm:col-span-2"
                  inputClassName={fieldInputClass}
                />
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
                    rows={4}
                    value={form[k] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  />
                ) : (
                  <input
                    className={fieldInputClass}
                    type={isUsPhoneFormField(k) ? 'tel' : 'text'}
                    inputMode={isUsPhoneFormField(k) ? 'tel' : undefined}
                    autoComplete={isUsPhoneFormField(k) ? 'tel' : undefined}
                    placeholder={isUsPhoneFormField(k) ? '999-999-9999' : undefined}
                    value={form[k] ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [k]: isUsPhoneFormField(k) ? formatUsPhoneInput(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
              </label>
            )
          })}
        </div>
        <button
          type="button"
          onClick={save}
          className="mt-4 rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e]"
        >
          Save
        </button>
      </div>
    </>
  )
}
