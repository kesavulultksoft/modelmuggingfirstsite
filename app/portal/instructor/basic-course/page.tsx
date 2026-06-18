'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmProfile,
  fetchMe,
  getToken,
  updateInstructorCrmProfile,
  type MeUser,
} from '@/lib/portalApi'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { formatUsPhoneDisplay, formatUsPhoneInput } from '@/lib/phoneUs'
import { crmDateFieldToUs } from '@/lib/usDate'

const BASIC_FIELDS = [
  'courseFromDate',
  'courseToDate',
  'courseLocation',
  'teachingCourseInCity',
  'dateOfFirstCourse',
  'facilityName',
  'facilityAddress',
  'facilityPhoneNumber',
  'tuitionForFirstCourse',
] as const

export default function InstructorBasicCoursePage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/basic-course')
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
    if (!me) return
    fetchInstructorCrmProfile()
      .then((p) => {
        const rec = legacyAsRecord(p) ?? {}
        setProfile(rec)
        const next: Record<string, string> = {}
        for (const k of BASIC_FIELDS) {
          const raw = rec[k]
          next[k] =
            k === 'courseFromDate' || k === 'courseToDate' || k === 'dateOfFirstCourse'
              ? crmDateFieldToUs(raw)
              : k === 'facilityPhoneNumber'
                ? formatUsPhoneDisplay(raw)
                : String(raw ?? '')
        }
        setForm(next)
      })
      .catch(() => setProfile(null))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const basic = String(profile?.basicCourseStatus ?? '—')

  const courseDetails =
    profile?.courseDetails != null && typeof profile.courseDetails === 'object'
      ? (profile.courseDetails as Record<string, unknown>)
      : null
  const assignedTrainingLocation = [
    profile?.assignedTrainingLocationName,
    profile?.instructorTrainingLocation,
    profile?.trainingLocationName,
    courseDetails?.locationName,
    profile?.locationName,
  ]
    .map((v) => (v == null ? '' : String(v).trim()))
    .find((s) => s.length > 0)
  const assignedTrainingDates = [courseDetails?.courseStartDate, courseDetails?.courseEndDate]
    .filter(Boolean)
    .map((v) => String(v))
  const dateFieldClass =
    'mt-1 h-auto min-h-[2.5rem] w-full justify-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-none hover:bg-slate-50'

  async function save() {
    setErr('')
    setMsg('')
    const body: Record<string, unknown> = {}
    for (const k of BASIC_FIELDS) {
      const v = form[k]?.trim()
      if (v) body[k] = v
    }
    const res = await updateInstructorCrmProfile(body)
    if (!res.ok) {
      setErr((await res.text()) || 'Save failed')
      return
    }
    const updated = legacyAsRecord(await res.json())
    setProfile(updated)
    setMsg('Basic course details saved on your instructor record.')
  }

  return (
    <>
      <PortalPageHeader
        title="Basic instructor course"
        subtitle="Women’s Basic prerequisite and facility details — aligned with legacy instructorBasicCourse.html; stored on mm_instructors."
      />
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          You must complete a Women’s Basic Self Defense course as a student before instructor training (tuition applies
          unless you are already a graduate). List the dates and location where you completed or will complete Basic
          Course, and facility contact info for your first teaching course when known.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Pipeline status</p>
        <p className="mt-2 text-xl font-semibold text-slate-900">{basic}</p>
      </div>

      {(assignedTrainingLocation || assignedTrainingDates.length > 0) && (
        <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-800 shadow-sm">
          <p className="font-bold text-teal-900">Assigned instructor training (read-only)</p>
          <p className="mt-2">
            Legacy <code className="rounded bg-white/80 px-1 text-xs">instructorBasicCourse.html</code> showed the
            selected upcoming training (<code className="rounded bg-white/80 px-1 text-xs">courseDetails</code>). When
            those fields exist on your <code className="rounded bg-white/80 px-1 text-xs">mm_instructors</code> record,
            they appear here for reference.
          </p>
          {assignedTrainingLocation && (
            <p className="mt-2">
              <span className="font-semibold text-slate-600">Location: </span>
              {assignedTrainingLocation}
            </p>
          )}
          {assignedTrainingDates.length > 0 && (
            <p className="mt-2">
              <span className="font-semibold text-slate-600">Course window (as stored): </span>
              {assignedTrainingDates.join(' — ')}
            </p>
          )}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-600">Basic course details</h2>
        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
        {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {BASIC_FIELDS.map((k) => (
            <label
              key={k}
              className={`text-sm font-semibold text-slate-700 ${k === 'facilityAddress' ? 'sm:col-span-2' : ''}`}
            >
              {labelForFormField(k)}
              {k === 'courseFromDate' || k === 'courseToDate' || k === 'dateOfFirstCourse' ? (
                <UsDatePicker
                  id={`basic-course-${k}`}
                  value={form[k] ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, [k]: v }))}
                  buttonClassName={dateFieldClass}
                />
              ) : k === 'facilityAddress' ? (
                <textarea
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  rows={3}
                  value={form[k] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                />
              ) : k === 'facilityPhoneNumber' ? (
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="999-999-9999"
                  value={form[k] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: formatUsPhoneInput(e.target.value) }))}
                />
              ) : (
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                  value={form[k] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          className="mt-4 rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e]"
        >
          Save basic course info
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Continue in the portal</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#0d9488]">
          <li>
            <Link href="/portal/instructor/trainings" className="font-semibold hover:underline">
              Course management (upcoming, past, cancelled)
            </Link>
          </li>
          <li>
            <Link href="/portal/instructor/calendar" className="font-semibold hover:underline">
              Training calendar
            </Link>
          </li>
          <li>
            <Link href="/portal/instructor/trainings/completed" className="font-semibold hover:underline">
              Completed trainings
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
