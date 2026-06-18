'use client'

import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'
import {
  COURSE_TYPE_OPTIONS,
  LEGACY_CITY_WEBPAGE_OPTIONS,
  type CourseFormState,
  type InstructorOption,
  type SessionSlot,
  createSessionSlot,
  fieldClass,
  formatUsDateTime,
  localYmdTimeToIso,
  usToYmd,
} from '@/lib/adminCourseFormModel'
import { formatUsPhoneInput } from '@/lib/phoneUs'

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{title}</h3>
      {children}
    </div>
  )
}

function YesNoRow({
  label,
  fieldName,
  value,
  onChange,
  order,
}: {
  label: string
  fieldName: string
  value: string
  onChange: (v: string) => void
  order: 'yes-first' | 'no-first'
}) {
  const yes = (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-800">
      <input
        type="radio"
        name={fieldName}
        checked={value === 'Yes'}
        onChange={() => onChange('Yes')}
        className="accent-[#0f172a]"
      />
      Yes
    </label>
  )
  const no = (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-800">
      <input
        type="radio"
        name={fieldName}
        checked={value === 'No'}
        onChange={() => onChange('No')}
        className="accent-[#0f172a]"
      />
      No
    </label>
  )
  return (
    <div>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="mt-1 flex flex-wrap gap-4">{order === 'no-first' ? <>{no}{yes}</> : <>{yes}{no}</>}</div>
    </div>
  )
}

