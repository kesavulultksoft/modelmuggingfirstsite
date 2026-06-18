'use client'

import type { Dispatch, SetStateAction } from 'react'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { formatUsPhoneInput } from '@/lib/phoneUs'

export const INITIAL_INSTRUCTOR_PROFILE_FORM: Record<string, string> = {
  firstName: '',
  lastName: '',
  emailId: '',
  phoneNumber: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
}

export type InstructorProfileFormSectionProps = {
  profileForm: Record<string, string>
  setProfileForm: Dispatch<SetStateAction<Record<string, string>>>
  onSave: () => void | Promise<void>
  surfaceId?: string
  saveButtonLabel?: string
}

export default function InstructorProfileFormSection({
  profileForm,
  setProfileForm,
  onSave,
  surfaceId = 'profile',
  saveButtonLabel = 'Save profile',
}: InstructorProfileFormSectionProps) {
  const inputClass = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Profile</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.keys(profileForm).map((k) => {
          if (k === 'dateOfBirth') {
            return (
              <label key={k} className="text-xs font-semibold text-slate-600">
                {labelForFormField(k)}
                <UsDatePicker
                  id={`${surfaceId}-dob`}
                  value={profileForm[k] || ''}
                  onChange={(v) => setProfileForm((prev) => ({ ...prev, [k]: v }))}
                  buttonClassName={`${inputClass} h-auto min-h-[2.5rem] justify-start shadow-none hover:bg-slate-50`}
                />
              </label>
            )
          }
          if (k === 'phoneNumber') {
            return (
              <label key={k} className="text-xs font-semibold text-slate-600">
                {labelForFormField(k)}
                <input
                  className={inputClass}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="999-999-9999"
                  value={profileForm[k] || ''}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, [k]: formatUsPhoneInput(e.target.value) }))}
                />
              </label>
            )
          }
          if (k === 'address') {
            return (
              <GooglePlacesAutocomplete
                key={k}
                id={`${surfaceId}-address`}
                label={<span className="text-xs font-semibold text-slate-600">{labelForFormField(k)}</span>}
                value={profileForm[k] || ''}
                onChange={(v) => setProfileForm((prev) => ({ ...prev, address: v }))}
                onPlaceSelect={(p) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    address: p.address,
                    city: p.city || prev.city,
                    state: p.state || prev.state,
                    zipCode: p.zipCode || prev.zipCode,
                  }))
                }
                placeholder="Start typing for suggestions"
                className="sm:col-span-2"
                inputClassName={inputClass}
              />
            )
          }
          return (
            <label key={k} className="text-xs font-semibold text-slate-600">
              {labelForFormField(k)}
              <input
                className={inputClass}
                value={profileForm[k] || ''}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, [k]: e.target.value }))}
              />
            </label>
          )
        })}
      </div>
      <button type="button" onClick={() => void onSave()} className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
        {saveButtonLabel}
      </button>
    </section>
  )
}
