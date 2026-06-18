'use client'

import { useCallback, type Dispatch, type SetStateAction } from 'react'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'
import type { CourseUserType } from '@/lib/courseRegistration'
import {
  participantSlotLabel,
  type CourseParticipantDraft,
} from '@/lib/courseRegistrationParticipants'
import { isAdultDob } from '@/lib/ageFromDob'
import { formatUsPhoneInput } from '@/lib/phoneUs'

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20'

type Props = {
  userType: CourseUserType
  participants: CourseParticipantDraft[]
  onChange: Dispatch<SetStateAction<CourseParticipantDraft[]>>
  /** Payer portal login email — used to explain shared vs own login for adults */
  payerEmail?: string
}

export default function CourseRegistrationParticipantsForm({
  userType,
  participants,
  onChange,
  payerEmail = '',
}: Props) {
  const patch = useCallback(
    (index: number, updates: Partial<CourseParticipantDraft>) => {
      onChange((prev) =>
        prev.map((row, idx) => (idx === index ? { ...row, ...updates } : row)),
      )
    },
    [onChange],
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Enter details for each person attending (legacy participant information). The parent/guardian account
        you created will pay for all attendees in one transaction.
      </p>
      {participants.map((p, i) => (
        <fieldset
          key={`participant-${i}`}
          className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5"
        >
          <legend className="px-1 text-sm font-bold text-slate-800">
            {participantSlotLabel(userType, i)}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              First name
              <input
                required
                className={inputClass}
                value={p.firstName}
                onChange={(e) => patch(i, { firstName: e.target.value })}
                autoComplete={i === 0 ? 'given-name' : 'off'}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Last name
              <input
                required
                className={inputClass}
                value={p.lastName}
                onChange={(e) => patch(i, { lastName: e.target.value })}
                autoComplete={i === 0 ? 'family-name' : 'off'}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Email{' '}
              {userType === 'UT1' || userType === 'UT4'
                ? '(student’s own email if 18+ — they can access their class in the portal)'
                : userType === 'UT2' && i > 0
                  ? '(optional — parent/guardian email is fine for minors)'
                  : ''}
              <input
                type="email"
                className={inputClass}
                value={p.email}
                onChange={(e) => patch(i, { email: e.target.value })}
                autoComplete="email"
              />
              {p.dob.trim() &&
              isAdultDob(p.dob) &&
              p.email.trim() &&
              payerEmail &&
              p.email.trim().toLowerCase() !== payerEmail.trim().toLowerCase() ? (
                <span className="mt-1 block text-xs font-medium text-teal-800">
                  This student will receive a portal invite at this address after registration (legacy: separate
                  student login).
                </span>
              ) : null}
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Date of birth
              <UsDatePicker
                id={`participant-dob-${i}`}
                value={p.dob}
                onChange={(v) => patch(i, { dob: v })}
                buttonClassName={`${inputClass} h-auto min-h-[2.5rem] justify-start shadow-none hover:bg-white`}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Phone
              <input
                type="tel"
                className={inputClass}
                placeholder="999-999-9999"
                value={p.phone}
                onChange={(e) => patch(i, { phone: formatUsPhoneInput(e.target.value) })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Gender
              <select
                required
                className={inputClass}
                value={p.gender}
                onChange={(e) => patch(i, { gender: e.target.value })}
              >
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <GooglePlacesAutocomplete
                id={`participant-address-${i}`}
                label="Address"
                value={p.address}
                onChange={(v) => patch(i, { address: v })}
                onPlaceSelect={(place) => {
                  onChange((prev) =>
                    prev.map((row, idx) => {
                      if (idx !== i) return row
                      return {
                        ...row,
                        address: place.address,
                        city: place.city || row.city,
                        state: place.state || row.state,
                        zipCode: place.zipCode || row.zipCode,
                      }
                    }),
                  )
                }}
                placeholder="Start typing for suggestions"
                className="text-sm font-semibold text-slate-700"
                inputClassName={inputClass}
              />
            </div>
            <label className="text-sm font-semibold text-slate-700">
              City
              <input
                required
                className={inputClass}
                value={p.city}
                onChange={(e) => patch(i, { city: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              State
              <input
                required
                className={inputClass}
                value={p.state}
                onChange={(e) => patch(i, { state: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ZIP code
              <input
                required
                className={inputClass}
                inputMode="numeric"
                value={p.zipCode}
                onChange={(e) => patch(i, { zipCode: e.target.value })}
              />
            </label>
          </div>
        </fieldset>
      ))}
    </div>
  )
}