function SessionScheduleEditor({
  slots,
  onUpdate,
  onAdd,
  onRemove,
}: {
  slots: SessionSlot[]
  onUpdate: (id: string, patch: Partial<Omit<SessionSlot, 'id'>>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 shadow-sm ring-1 ring-slate-100">
      <div className="border-b border-slate-100/90 bg-white/70 px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Session calendar</p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Use the <span className="font-semibold text-slate-800">date picker</span> for each meeting day, then set{' '}
              <span className="font-semibold text-slate-800">start</span> and{' '}
              <span className="font-semibold text-slate-800">end</span> time.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00d4aa] hover:text-[#0f172a] hover:shadow-lg"
          >
            Add another day
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:space-y-2 sm:p-5">
        <div className="hidden gap-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] sm:px-1">
          <span>Date</span>
          <span>From</span>
          <span>To</span>
          <span className="sr-only">Remove</span>
        </div>

        {slots.map((slot, index) => {
          const ymd = usToYmd((slot.date ?? '').trim())
          const startIso = ymd && slot.startTime ? localYmdTimeToIso(ymd, slot.startTime.trim()) : ''
          const endIso = ymd && slot.endTime ? localYmdTimeToIso(ymd, slot.endTime.trim()) : ''
          const hasPreview = Boolean(startIso && endIso)

          return (
            <div
              key={slot.id}
              className="relative rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-sm transition hover:border-teal-300/60 hover:shadow-md sm:border-slate-200/70 sm:p-0 sm:shadow-none"
            >
              <div className="mb-3 flex items-center justify-between sm:hidden">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Day {index + 1}
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] sm:items-end sm:gap-3">
                <label className="block text-xs font-semibold text-slate-600 sm:mb-0">
                  <span className="mb-1 block sm:hidden">Date</span>
                  <UsDatePicker
                    value={slot.date ?? ''}
                    onChange={(v) => onUpdate(slot.id, { date: v })}
                    allowClear
                    buttonClassName="mt-1 bg-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 sm:mb-0">
                  <span className="mb-1 block sm:hidden">From</span>
                  <input
                    type="time"
                    step={60}
                    className={`${fieldClass} bg-white`}
                    value={slot.startTime}
                    onChange={(e) => onUpdate(slot.id, { startTime: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600 sm:mb-0">
                  <span className="mb-1 block sm:hidden">To</span>
                  <input
                    type="time"
                    step={60}
                    className={`${fieldClass} bg-white`}
                    value={slot.endTime}
                    onChange={(e) => onUpdate(slot.id, { endTime: e.target.value })}
                  />
                </label>
                <div className="flex justify-end sm:mb-1 sm:justify-center">
                  <button
                    type="button"
                    title="Remove this day"
                    onClick={() => onRemove(slot.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              {hasPreview && (
                <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-500 sm:ml-1 sm:mt-3 sm:border-0 sm:pt-0">
                  <span className="text-slate-400">Stored: </span>
                  <span className="font-mono text-slate-600">
                    {formatUsDateTime(new Date(startIso))} <span className="text-slate-300">→</span>{' '}
                    {formatUsDateTime(new Date(endIso))}
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type PortalCourseEditorFormProps = {
  form: CourseFormState
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>
  instructors: InstructorOption[]
  /** Instructor portal: lock primary to this portal user id */
  lockPrimaryToUserId?: string
}

export default function PortalCourseEditorForm({ form, setForm, instructors, lockPrimaryToUserId }: PortalCourseEditorFormProps) {
  function setField<K extends keyof CourseFormState>(key: K, value: CourseFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateSessionSlot(id: string, patch: Partial<Omit<SessionSlot, 'id'>>) {
    setForm((f) => ({
      ...f,
      sessionSlots: f.sessionSlots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  function addSessionSlot() {
    setForm((f) => ({
      ...f,
      sessionSlots: [...f.sessionSlots, createSessionSlot()],
    }))
  }

  function removeSessionSlot(id: string) {
    setForm((f) => ({
      ...f,
      sessionSlots: f.sessionSlots.length <= 1 ? f.sessionSlots : f.sessionSlots.filter((s) => s.id !== id),
    }))
  }

  function addCoInstructor(id: string) {
    if (!id) return
    setForm((f) => ({
      ...f,
      coInstructorIds: f.coInstructorIds.includes(id) ? f.coInstructorIds : [...f.coInstructorIds, id],
    }))
  }

  function removeCoInstructor(id: string) {
    setForm((f) => ({ ...f, coInstructorIds: f.coInstructorIds.filter((x) => x !== id) }))
  }

  const primaryName =
    instructors.find((i) => i.id === form.primaryInstructorUserId)?.name || 'Primary instructor'

  return (
    <div className="space-y-2">
      <FormSection title="Class & tuition">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Course name
            <input
              className={fieldClass}
              value={form.courseCatalogId}
              onChange={(e) => setField('courseCatalogId', e.target.value)}
              placeholder="Course name"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Course type
            <select
              className={fieldClass}
              value={form.courseType}
              onChange={(e) => setField('courseType', e.target.value)}
            >
              {COURSE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
          <label className="text-xs font-semibold text-slate-600 sm:col-span-6">
            Course fee ($)
            <input
              className={fieldClass}
              inputMode="decimal"
              value={form.courseFees}
              onChange={(e) => setField('courseFees', e.target.value)}
              placeholder="e.g. 595"
            />
          </label>
          <div className="sm:col-span-3">
            <YesNoRow
              label="Weekend course*"
              fieldName={`weekend-${form.id || 'new'}`}
              value={form.weekendCourse}
              onChange={(v) => setField('weekendCourse', v)}
              order="yes-first"
            />
          </div>
          <div className="sm:col-span-3">
            <YesNoRow
              label="Private course*"
              fieldName={`private-${form.id || 'new'}`}
              value={form.privateCourse}
              onChange={(v) => setField('privateCourse', v)}
              order="no-first"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Schedule">
        <div className="space-y-6">
          <SessionScheduleEditor
            slots={form.sessionSlots}
            onUpdate={updateSessionSlot}
            onAdd={addSessionSlot}
            onRemove={removeSessionSlot}
          />
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100/90 bg-white/70 px-4 py-3.5 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Graduation / demonstration</p>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-end">
                <label className="block text-xs font-semibold text-slate-600">
                  Date*
                  <UsDatePicker
                    id={`grad-date-${form.id || 'new'}`}
                    value={form.graduationDate}
                    onChange={(v) => setField('graduationDate', v)}
                    buttonClassName="mt-1 bg-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Time*
                  <input
                    type="time"
                    step={60}
                    className={`${fieldClass} mt-1 bg-white`}
                    value={form.graduationTime}
                    onChange={(e) => setField('graduationTime', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100/90 bg-white/70 px-4 py-3.5 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Decision / cancel class by</p>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-end">
                <label className="block text-xs font-semibold text-slate-600">
                  Date*
                  <UsDatePicker
                    id={`decision-date-${form.id || 'new'}`}
                    value={form.decisionDate}
                    onChange={(v) => setField('decisionDate', v)}
                    buttonClassName="mt-1 bg-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Time*
                  <input
                    type="time"
                    step={60}
                    className={`${fieldClass} mt-1 bg-white`}
                    value={form.decisionTime}
                    onChange={(e) => setField('decisionTime', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="City webpage & venue">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            City webpage*
            <select
              className={fieldClass}
              value={form.locationName}
              onChange={(e) => setField('locationName', e.target.value)}
              required
            >
              <option value="">Select location</option>
              {form.locationName &&
                !LEGACY_CITY_WEBPAGE_OPTIONS.some((o) => o.value === form.locationName) && (
                  <option value={form.locationName}>{form.locationName} (saved value)</option>
                )}
              {LEGACY_CITY_WEBPAGE_OPTIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Venue name
            <input
              className={fieldClass}
              value={form.venueName}
              onChange={(e) => setField('venueName', e.target.value)}
              placeholder="Enter venue name"
            />
          </label>
          <GooglePlacesAutocomplete
            id={`venue-address-${form.id || 'new'}`}
            label={<>Venue address*</>}
            value={form.address}
            onChange={(v) => setField('address', v)}
            onPlaceSelect={(p) =>
              setForm((f) => ({
                ...f,
                address: p.address,
                latitude: p.latitude != null ? String(p.latitude) : f.latitude,
                longitude: p.longitude != null ? String(p.longitude) : f.longitude,
              }))
            }
            placeholder="Start typing for suggestions"
            className="block sm:col-span-2"
            inputClassName={`${fieldClass} bg-white`}
          />
          <label className="text-xs font-semibold text-slate-600">
            Venue phone number*
            <input
              className={fieldClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={(e) => setField('phoneNumber', formatUsPhoneInput(e.target.value))}
              placeholder="999-999-9999"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Contact email
            <input
              type="email"
              className={fieldClass}
              value={form.emailId}
              onChange={(e) => setField('emailId', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Venue point of contact (name)*
            <input
              className={fieldClass}
              value={form.venueContactName}
              onChange={(e) => setField('venueContactName', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Venue point of contact (phone)*
            <input
              className={fieldClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.venueContactPhone}
              onChange={(e) => setField('venueContactPhone', formatUsPhoneInput(e.target.value))}
              placeholder="999-999-9999"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Closest hospital*
            <input
              className={fieldClass}
              value={form.nearestHospital}
              onChange={(e) => setField('nearestHospital', e.target.value)}
            />
          </label>
          <GooglePlacesAutocomplete
            id={`class-location-${form.id || 'new'}`}
            label={<>Class location (if different from venue)</>}
            value={form.classLocation}
            onChange={(v) => setField('classLocation', v)}
            placeholder="Optional — address if class meets elsewhere"
            className="block sm:col-span-2"
            inputClassName={`${fieldClass} bg-white`}
          />
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Directions
            <textarea
              className={fieldClass}
              rows={2}
              value={form.directions}
              onChange={(e) => setField('directions', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Parking instructions
            <textarea
              className={fieldClass}
              rows={2}
              value={form.parkingInstructions}
              onChange={(e) => setField('parkingInstructions', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Lunch details
            <textarea
              className={fieldClass}
              rows={2}
              value={form.lunchDetails}
              onChange={(e) => setField('lunchDetails', e.target.value)}
            />
          </label>
        </div>
      </FormSection>

      <FormSection title="Instructors & staffing">
        <div className="grid gap-3 sm:grid-cols-2">
          {lockPrimaryToUserId ? (
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="text-xs font-semibold text-slate-600">Primary instructor</span>
              <p className="mt-1 font-medium text-slate-900">{primaryName}</p>
            </div>
          ) : (
            <label className="text-xs font-semibold text-slate-600">
              Primary instructor (portal user)*
              <select
                className={fieldClass}
                value={form.primaryInstructorUserId}
                onChange={(e) => {
                  const pid = e.target.value
                  setForm((f) => ({
                    ...f,
                    primaryInstructorUserId: pid,
                    coInstructorIds: f.coInstructorIds.filter((cid) => cid !== pid),
                  }))
                }}
              >
                <option value="">Select instructor</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-600" htmlFor={`co-inst-${form.id || 'new'}`}>
              Co-instructors
            </label>
            <select
              key={`${form.id || 'new'}-${form.primaryInstructorUserId}-${form.coInstructorIds.join(',')}`}
              id={`co-inst-${form.id || 'new'}`}
              className={fieldClass}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                if (v) addCoInstructor(v)
              }}
            >
              <option value="">Add co-instructor…</option>
              {instructors
                .filter((i) => i.id !== form.primaryInstructorUserId && !form.coInstructorIds.includes(i.id))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
            {form.coInstructorIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.coInstructorIds.map((cid) => {
                  const name = instructors.find((i) => i.id === cid)?.name ?? cid
                  return (
                    <span
                      key={cid}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                    >
                      {name}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                        onClick={() => removeCoInstructor(cid)}
                        aria-label={`Remove ${name}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
            Instructor name (display roster)
            <input
              className={fieldClass}
              value={form.instructorName}
              onChange={(e) => setField('instructorName', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Max students
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={form.maxStudents}
              onChange={(e) => setField('maxStudents', e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Min students needed
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.minStudentCount}
              onChange={(e) => setField('minStudentCount', e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <YesNoRow
              label="Short instructor (vacancy flag)*"
              fieldName={`short-${form.id || 'new'}`}
              value={form.shortInstructor}
              onChange={(v) => setField('shortInstructor', v)}
              order="yes-first"
            />
          </div>
          {form.shortInstructor === 'Yes' && (
            <>
              <label className="text-xs font-semibold text-slate-600">
                Short instructor (male)
                <input
                  className={fieldClass}
                  value={form.shortInstructorMale}
                  onChange={(e) => setField('shortInstructorMale', e.target.value)}
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Short instructor (female)
                <input
                  className={fieldClass}
                  value={form.shortInstructorFemale}
                  onChange={(e) => setField('shortInstructorFemale', e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      </FormSection>

      <FormSection title="Notes">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
          Write note if any (description)
          <textarea
            className={fieldClass}
            rows={3}
            value={form.courseDescription}
            onChange={(e) => setField('courseDescription', e.target.value)}
          />
        </label>
      </FormSection>
    </div>
  )
}
