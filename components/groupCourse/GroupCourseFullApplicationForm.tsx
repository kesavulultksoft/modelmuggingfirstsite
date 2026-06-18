'use client'

import { useMemo, useState } from 'react'
import { GeoCountryFields } from '@/components/groupCourse/GeoCountryFields'
import {
  COURSE_DATE_ROWS,
  COURSE_TYPE_OPTIONS,
  FACILITY_FIELDS,
  SKYPE_ROWS,
  STUDENT_ROW_COUNT,
  VENUE_FIELDS,
} from '@/components/groupCourse/groupCourseFullFields'
import { UsDateField } from '@/components/groupCourse/UsDateField'
import {
  submitGroupCourseApplication,
  type GroupCourseApplicationAccess,
  type GroupCourseStudentRow,
} from '@/lib/groupCourseApi'
import { formatUsPhoneInput } from '@/lib/phoneUs'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { formatUsDate } from '@/lib/usDate'

const fieldClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'
const tableInputClass =
  'w-full min-w-[120px] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30'

type Props = {
  groupCourseId: string
  prefill: GroupCourseApplicationAccess
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = 'text',
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: 'text' | 'email' | 'phone'
  className?: string
}) {
  const isPhone = type === 'phone'
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
      <input
        type={isPhone ? 'tel' : type === 'email' ? 'email' : 'text'}
        inputMode={isPhone ? 'tel' : undefined}
        autoComplete={isPhone ? 'tel' : undefined}
        placeholder={isPhone ? 'xxx-xxx-xxxx' : undefined}
        className={fieldClass}
        value={value}
        required={required}
        onChange={(e) => onChange(isPhone ? formatUsPhoneInput(e.target.value) : e.target.value)}
      />
    </label>
  )
}

const tableDatePickerClass =
  'min-h-0 h-9 w-full min-w-[140px] justify-start gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-900 shadow-none hover:bg-white'

function normalizeParticipantGender(raw: string | undefined): string {
  const v = String(raw || '').trim().toUpperCase()
  if (v === 'M' || v === 'MALE') return 'M'
  if (v === 'F' || v === 'FEMALE') return 'F'
  return ''
}

