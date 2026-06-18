'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmProfile,
  fetchInstructorCrmView,
  fetchMe,
  getToken,
  updateInstructorContact,
  updateInstructorCrmProfile,
  updateInstructorTax,
  type MeUser,
} from '@/lib/portalApi'
import InstructorProfileFormSection, { INITIAL_INSTRUCTOR_PROFILE_FORM } from '@/components/portal/InstructorProfileFormSection'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { applySignupIdentityToProfileForm } from '@/lib/instructorProfileAutofill'
import { subscribeInstructorCrmProfileChanged } from '@/lib/instructorCrmProfileSync'
import { formatUsPhoneDisplay, formatUsPhoneInput, isUsPhoneFormField, normalizeFieldValueForForm } from '@/lib/phoneUs'
import { crmDateFieldToUs } from '@/lib/usDate'

export type InstructorAccountWorkspacePanelProps = {
  surfaceId?: string
  showSummaryCards?: boolean
  loginNextPath?: string
}

export default function InstructorAccountWorkspacePanel({
  surfaceId = 'account-workspace',
  showSummaryCards = true,
  loginNextPath = '/portal/instructor/account-workspace',
}: InstructorAccountWorkspacePanelProps) {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profileForm, setProfileForm] = useState<Record<string, string>>({ ...INITIAL_INSTRUCTOR_PROFILE_FORM })
  const [contactForm, setContactForm] = useState<Record<string, string>>({
    phoneNumber: '',
    alternatePhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })
  const [taxForm, setTaxForm] = useState<Record<string, string>>({
    legalName: '',
    taxIdLast4: '',
    taxType: '',
    w9OnFile: '',
    notes: '',
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const refreshWorkspace = useCallback(() => {
    if (!me) return
    Promise.all([
      fetchInstructorCrmProfile(),
      fetchInstructorCrmView('contact'),
      fetchInstructorCrmView('tax'),
    ])
      .then(([profile, contactRows, taxRows]) => {
        const fromCrm = {
          firstName: String(profile.firstName || ''),
          lastName: String(profile.lastName || ''),
          emailId: String(profile.emailId || profile.email || ''),
          phoneNumber: formatUsPhoneDisplay(profile.phoneNumber),
          dateOfBirth: crmDateFieldToUs(profile.dateOfBirth ?? profile.dob ?? ''),
          address: String(profile.address || ''),
          city: String(profile.city || ''),
          state: String(profile.state || ''),
          zipCode: String(profile.zipCode || ''),
        }
        setProfileForm(applySignupIdentityToProfileForm(me, fromCrm))

        const contact = legacyAsObjectArray(contactRows)[0] || {}
        setContactForm((prev) =>
          Object.keys(prev).reduce((acc, k) => {
            const raw =
              k === 'phoneNumber' ? contact[k] ?? profile.phoneNumber : contact[k]
            return { ...acc, [k]: normalizeFieldValueForForm(k, raw) }
          }, {} as Record<string, string>)
        )

        const tax = legacyAsObjectArray(taxRows)[0] || {}
        setTaxForm((prev) =>
          Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: String(tax[k] || '') }), {})
        )
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=${encodeURIComponent(loginNextPath)}`)
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
  }, [router, loginNextPath])

  useEffect(() => {
    if (!me) return
    setProfileForm((prev) => applySignupIdentityToProfileForm(me, prev))
  }, [me])

  useEffect(() => {
    if (!me) return
    refreshWorkspace()
  }, [me, refreshWorkspace])

  useEffect(() => {
    if (!me) return
    return subscribeInstructorCrmProfileChanged(refreshWorkspace)
  }, [me, refreshWorkspace])

  async function saveProfile() {
    setErr('')
    setMsg('')
    const res = await updateInstructorCrmProfile(profileForm)
    if (!res.ok) {
      setErr((await res.text()) || 'Failed to save profile.')
      return
    }
    setMsg('Profile updated.')
  }

  async function saveContact() {
    setErr('')
    setMsg('')
    const res = await updateInstructorContact(contactForm)
    if (!res.ok) {
      setErr((await res.text()) || 'Failed to save contact information.')
      return
    }
    setMsg('Contact information updated.')
  }

  async function saveTax() {
    setErr('')
    setMsg('')
    const res = await updateInstructorTax(taxForm)
    if (!res.ok) {
      setErr((await res.text()) || 'Failed to save tax information.')
      return
    }
    setMsg('Tax information updated.')
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      {err && <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>}

      {showSummaryCards && (
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Workspace</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Instructor account</p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Sections</p>
              <p className="mt-1 text-2xl font-bold text-teal-900">3</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Portal user</p>
              <p className="mt-1 text-sm font-bold text-indigo-900">{me.email}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Role</p>
              <p className="mt-1 text-sm font-bold text-amber-900">{me.role}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <InstructorProfileFormSection
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onSave={saveProfile}
          surfaceId={surfaceId}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contact</h2>
          <p className="mt-2 text-xs text-slate-500">
            Address and primary identity/contact fields are maintained in Profile to avoid duplicate values.
          </p>
          <div className="mt-3 grid gap-2">
            {Object.keys(contactForm).map((k) => (
              <label key={k} className="text-xs font-semibold text-slate-600">
                {labelForFormField(k)}
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  type={isUsPhoneFormField(k) ? 'tel' : 'text'}
                  inputMode={isUsPhoneFormField(k) ? 'tel' : undefined}
                  autoComplete={isUsPhoneFormField(k) ? 'tel' : undefined}
                  placeholder={isUsPhoneFormField(k) ? '999-999-9999' : undefined}
                  value={contactForm[k] || ''}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      [k]: isUsPhoneFormField(k) ? formatUsPhoneInput(e.target.value) : e.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={saveContact} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            Save contact
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tax</h2>
          <div className="mt-3 grid gap-2">
            {Object.keys(taxForm).map((k) => (
              <label key={k} className="text-xs font-semibold text-slate-600">
                {labelForFormField(k)}
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  value={taxForm[k] || ''}
                  onChange={(e) => setTaxForm((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={saveTax} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            Save tax
          </button>
        </section>
      </div>
    </>
  )
}
