'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchInstructorCrmProfile, fetchMe, getToken, updateInstructorCrmProfile, type MeUser } from '@/lib/portalApi'
import InstructorProfileFormSection, { INITIAL_INSTRUCTOR_PROFILE_FORM } from '@/components/portal/InstructorProfileFormSection'
import { applySignupIdentityToProfileForm } from '@/lib/instructorProfileAutofill'
import { subscribeInstructorCrmProfileChanged } from '@/lib/instructorCrmProfileSync'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import { crmDateFieldToUs } from '@/lib/usDate'

export type InstructorProfilePanelProps = {
  surfaceId?: string
  loginNextPath?: string
}

function profileRecordToForm(profile: Record<string, unknown>): Record<string, string> {
  return {
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
}

export default function InstructorProfilePanel({
  surfaceId = 'instructor-profile',
  loginNextPath = '/portal/instructor/profile',
}: InstructorProfilePanelProps) {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profileForm, setProfileForm] = useState<Record<string, string>>({ ...INITIAL_INSTRUCTOR_PROFILE_FORM })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const loadProfile = useCallback(() => {
    if (!me) return
    fetchInstructorCrmProfile()
      .then((profile) => {
        setProfileForm(applySignupIdentityToProfileForm(me, profileRecordToForm(profile)))
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
    loadProfile()
  }, [me, loadProfile])

  useEffect(() => {
    if (!me) return
    return subscribeInstructorCrmProfileChanged(loadProfile)
  }, [me, loadProfile])

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

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      {err && <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}
      {msg && <p className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>}
      <InstructorProfileFormSection
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        onSave={saveProfile}
        surfaceId={surfaceId}
      />
    </>
  )
}