export default function GroupCourseFullApplicationForm({ groupCourseId, prefill }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => ({
    date: formatUsDate(new Date()),
    name: prefill.organizationName || '',
    email: prefill.orgEmail || '',
    groupOrAffiliation: prefill.groupOrAffiliation || '',
    city: prefill.city || '',
  }))
  const [country, setCountry] = useState(prefill.country || '')
  const [state, setState] = useState(prefill.state || '')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [coOrganizerName, setCoOrganizerName] = useState(prefill.coOrganizerName || '')
  const [coOrgGroupOrAffiliation, setCoOrgGroupOrAffiliation] = useState(prefill.coOrgGroupOrAffiliation || '')
  const [coOrgEmail, setCoOrgEmail] = useState(prefill.coOrgEmail || '')
  const [coOrgPhone, setCoOrgPhone] = useState(prefill.coOrgPhone || '')
  const [coCountry, setCoCountry] = useState(prefill.coOrgCountry || '')
  const [coState, setCoState] = useState(prefill.coOrgState || '')
  const [coOrgcity, setCoOrgcity] = useState(prefill.coOrgCity || '')
  const [agreedFaq, setAgreedFaq] = useState(false)
  const [students, setStudents] = useState<GroupCourseStudentRow[]>(
    () => Array.from({ length: STUDENT_ROW_COUNT }, () => ({})),
  )
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [err, setErr] = useState('')
  const [website, setWebsite] = useState('')

  const body = useMemo(
    () => ({
      ...values,
      country,
      state,
      selectedCourse,
      coOrganizerName,
      coOrgGroupOrAffiliation,
      coOrgEmail,
      coOrgCountry: coCountry,
      coOrgState: coState,
      coOrgPhone,
      coOrgcity,
      agreedFaq,
      website,
    }),
    [
      values,
      country,
      state,
      selectedCourse,
      coOrganizerName,
      coOrgGroupOrAffiliation,
      coOrgEmail,
      coCountry,
      coState,
      coOrgPhone,
      coOrgcity,
      agreedFaq,
      website,
    ],
  )

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function setStudent(i: number, patch: Partial<GroupCourseStudentRow>) {
    setStudents((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse) {
      setErr('Please select a course type.')
      return
    }
    if (!agreedFaq) {
      setErr('You must agree to the application terms.')
      return
    }
    setStatus('sending')
    setErr('')
    const res = await submitGroupCourseApplication(
      groupCourseId,
      body,
      students.filter((s) => String(s.participantName || '').trim()),
    )
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
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white px-8 py-10 text-center shadow-sm">
        <p className="text-2xl font-bold text-slate-900">Application submitted</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
          Thank you. You should receive a confirmation email shortly. Our team will review your full group course
          application and follow up with a per-student quote.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Approved organizer</p>
        <h2 className="mt-2 text-2xl font-bold">Full group course application</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          Complete all sections below. Dates use <strong className="font-semibold text-white">MM/DD/YYYY</strong>.
          Minimum group sizes apply (typically 10–15 participants depending on course type). A separate application is
          required for each course type.
        </p>
      </div>

      {err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{err}</p>
      ) : null}

      <FormSection step={1} title="Application date">
        <div className="max-w-xs">
          <UsDateField label="Date" value={values.date || ''} onChange={(v) => setField('date', v)} required />
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Organizer / group leader"
        description="Primary contact for this group course."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name (print)" value={values.name || ''} onChange={(v) => setField('name', v)} required />
          <TextField
            label="Group or affiliation"
            value={values.groupOrAffiliation || ''}
            onChange={(v) => setField('groupOrAffiliation', v)}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={values.email || ''}
            onChange={(v) => setField('email', v)}
            required
          />
          <TextField
            label="Phone"
            type="phone"
            value={values.phoneNumber || ''}
            onChange={(v) => setField('phoneNumber', v)}
            required
          />
          <TextField label="City" value={values.city || ''} onChange={(v) => setField('city', v)} />
        </div>
        <GeoCountryFields
          country={country}
          state={state}
          onCountryChange={setCountry}
          onStateChange={setState}
          required
        />
      </FormSection>

      <FormSection step={3} title="Select course">
        <div className="space-y-2">
          {COURSE_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                selectedCourse === opt
                  ? 'border-teal-500 bg-teal-50/80 ring-1 ring-teal-500/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="selectedCourse"
                value={opt}
                checked={selectedCourse === opt}
                onChange={() => setSelectedCourse(opt)}
                className="text-teal-600"
              />
              <span className="font-medium text-slate-800">{opt}</span>
            </label>
          ))}
        </div>
        {selectedCourse === 'Other' ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Describe other course type
            <textarea
              className={`${fieldClass} min-h-[80px]`}
              value={values.selectedCourseOtherDescriptions || ''}
              onChange={(e) => setField('selectedCourseOtherDescriptions', e.target.value)}
              rows={3}
            />
          </label>
        ) : null}
      </FormSection>

      <FormSection
        step={4}
        title="Skype or FaceTime meeting dates"
        description="Optional planning calls to help build support within your group (about 20 minutes each)."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Method (Skype, FaceTime, other)</th>
                <th className="p-3">Month</th>
                <th className="p-3">Date (MM/DD/YYYY)</th>
                <th className="p-3"># attending</th>
              </tr>
            </thead>
            <tbody>
              {SKYPE_ROWS.map((row, i) => (
                <tr key={row.dateKey} className="border-t border-slate-100">
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder={i === 0 ? 'Skype or FaceTime' : ''}
                      value={values[row.methodKey] || ''}
                      onChange={(e) => setField(row.methodKey, e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder="Month"
                      value={values[row.monthKey] || ''}
                      onChange={(e) => setField(row.monthKey, e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <UsDatePicker
                      value={values[row.dateKey] || ''}
                      onChange={(v) => setField(row.dateKey, v)}
                      allowClear
                      buttonClassName={tableDatePickerClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder="#"
                      value={values[row.countKey] || ''}
                      onChange={(e) => setField(row.countKey, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>

      <FormSection
        step={5}
        title="Preferred course dates"
        description="List at least two alternative weekends if possible. Registration deadline below."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Request label</th>
                <th className="p-3">Month</th>
                <th className="p-3">Date(s) (MM/DD/YYYY)</th>
                <th className="p-3"># attending</th>
              </tr>
            </thead>
            <tbody>
              {COURSE_DATE_ROWS.map((row, i) => (
                <tr key={row.dateKey} className="border-t border-slate-100">
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder={`Course date request ${i + 1}`}
                      value={values[row.labelKey] || ''}
                      onChange={(e) => setField(row.labelKey, e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder="Month"
                      value={values[row.monthKey] || ''}
                      onChange={(e) => setField(row.monthKey, e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <UsDatePicker
                      value={values[row.dateKey] || ''}
                      onChange={(v) => setField(row.dateKey, v)}
                      allowClear
                      buttonClassName={tableDatePickerClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      placeholder="#"
                      value={values[row.countKey] || ''}
                      onChange={(e) => setField(row.countKey, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="max-w-xs pt-2">
          <UsDateField
            label="Registration deadline"
            value={values.deadLineDate || ''}
            onChange={(v) => setField('deadLineDate', v)}
          />
        </div>
      </FormSection>

      <FormSection step={6} title="Venue">
        <div className="grid gap-4 sm:grid-cols-2">
          {VENUE_FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type === 'phone' ? 'phone' : 'text'}
              value={values[f.key] || ''}
              onChange={(v) => setField(f.key, v)}
            />
          ))}
        </div>
      </FormSection>

      <FormSection step={7} title="Facility details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITY_FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              value={values[f.key] || ''}
              onChange={(v) => setField(f.key, v)}
            />
          ))}
        </div>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Other facility notes
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={values.otherFacility || ''}
            onChange={(e) => setField('otherFacility', e.target.value)}
            rows={3}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Anything else we should know
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={values.usToKnow || ''}
            onChange={(e) => setField('usToKnow', e.target.value)}
            rows={3}
          />
        </label>
      </FormSection>

      <FormSection step={8} title="Co-organizer or alternate contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={coOrganizerName} onChange={setCoOrganizerName} />
          <TextField label="Group / affiliation" value={coOrgGroupOrAffiliation} onChange={setCoOrgGroupOrAffiliation} />
          <TextField label="Email" type="email" value={coOrgEmail} onChange={setCoOrgEmail} />
          <TextField label="Phone" type="phone" value={coOrgPhone} onChange={setCoOrgPhone} />
          <TextField label="City" value={coOrgcity} onChange={setCoOrgcity} />
        </div>
        <GeoCountryFields
          country={coCountry}
          state={coState}
          onCountryChange={setCoCountry}
          onStateChange={setCoState}
          countryLabel="Co-organizer country"
          stateLabel="Co-organizer state / region"
        />
      </FormSection>

      <FormSection
        step={9}
        title={`Participants (${STUDENT_ROW_COUNT} rows)`}
        description="List each person in your group. Select gender (M/F) for each participant."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-900 text-xs font-bold uppercase tracking-wide text-white">
              <tr>
                <th className="w-10 p-2 text-center">#</th>
                <th className="p-2">Student name</th>
                <th className="p-2">Parent name (teen)</th>
                <th className="w-24 p-2">Gender</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="w-24 p-2">Age (teen)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={`student-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  <td className="p-2 text-center text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      value={s.participantName || ''}
                      onChange={(e) => setStudent(i, { participantName: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      value={s.participantParentName || ''}
                      onChange={(e) => setStudent(i, { participantParentName: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className={tableInputClass}
                      value={normalizeParticipantGender(s.dm)}
                      onChange={(e) => setStudent(i, { dm: e.target.value })}
                      aria-label={`Participant ${i + 1} gender`}
                    >
                      <option value="">—</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="email"
                      className={tableInputClass}
                      value={s.participantEmail || ''}
                      onChange={(e) => setStudent(i, { participantEmail: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      value={s.participantPhone || ''}
                      onChange={(e) => setStudent(i, { participantPhone: formatUsPhoneInput(e.target.value) })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className={tableInputClass}
                      value={s.teenAge || ''}
                      onChange={(e) => setStudent(i, { teenAge: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600"
            checked={agreedFaq}
            onChange={(e) => setAgreedFaq(e.target.checked)}
            required
          />
          <span>
            I have read and agree to the group course application terms and FAQ requirements (required to submit).
          </span>
        </label>

        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />

        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-5 w-full rounded-xl bg-[#0f172a] py-3.5 text-sm font-bold text-white transition hover:bg-teal-600 disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {status === 'sending' ? 'Submitting…' : 'Submit full application'}
        </button>
      </div>
    </form>
  )
}
