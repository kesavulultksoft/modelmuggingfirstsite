'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchMe,
  fetchStudentProfileDoc,
  getToken,
  updateStudentProfileDoc,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import { formatUsPhoneInput, isUsPhoneFormField, normalizeFieldValueForForm } from '@/lib/phoneUs'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

const PROFILE_FIELD_KEYS = [
  'firstName',
  'lastName',
  'emailAddress',
  'phoneNumber',
  'address',
  'city',
  'state',
  'zipCode',
] as const

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  address: 'Address',
  city: 'City',
  state: 'State',
  zipCode: 'Zip Code',
  status: 'Status',
  dumId: 'DUM ID',
}

function labelForKey(key: string): string {
  return FIELD_LABELS[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function isBlankField(value: string | undefined): boolean {
  return !value || !value.trim()
}

function pickPhoneFromRecord(rec: Record<string, unknown>): string {
  return (
    str(rec.phoneNumber) ||
    str(rec.contactNumber) ||
    str(rec.phone) ||
    str(rec.contactNo) ||
    str(rec.mobile) ||
    str(rec.mobileNumber) ||
    str(rec.cellPhone) ||
    str(rec.parentPhoneNumber) ||
    str(rec.parentPhone) ||
    str(rec.guardianPhone) ||
    str(rec.studentPhone) ||
    ''
  )
}

function profileValueForForm(key: string, rec: Record<string, unknown>): string {
  switch (key) {
    case 'phoneNumber':
      return normalizeFieldValueForForm(key, pickPhoneFromRecord(rec))
    case 'emailAddress':
      return normalizeFieldValueForForm(
        key,
        rec.emailAddress ?? rec.email ?? rec.emailId ?? '',
      )
    default:
      return normalizeFieldValueForForm(key, rec[key] ?? '')
  }
}

/** Prefill empty form fields from CRM profile (legacy keys) and portal account. */
function mergeStudentProfileAutofill(
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

  for (const key of PROFILE_FIELD_KEYS) {
    const fromProfile = profileValueForForm(key, p)
    if (fromProfile) fill(key, fromProfile)
  }

  fill('firstName', str(p.firstName) || me.firstName || '')
  fill('lastName', str(p.lastName) || me.lastName || '')
  fill('emailAddress', str(p.emailAddress) || str(p.email) || str(p.emailId) || me.email || '')

  const phone = pickPhoneFromRecord(p) || str(me.phone)
  if (phone) fill('phoneNumber', formatUsPhoneInput(phone))

  return out
}

function blankProfileForm(): Record<string, string> {
  return Object.fromEntries(PROFILE_FIELD_KEYS.map((k) => [k, '']))
}

const fieldInputClass =
  'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20'

export default function StudentProfilePage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState<Record<string, string>>(blankProfileForm)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/profile')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
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
    fetchStudentProfileDoc()
      .then((d) => {
        const rec = legacyAsRecord(d) ?? {}
        setForm(mergeStudentProfileAutofill(blankProfileForm(), rec, me))
      })
      .catch((e) => {
        setForm(mergeStudentProfileAutofill(blankProfileForm(), null, me))
        setErr(String((e as Error).message || e))
      })
      .finally(() => setLoading(false))
  }, [me])

  async function save() {
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await updateStudentProfileDoc(form)
      if (!res.ok) {
        setErr((await res.text()) || 'Failed to save profile.')
        return
      }
      const updated = legacyAsRecord(await res.json().catch(() => ({})))
      if (updated && me) {
        setForm(mergeStudentProfileAutofill(blankProfileForm(), updated, me))
      }
      setMsg('Profile updated.')
    } catch (e) {
      setErr(String((e as Error).message || e))
    } finally {
      setSaving(false)
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Profile"
        subtitle="Your contact details for class registration and Model Mugging communications."
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Portal account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">
              {me.firstName} {me.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{me.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900">{me.role}</dd>
          </div>
        </dl>
      </div>
      {err && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {err}
        </p>
      )}
      {msg && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      )}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Edit profile</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading your profile…</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PROFILE_FIELD_KEYS.map((k) => {
                if (k === 'address') {
                  return (
                    <GooglePlacesAutocomplete
                      key={k}
                      id="student-profile-address"
                      label={labelForKey(k)}
                      value={form.address || ''}
                      onChange={(v) => setForm((prev) => ({ ...prev, address: v }))}
                      onPlaceSelect={(p) =>
                        setForm((prev) => ({
                          ...prev,
                          address: p.address,
                          city: p.city || prev.city,
                          state: p.state || prev.state,
                          zipCode: p.zipCode || prev.zipCode,
                        }))
                      }
                      placeholder="Start typing for suggestions"
                      className="text-sm font-semibold text-slate-700 sm:col-span-2"
                      inputClassName={fieldInputClass}
                    />
                  )
                }
                return (
                  <label key={k} className="text-sm font-semibold text-slate-700">
                    {labelForKey(k)}
                    <input
                      className={fieldInputClass}
                      type={k === 'emailAddress' ? 'email' : isUsPhoneFormField(k) ? 'tel' : 'text'}
                      inputMode={isUsPhoneFormField(k) ? 'tel' : undefined}
                      autoComplete={
                        k === 'emailAddress'
                          ? 'email'
                          : k === 'firstName'
                            ? 'given-name'
                            : k === 'lastName'
                              ? 'family-name'
                              : isUsPhoneFormField(k)
                                ? 'tel'
                                : k === 'city'
                                  ? 'address-level2'
                                  : k === 'state'
                                    ? 'address-level1'
                                    : k === 'zipCode'
                                      ? 'postal-code'
                                      : undefined
                      }
                      placeholder={isUsPhoneFormField(k) ? '999-999-9999' : undefined}
                      value={form[k] || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [k]: isUsPhoneFormField(k) ? formatUsPhoneInput(e.target.value) : e.target.value,
                        }))
                      }
                    />
                  </label>
                )
              })}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="mt-5 rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f766e] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
