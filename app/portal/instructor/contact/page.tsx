'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmView,
  fetchMe,
  getToken,
  updateInstructorContact,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { formatUsPhoneInput, isUsPhoneFormField, normalizeFieldValueForForm } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function InstructorContactPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [form, setForm] = useState<Record<string, string>>({
    phoneNumber: '',
    alternatePhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/contact')
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
    fetchInstructorCrmView('contact')
      .then((rows) => {
        const first = legacyAsObjectArray(rows)[0] || {}
        setForm((prev) =>
          Object.keys(prev).reduce(
            (acc, k) => ({ ...acc, [k]: normalizeFieldValueForForm(k, first[k] ?? '') }),
            {} as Record<string, string>
          )
        )
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  async function save() {
    setErr('')
    setMsg('')
    const res = await updateInstructorContact(form)
    if (!res.ok) {
      setErr((await res.text()) || 'Failed to save contact info.')
      return
    }
    setMsg('Contact information updated.')
  }

  return (
    <>
      <PortalPageHeader title="Contact information" subtitle="Manage your instructor contact profile." />
      {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        {Object.keys(form).map((k) => (
          <label key={k} className="text-sm font-semibold text-slate-700">
            {labelForFormField(k)}
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              type={isUsPhoneFormField(k) ? 'tel' : 'text'}
              inputMode={isUsPhoneFormField(k) ? 'tel' : undefined}
              autoComplete={isUsPhoneFormField(k) ? 'tel' : undefined}
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
        ))}
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={save}
            className="rounded bg-[#0d9488] px-4 py-2 text-sm font-bold text-white"
          >
            Save contact information
          </button>
        </div>
      </div>
    </>
  )
}
