'use client'

import { useState } from 'react'
import { GeoCountryFields } from '@/components/groupCourse/GeoCountryFields'
import { submitPreGroupApplication, type PreGroupApplicationPayload } from '@/lib/groupCourseApi'
import { formatUsPhoneInput } from '@/lib/phoneUs'

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm'

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div className="mt-2 flex gap-6">
        {(['Yes', 'No'] as const).map((opt) => (
          <label key={opt} className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={label}
              value={opt}
              checked={value === opt}
              required
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function PreGroupApplicationForm() {
  const [form, setForm] = useState<PreGroupApplicationPayload>({
    firstName: '',
    lastName: '',
    groupOrAffiliation: '',
    orgEmail: '',
    city: '',
    country: '',
    state: '',
    question1: '',
    question2: '',
    question3: '',
    website: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [err, setErr] = useState('')

  function set<K extends keyof PreGroupApplicationPayload>(key: K, value: PreGroupApplicationPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErr('')
    const res = await submitPreGroupApplication(form)
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setErr(j.error || (await res.text()) || 'Submission failed')
      setStatus('err')
      return
    }
    setStatus('ok')
  }

  if (status === 'ok') {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-slate-900">Request submitted</p>
        <p className="mt-2 text-sm text-slate-600">
          Your initial request was successfully submitted. If you do not receive an email, verify your email address
          was typed correctly. Our team will review your screening answers and contact you about next steps.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Group course application request</h2>
        <p className="mt-1 text-sm text-slate-600">
          Complete this short screening form first. If your group qualifies, we will email you a link to the full
          group course application.
        </p>
      </div>

      {err ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{err}</p> : null}

      <p className="text-sm font-semibold text-slate-800">Organizer / group leader</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          First name *
          <input className={fieldClass} required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Last name *
          <input className={fieldClass} required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Group or affiliation
          <input
            className={fieldClass}
            value={form.groupOrAffiliation || ''}
            onChange={(e) => set('groupOrAffiliation', e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Email *
          <input
            type="email"
            className={fieldClass}
            required
            value={form.orgEmail}
            onChange={(e) => set('orgEmail', e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          City
          <input className={fieldClass} value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
        </label>
      </div>

      <GeoCountryFields
        country={form.country || ''}
        state={form.state || ''}
        onCountryChange={(v) => set('country', v)}
        onStateChange={(v) => set('state', v)}
        required
      />

      <p className="text-sm font-semibold text-slate-800">Co-organizer (optional)</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            className={fieldClass}
            value={form.coOrganizerName || ''}
            onChange={(e) => set('coOrganizerName', e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Group / affiliation
          <input
            className={fieldClass}
            value={form.coOrgGroupOrAffiliation || ''}
            onChange={(e) => set('coOrgGroupOrAffiliation', e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            className={fieldClass}
            value={form.coOrgEmail || ''}
            onChange={(e) => set('coOrgEmail', e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input
            className={fieldClass}
            value={form.coOrgPhone || ''}
            onChange={(e) => set('coOrgPhone', formatUsPhoneInput(e.target.value))}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          City
          <input className={fieldClass} value={form.coOrgCity || ''} onChange={(e) => set('coOrgCity', e.target.value)} />
        </label>
      </div>
      <GeoCountryFields
        country={form.coOrgCountry || ''}
        state={form.coOrgState || ''}
        onCountryChange={(v) => set('coOrgCountry', v)}
        onStateChange={(v) => set('coOrgState', v)}
        countryLabel="Co-organizer country"
        stateLabel="Co-organizer state / region"
      />

      <div className="space-y-4">
        <YesNoQuestion
          label="Are you reaching out on behalf of a group of 10–15 people interested in training?"
          value={form.question1}
          onChange={(v) => set('question1', v)}
        />
        <YesNoQuestion
          label="Do you have a teaching location with padded flooring available?"
          value={form.question2}
          onChange={(v) => set('question2', v)}
        />
        <YesNoQuestion
          label="Is your group committed to training and willing to pay tuition?"
          value={form.question3}
          onChange={(v) => set('question3', v)}
        />
      </div>

      <input
        type="text"
        name="website"
        value={form.website || ''}
        onChange={(e) => set('website', e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-xl bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
      >
        {status === 'sending' ? 'Submitting…' : 'Submit screening request'}
      </button>
    </form>
  )
}
