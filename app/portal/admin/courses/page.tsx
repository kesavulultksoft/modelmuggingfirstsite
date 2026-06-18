'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Ban, ClipboardList, FileSpreadsheet, Mail, Pencil, Trash2, Users, X } from 'lucide-react'
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchMe,
  fetchAdminUsers,
  fetchAdminCourses,
  fetchAdminCourseVacancies,
  fetchAdminPendingAssignments,
  downloadAdminCourseExport,
  updateAdminCourse,
  fetchAdminCourseRegistrationCounts,
  fetchAdminCourseEnrollments,
  cancelAdminCourse,
  getToken,
  type MeUser,
  type AdminCourseWritePayload,
  type AdminCourseEnrollmentRow,
} from '@/lib/portalApi'
import {
  formatTimeHm,
  formatUsDate,
  formatUsDateTime,
  formatUsTime12,
  localYmdTimeToIso,
  parseStoredDateTimeToUsFields,
  usDateAndTimeToIso,
  usToYmd,
} from '@/lib/usDate'
import { formatUsPhoneInput, isValidUsPhone10 } from '@/lib/phoneUs'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import CourseEnrolledStudentsEmailDialog from '@/components/portal/CourseEnrolledStudentsEmailDialog'
import { registeredEmailsFromEnrollmentRows } from '@/lib/courseRosterEmail'
import { isCourseCompleted } from '@/lib/coursePortalDisplay'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type CourseTab = 'manage' | 'past' | 'cancelled' | 'vacancies' | 'pending' | 'catalog'

type ConfirmDialogConfig = {
  title: string
  description: string
  confirmLabel: string
  variant: 'destructive' | 'primary'
  action: () => Promise<void>
}

/** Same values as legacy `static/admin/adminCourse.html` (City webpage dropdown). */
const LEGACY_CITY_WEBPAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Atlanta', label: 'Atlanta' },
  { value: 'Boston / Providence', label: 'Boston / Providence' },
  { value: 'Los Angeles / Orange Counties', label: 'California-Los Angeles / Orange Counties' },
  { value: 'San Francisco / Bay Area', label: 'California-San Francisco / Bay Area' },
  { value: 'San Diego', label: 'California-San Diego' },
  { value: 'San Luis Obispo', label: 'California-San Luis Obispo' },
  { value: 'Santa Barbara', label: 'California-Santa Barbara' },
  { value: 'Ventura', label: 'California-Ventura' },
  { value: 'Phoenix / Tucson', label: 'Phoenix / Tucson' },
  { value: 'Seattle / Tacoma', label: 'Seattle / Tacoma' },
  { value: 'Denver', label: 'Denver' },
  { value: 'Dallas / Fort Worth', label: 'Dallas / Fort Worth' },
  { value: 'El Paso', label: 'El Paso' },
  { value: 'Hawaii', label: 'Hawaii' },
  { value: 'Las Vegas', label: 'Las Vegas' },
  { value: 'New York City', label: 'New York City' },
  { value: 'Philadelphia', label: 'Philadelphia' },
  { value: 'Ticino-Switzerland', label: 'Ticino-Switzerland' },
  { value: 'Koln', label: 'Köln' },
  { value: 'Munchen', label: 'München' },
]

const COURSE_TYPE_OPTIONS = ['Basic', 'Advance'] as const

const fieldClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900'

type SessionSlot = {
  id: string
  /** US display: MM/dd/yyyy */
  date: string
  /** HH:mm (browser time input) */
  startTime: string
  endTime: string
}

function newSlotId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createSessionSlot(overrides?: Partial<Omit<SessionSlot, 'id'>> & { id?: string }): SessionSlot {
  return {
    id: overrides?.id ?? newSlotId(),
    date: overrides?.date ?? '',
    startTime: overrides?.startTime ?? '09:00',
    endTime: overrides?.endTime ?? '17:00',
  }
}

function slotsFromSessionArrays(starts: string[], ends: string[]): SessionSlot[] {
  if (starts.length === 0 && ends.length === 0) return [createSessionSlot()]
  const len = Math.max(starts.length, ends.length)
  const out: SessionSlot[] = []
  for (let i = 0; i < len; i++) {
    const sRaw = starts[i]?.trim() ?? ''
    const eRaw = ends[i]?.trim() ?? ''
    let date = ''
    let startTime = '09:00'
    let endTime = '17:00'
    if (sRaw) {
      const ds = new Date(sRaw)
      if (!Number.isNaN(ds.getTime())) {
        date = formatUsDate(ds)
        startTime = formatTimeHm(ds)
      }
    }
    if (eRaw) {
      const de = new Date(eRaw)
      if (!Number.isNaN(de.getTime())) {
        if (!date) date = formatUsDate(de)
        endTime = formatTimeHm(de)
      }
    }
    out.push(createSessionSlot({ date, startTime, endTime }))
  }
  return out
}

function buildSessionPayload(slots: SessionSlot[]): { starts: string[]; ends: string[] } {
  const starts: string[] = []
  const ends: string[] = []
  for (const slot of slots) {
    const ymd = usToYmd((slot.date ?? '').trim())
    const st = slot.startTime?.trim()
    const et = slot.endTime?.trim()
    if (!ymd || !st || !et) continue
    const a = localYmdTimeToIso(ymd, st)
    const b = localYmdTimeToIso(ymd, et)
    if (a && b) {
      starts.push(a)
      ends.push(b)
    }
  }
  return { starts, ends }
}

function validateSessionSlots(slots: SessionSlot[]): string | null {
  for (const s of slots) {
    const bits = [s.date?.trim(), s.startTime?.trim(), s.endTime?.trim()].filter(Boolean)
    if (bits.length > 0 && bits.length < 3) {
      return 'Each session row needs a date, start time, and end time—or leave the row empty.'
    }
    if (s.date?.trim() && !usToYmd(s.date.trim())) {
      return 'Each session date must be a valid calendar date.'
    }
  }
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CourseFormState = {
  id: string
  locationName: string
  address: string
  courseFees: string
  status: string
  privateCourse: string
  sessionSlots: SessionSlot[]
  courseDescription: string
  graduationDate: string
  graduationTime: string
  instructorName: string
  weekendCourse: string
  courseType: string
  venueName: string
  directions: string
  parkingInstructions: string
  lunchDetails: string
  emailId: string
  phoneNumber: string
  latitude: string
  longitude: string
  courseCatalogId: string
  primaryInstructorUserId: string
  coInstructorIds: string[]
  maxStudents: string
  classLocation: string
  shortInstructor: string
  minStudentCount: string
  venueContactName: string
  venueContactPhone: string
  nearestHospital: string
  shortInstructorMale: string
  shortInstructorFemale: string
  decisionDate: string
  decisionTime: string
}

function collectCourseFormErrors(form: CourseFormState): string[] {
  const err: string[] = []
  if (!form.courseCatalogId.trim()) err.push('Course name is required.')
  if (!form.courseType.trim()) err.push('Course type is required.')
  const feeN = Number(form.courseFees)
  if (!form.courseFees.trim() || Number.isNaN(feeN) || feeN < 0) err.push('Valid course fee is required.')
  if (!form.locationName.trim()) err.push('City webpage is required.')
  const { starts } = buildSessionPayload(form.sessionSlots)
  if (starts.length === 0) err.push('Add at least one full session (date, start time, end time).')
  const slotMsg = validateSessionSlots(form.sessionSlots)
  if (slotMsg) err.push(slotMsg)
  if (!form.graduationDate.trim() || !usToYmd(form.graduationDate.trim())) {
    err.push('Graduation / demonstration date must be a valid date.')
  }
  if (!form.graduationTime.trim()) err.push('Graduation / demonstration time is required.')
  if (!form.address.trim()) err.push('Venue address is required.')
  if (!isValidUsPhone10(form.phoneNumber)) err.push('Venue phone must be 10 digits (US).')
  if (form.emailId.trim() && !EMAIL_RE.test(form.emailId.trim())) err.push('Contact email is not valid.')
  if (!form.venueContactName.trim()) err.push('Venue point of contact (name) is required.')
  if (!isValidUsPhone10(form.venueContactPhone)) err.push('Venue point of contact phone must be 10 digits (US).')
  if (!form.nearestHospital.trim()) err.push('Closest hospital is required.')
  if (!form.primaryInstructorUserId.trim()) err.push('Primary instructor is required.')
  if (form.minStudentCount.trim() && Number.isNaN(Number(form.minStudentCount))) {
    err.push('Min students must be a number.')
  }
  if (form.maxStudents.trim() && Number.isNaN(Number(form.maxStudents))) err.push('Max students must be a number.')
  if (form.shortInstructor === 'Yes') {
    if (!form.shortInstructorMale.trim() || !form.shortInstructorFemale.trim()) {
      err.push('Short instructor (male) and (female) are required when short-staffed.')
    }
  }
  if (!form.decisionDate.trim() || !usToYmd(form.decisionDate.trim())) {
    err.push('Decision / cancel-by date must be a valid date.')
  }
  if (!form.decisionTime.trim()) err.push('Decision / cancel-by time is required.')
  return err
}

type InstructorOption = { id: string; name: string; linkId: string }

function courseDisplayName(c: Record<string, unknown>): string {
  return String(c.templateId || c.courseName || c.locationName || 'Course')
}

function formatCourseSessionsCell(c: Record<string, unknown>): string {
  const starts = Array.isArray(c.sessionStarts) ? (c.sessionStarts as unknown[]).map(String) : []
  const ends = Array.isArray(c.sessionEnds) ? (c.sessionEnds as unknown[]).map(String) : []
  if (starts.length === 0) return '—'
  const lines: string[] = []
  const n = Math.max(starts.length, ends.length)
  for (let i = 0; i < n; i++) {
    const sRaw = starts[i]
    if (!sRaw) continue
    const s = new Date(sRaw)
    if (Number.isNaN(s.getTime())) continue
    const eRaw = ends[i]
    const e = eRaw ? new Date(eRaw) : null
    const endStr = e && !Number.isNaN(e.getTime()) ? formatUsTime12(e) : '—'
    lines.push(`${formatUsDateTime(s)} → ${endStr}`)
  }
  return lines.length ? lines.join('\n') : '—'
}

function instructorNamesCell(c: Record<string, unknown>, instructors: InstructorOption[]): string {
  const fallback = String(c.instructorName || '').trim()
  const ids = Array.isArray(c.instructorUserIds)
    ? (c.instructorUserIds as unknown[]).map(String).filter(Boolean)
    : []
  if (ids.length === 0) return fallback || '—'
  return ids.map((lid) => instructors.find((u) => u.linkId === lid || u.id === lid)?.name || lid).join(', ')
}

function formatPendingAssignmentWhen(r: Record<string, unknown>): string {
  const raw = r.createdAt ?? r.createdDate
  if (raw == null || raw === '') return '—'
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString('en-US')
}

function PendingAssignmentsTable({
  rows,
  courseLookup,
  emptyText,
}: {
  rows: Record<string, unknown>[]
  courseLookup: Map<string, string>
  emptyText: string
}) {
  function courseTitle(id: string): string {
    const t = id.trim()
    if (!t) return '—'
    return courseLookup.get(t) ?? `Course ${t.slice(0, 10)}${t.length > 10 ? '…' : ''}`
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="whitespace-nowrap p-3">Created</th>
              <th className="p-3">Status</th>
              <th className="p-3">Student user id</th>
              <th className="min-w-[220px] p-3">From course</th>
              <th className="min-w-[220px] p-3">To course</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const sid = String(r.studentUserId ?? '').trim()
              const fromId = String(r.fromCourseId ?? '').trim()
              const toId = String(r.toCourseId ?? '').trim()
              const rk = cid(r) || `pending-${i}`
              return (
                <tr key={rk} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap p-3 text-xs text-slate-600">{formatPendingAssignmentWhen(r)}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                      {String(r.status || '—')}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate p-3 font-mono text-xs text-slate-800">{sid || '—'}</td>
                  <td className="p-3 text-slate-700">
                    {fromId ? (
                      <Link
                        href={`/portal/admin/courses/${encodeURIComponent(fromId)}`}
                        className="font-semibold text-[#0d9488] hover:underline"
                      >
                        {courseTitle(fromId)}
                      </Link>
                    ) : (
                      '—'
                    )}
                    <p className="font-mono text-[10px] text-slate-400">{fromId || ''}</p>
                  </td>
                  <td className="p-3 text-slate-700">
                    {toId ? (
                      <Link
                        href={`/portal/admin/courses/${encodeURIComponent(toId)}`}
                        className="font-semibold text-[#0d9488] hover:underline"
                      >
                        {courseTitle(toId)}
                      </Link>
                    ) : (
                      '—'
                    )}
                    <p className="font-mono text-[10px] text-slate-400">{toId || ''}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-slate-100 p-8 text-center text-slate-500">{emptyText}</p>
      ) : null}
    </div>
  )
}

function emptyForm(): CourseFormState {
  return {
  id: '',
  locationName: '',
  address: '',
  courseFees: '',
  status: 'Open',
  privateCourse: 'No',
  sessionSlots: [createSessionSlot()],
  courseDescription: '',
  graduationDate: '',
  graduationTime: '12:00',
  instructorName: '',
  weekendCourse: 'No',
  courseType: 'Basic',
  venueName: '',
  directions: '',
  parkingInstructions: '',
  lunchDetails: '',
  emailId: '',
  phoneNumber: '',
  latitude: '',
  longitude: '',
  courseCatalogId: '',
  primaryInstructorUserId: '',
  coInstructorIds: [],
  maxStudents: '',
  classLocation: '',
  shortInstructor: 'No',
  minStudentCount: '',
  venueContactName: '',
  venueContactPhone: '',
  nearestHospital: '',
  shortInstructorMale: '',
  shortInstructorFemale: '',
  decisionDate: '',
  decisionTime: '12:00',
  }
}

function cid(c: Record<string, unknown>): string {
  const raw = c.id ?? c._id
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string' && raw.trim()) return raw.trim()

  const toFixedHex = (n: unknown, width: number): string | null => {
    const v = Number(n)
    if (!Number.isFinite(v) || v < 0) return null
    return Math.trunc(v).toString(16).padStart(width, '0').slice(-width)
  }

  if (typeof raw === 'object' && raw !== null) {
    const rec = raw as Record<string, unknown>
    if (typeof rec.$oid === 'string' && rec.$oid.trim()) return rec.$oid.trim()
    if (typeof rec.oid === 'string' && rec.oid.trim()) return rec.oid.trim()
    if (typeof rec.hexString === 'string' && rec.hexString.trim()) return rec.hexString.trim()

    // Spring/Jackson can serialize ObjectId as bean fields:
    // { timestamp, machineIdentifier, processIdentifier, counter, ... }.
    const ts = toFixedHex(rec.timestamp ?? rec.timeSecond, 8)
    const machine = toFixedHex(rec.machineIdentifier, 6)
    const process = toFixedHex(rec.processIdentifier, 4)
    const counter = toFixedHex(rec.counter, 6)
    if (ts && machine && process && counter) return `${ts}${machine}${process}${counter}`

    // Final fallback: pull a 24-char hex id if present anywhere nested.
    const j = JSON.stringify(rec)
    const m = j.match(/"([a-f0-9]{24})"/i)
    if (m) return m[1]
  }

  return ''
}

function fromCourse(c: Record<string, unknown>, instructors: InstructorOption[]): CourseFormState {
  const starts = Array.isArray(c.sessionStarts)
    ? (c.sessionStarts as unknown[]).map((x) => String(x))
    : []
  const ends = Array.isArray(c.sessionEnds) ? (c.sessionEnds as unknown[]).map((x) => String(x)) : []
  const grad = parseStoredDateTimeToUsFields(String(c.graduationDisplay || ''))
  const dec = parseStoredDateTimeToUsFields(String(c.decisionDateDisplay || c.decisionDateTo || ''))
  const primaryLink = String(c.primaryInstructorId || '')
  const primaryUserId =
    instructors.find((i) => i.linkId === primaryLink || i.id === primaryLink)?.id ?? ''
  const rawInstructorLinks = Array.isArray(c.instructorUserIds)
    ? (c.instructorUserIds as unknown[]).map((x) => String(x)).filter(Boolean)
    : []
  const coLinks = rawInstructorLinks.filter((lid) => lid !== primaryLink)
  const coInstructorIds = coLinks
    .map((lid) => instructors.find((i) => i.linkId === lid || i.id === lid)?.id)
    .filter((x): x is string => Boolean(x))
  return {
    id: cid(c),
    locationName: String(c.locationName || ''),
    address: String(c.address || ''),
    courseFees: String(c.feeDisplay || c.courseFees || ''),
    status: String(c.status || 'Open'),
    privateCourse: String(c.privateCourse || 'No'),
    sessionSlots: slotsFromSessionArrays(starts, ends),
    courseDescription: String(c.description || ''),
    graduationDate: grad.date,
    graduationTime: grad.time,
    instructorName: String(c.instructorName || ''),
    weekendCourse: String(c.weekendCourse || 'No'),
    courseType: String(c.courseType || 'Basic'),
    venueName: String(c.venueName || ''),
    directions: String(c.directions || ''),
    parkingInstructions: String(c.parkingInfo || ''),
    lunchDetails: String(c.lunchInfo || ''),
    emailId: String(c.contactEmail || ''),
    phoneNumber: formatUsPhoneInput(String(c.contactPhone || '')),
    latitude: String(c.latitude || ''),
    longitude: String(c.longitude || ''),
    courseCatalogId: String(c.templateId || ''),
    primaryInstructorUserId: primaryUserId,
    coInstructorIds,
    maxStudents: c.maxStudents != null ? String(c.maxStudents) : '',
    classLocation: String(c.classLocation || ''),
    shortInstructor: String(c.shortInstructor || 'No'),
    minStudentCount: c.minStudentCount != null ? String(c.minStudentCount as number) : '',
    venueContactName: String(c.venueContactName || c.locationPointContact || ''),
    venueContactPhone: formatUsPhoneInput(String(c.venueContactPhone || c.locationPointContactPh || '')),
    nearestHospital: String(c.nearestHospital || c.locationCloseHospital || ''),
    shortInstructorMale: String(c.shortInstructorMale || ''),
    shortInstructorFemale: String(c.shortInstructorFemale || ''),
    decisionDate: dec.date,
    decisionTime: dec.time,
  }
}

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
              <span className="font-semibold text-slate-800">end</span> time. Add as many days as the class
              runs—weekends, multi-day intensives, etc.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00d4aa] hover:text-[#0f172a] hover:shadow-lg"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
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
          const startIso =
            ymd && slot.startTime ? localYmdTimeToIso(ymd, slot.startTime.trim()) : ''
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
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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

export default function AdminCoursesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [courseTab, setCourseTab] = useState<CourseTab>('manage')
  const [tabRows, setTabRows] = useState<Record<string, unknown>[]>([])
  const [tabErr, setTabErr] = useState('')
  const [dlErr, setDlErr] = useState('')
  const [dlBusy, setDlBusy] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm] = useState<CourseFormState>(() => emptyForm())
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [manageSearch, setManageSearch] = useState('')
  const COURSE_PAGE_SIZE = 25
  const [managePage, setManagePage] = useState(1)
  /** Search for Vacancies / Pending re-assignments / Full catalog tabs */
  const [tabSurfaceSearch, setTabSurfaceSearch] = useState({ vacancies: '', pending: '', catalog: '' })
  const [regCounts, setRegCounts] = useState<Record<string, number>>({})
  const [rosterOpen, setRosterOpen] = useState(false)
  const [rosterTitle, setRosterTitle] = useState('')
  const [rosterRows, setRosterRows] = useState<AdminCourseEnrollmentRow[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStudentEmails, setEmailStudentEmails] = useState<string[]>([])
  const [emailCourseId, setEmailCourseId] = useState('')
  const [emailCourseTitle, setEmailCourseTitle] = useState('')
  const [rowActionBusy, setRowActionBusy] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  /** Bumps when course list reloads; avoids unstable `courses` array in effect dependency lists. */
  const [coursesRefreshKey, setCoursesRefreshKey] = useState(0)

  useEffect(() => {
    setManagePage(1)
  }, [manageSearch, coursesRefreshKey])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/courses')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
    fetchAdminCourses().then((c) => {
      setCourses((c as Record<string, unknown>[]) || [])
      setCoursesRefreshKey((k) => k + 1)
    })
    fetchAdminUsers()
      .then((u) => {
        const rows = Array.isArray(u) ? (u as Record<string, unknown>[]) : []
        const opts = rows
          .filter((r) => {
            if (String(r.role || '') !== 'INSTRUCTOR') return false
            if (r.displayRole === undefined && r.activeInstructor === undefined) return true
            return (
              r.activeInstructor === true || String(r.displayRole || '').toUpperCase() === 'INSTRUCTOR'
            )
          })
          .map((r) => {
            const id = String(r.id || '')
            const linkId = String((r.primaryInstructorId as string | undefined) || id)
            return {
              id,
              linkId,
              name: `${String(r.firstName || '')} ${String(r.lastName || '')}`.trim() || String(r.email || ''),
            }
          })
        setInstructors(opts.filter((o) => o.id))
      })
      .catch(() => setInstructors([]))
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchAdminCourseRegistrationCounts()
      .then(setRegCounts)
      .catch(() => setRegCounts({}))
  }, [me, coursesRefreshKey])

  useEffect(() => {
    if (
      !me ||
      courseTab === 'past' ||
      courseTab === 'cancelled' ||
      courseTab === 'manage'
    )
      return
    setTabErr('')
    const load =
      courseTab === 'vacancies'
        ? fetchAdminCourseVacancies()
        : courseTab === 'pending'
          ? fetchAdminPendingAssignments()
          : fetchAdminCourses()
    load
      .then((d) => setTabRows(Array.isArray(d) ? (d as Record<string, unknown>[]) : []))
      .catch((e) => setTabErr(String(e.message || e)))
  }, [me, courseTab, coursesRefreshKey])

  async function download(kind: 'roster' | 'attendance', courseId: string) {
    setDlErr('')
    setDlBusy(kind + courseId)
    try {
      await downloadAdminCourseExport(courseId, kind)
    } catch (e) {
      setDlErr(String((e as Error).message || e))
    }
    setDlBusy(null)
  }

  const courseLookup = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of courses) {
      const id = cid(c)
      if (id) m.set(id, courseDisplayName(c))
    }
    return m
  }, [courses])

  const filteredVacancyOrCatalogRows = useMemo(() => {
    if (courseTab !== 'vacancies' && courseTab !== 'catalog') return []
    const q =
      (courseTab === 'vacancies' ? tabSurfaceSearch.vacancies : tabSurfaceSearch.catalog).trim().toLowerCase()
    if (!q) return tabRows
    return tabRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [courseTab, tabRows, tabSurfaceSearch.vacancies, tabSurfaceSearch.catalog])

  const filteredPendingRows = useMemo(() => {
    if (courseTab !== 'pending') return []
    const q = tabSurfaceSearch.pending.trim().toLowerCase()
    if (!q) return tabRows
    return tabRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [courseTab, tabRows, tabSurfaceSearch.pending])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const tabs: { id: CourseTab; label: string }[] = [
    { id: 'manage', label: 'Courses' },
    { id: 'past', label: 'Past Courses' },
    { id: 'cancelled', label: 'Cancelled Classes' },
    { id: 'vacancies', label: 'Vacancies' },
    { id: 'pending', label: 'Pending re-assignments' },
    { id: 'catalog', label: 'Full catalog' },
  ]

  const pastCourses = courses.filter((c) => String(c.status || '').toLowerCase() === 'completed')
  const cancelledCourses = courses.filter((c) => String(c.status || '').toLowerCase() === 'cancelled')

  function courseTable(
    rows: Record<string, unknown>[],
    emptyText: string,
    options?: { readOnly?: boolean },
  ) {
    const readOnly = options?.readOnly === true
    return (
      <>
        {dlErr && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">{dlErr}</p>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">City</th>
                  <th className="min-w-[240px] p-3">Course</th>
                  <th className="min-w-[264px] p-3">Schedule</th>
                  <th className="p-3">Min #</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3">Tuition</th>
                  <th className="p-3">Instructors</th>
                  <th className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const id = cid(c)
                  const busy1 = dlBusy === 'roster' + id
                  const busy2 = dlBusy === 'attendance' + id
                  const title = courseDisplayName(c)
                  const reg = id ? regCounts[id] ?? 0 : 0
                  const minN = c.minStudentCount != null ? String(c.minStudentCount) : '—'
                  return (
                    <tr key={id || i} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="p-3 font-medium text-slate-900">{String(c.locationName || '—')}</td>
                      <td className="min-w-[240px] max-w-[288px] p-3 text-slate-700">
                        {id ? (
                          <Link
                            href={`/portal/admin/courses/${encodeURIComponent(id)}`}
                            className="font-semibold text-[#0d9488] hover:underline"
                          >
                            {title}
                          </Link>
                        ) : (
                          <span className="font-semibold">{title}</span>
                        )}
                        <p className="text-xs text-slate-500">{String(c.address || c.classLocation || '—')}</p>
                      </td>
                      <td className="min-w-[264px] max-w-[264px] p-3 text-xs leading-relaxed whitespace-pre-line text-slate-700">
                        {formatCourseSessionsCell(c)}
                      </td>
                      <td className="p-3 text-slate-600">{minN}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {id ? (
                            <button
                              type="button"
                              onClick={() => openRosterDialog(id, title)}
                              className="font-semibold text-[#0f172a] hover:underline"
                            >
                              {reg}
                            </button>
                          ) : (
                            <span>{reg}</span>
                          )}
                          {id ? (
                            <button
                              type="button"
                              title="Email registered students"
                              onClick={() => openEmailDialog(id, title)}
                              className="inline-flex rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0d9488]"
                            >
                              <Mail className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{String(c.feeDisplay || c.courseFees || '—')}</td>
                      <td className="max-w-[180px] p-3 text-xs text-slate-600">
                        {instructorNamesCell(c, instructors)}
                      </td>
                      <td className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-0.5">
                          {!readOnly && !isCourseCompleted(c) ? (
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => {
                                setForm(fromCourse(c, instructors))
                                setCourseTab('manage')
                                setEditorOpen(true)
                              }}
                              className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </button>
                          ) : null}
                          {id && (
                            <>
                              <button
                                type="button"
                                title="Download roster XLSX"
                                disabled={!!dlBusy}
                                onClick={() => download('roster', id)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                              >
                                <FileSpreadsheet className="size-4" aria-hidden />
                                <span className="sr-only">{busy1 ? 'Loading roster' : 'Download roster'}</span>
                              </button>
                              <button
                                type="button"
                                title="Download attendance XLSX"
                                disabled={!!dlBusy}
                                onClick={() => download('attendance', id)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                              >
                                <ClipboardList className="size-4" aria-hidden />
                                <span className="sr-only">{busy2 ? 'Loading attendance' : 'Download attendance'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="p-8 text-center text-slate-500">{emptyText}</p>}
        </div>
      </>
    )
  }

  function setField<K extends keyof CourseFormState>(k: K, v: CourseFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function updateSessionSlot(id: string, patch: Partial<Omit<SessionSlot, 'id'>>) {
    setForm((f) => ({
      ...f,
      sessionSlots: f.sessionSlots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  function addSessionSlot() {
    setForm((f) => ({ ...f, sessionSlots: [...f.sessionSlots, createSessionSlot()] }))
  }

  function removeSessionSlot(id: string) {
    setForm((f) => {
      if (f.sessionSlots.length <= 1) return { ...f, sessionSlots: [createSessionSlot()] }
      return { ...f, sessionSlots: f.sessionSlots.filter((s) => s.id !== id) }
    })
  }

  function addCoInstructor(userId: string) {
    if (!userId) return
    setForm((f) => {
      if (userId === f.primaryInstructorUserId || f.coInstructorIds.includes(userId)) return f
      return { ...f, coInstructorIds: [...f.coInstructorIds, userId] }
    })
  }

  function removeCoInstructor(userId: string) {
    setForm((f) => ({ ...f, coInstructorIds: f.coInstructorIds.filter((x) => x !== userId) }))
  }

  async function refreshCourses() {
    const c = await fetchAdminCourses()
    setCourses((c as Record<string, unknown>[]) || [])
    setCoursesRefreshKey((k) => k + 1)
  }

  async function openRosterDialog(courseId: string, title: string) {
    setRosterTitle(title)
    setRosterOpen(true)
    setRosterLoading(true)
    setRosterRows([])
    try {
      const rows = await fetchAdminCourseEnrollments(courseId)
      setRosterRows(Array.isArray(rows) ? rows : [])
    } catch {
      setRosterRows([])
    }
    setRosterLoading(false)
  }

  async function openEmailDialog(courseId: string, title: string) {
    setEmailCourseId(courseId)
    setEmailCourseTitle(title)
    setEmailOpen(true)
    setEmailLoading(true)
    setEmailStudentEmails([])
    try {
      const rows = await fetchAdminCourseEnrollments(courseId)
      setEmailStudentEmails(
        registeredEmailsFromEnrollmentRows(Array.isArray(rows) ? rows : []),
      )
    } catch {
      setEmailStudentEmails([])
    } finally {
      setEmailLoading(false)
    }
  }

  function closeCourseEditor() {
    setEditorOpen(false)
  }

  async function runConfirmDialogAction() {
    if (!confirmDialog) return
    setConfirmBusy(true)
    try {
      await confirmDialog.action()
    } finally {
      setConfirmBusy(false)
      setConfirmDialog(null)
    }
  }

  function requestDeleteCourseRow(id: string) {
    if (!id) return
    setConfirmDialog({
      title: 'Delete this course?',
      description: 'Permanently delete this course? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      action: async () => {
        setRowActionBusy('del-' + id)
        try {
          const res = await deleteAdminCourse(id)
          if (!res.ok && res.status !== 204) throw new Error((await res.text()) || 'Delete failed')
          setSaveMsg('')
          await refreshCourses()
          setForm((f) => (f.id === id ? emptyForm() : f))
        } catch (e) {
          alert(String((e as Error).message || e))
        }
        setRowActionBusy(null)
      },
    })
  }

  function requestCancelCourseRow(id: string) {
    if (!id) return
    setConfirmDialog({
      title: 'Cancel this class?',
      description: 'Mark this course as cancelled? Students and the schedule will reflect a cancelled class.',
      confirmLabel: 'Cancel class',
      variant: 'destructive',
      action: async () => {
        setRowActionBusy('cancel-' + id)
        try {
          const res = await cancelAdminCourse(id)
          if (!res.ok) throw new Error((await res.text()) || 'Cancel failed')
          await refreshCourses()
        } catch (e) {
          alert(String((e as Error).message || e))
        }
        setRowActionBusy(null)
      },
    })
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaveMsg('')
    const errors = collectCourseFormErrors(form)
    if (errors.length) {
      setSaveMsg(errors.join(' '))
      return
    }
    const { starts, ends } = buildSessionPayload(form.sessionSlots)
    const gradIso = usDateAndTimeToIso(form.graduationDate, form.graduationTime)
    const decisionIso = usDateAndTimeToIso(form.decisionDate, form.decisionTime)
    let displayStart: number | undefined
    if (starts.length > 0 && starts[0]) displayStart = new Date(starts[0]).getTime()
    else if (gradIso) displayStart = new Date(gradIso).getTime()
    const primary = form.primaryInstructorUserId.trim()
    const coIds = form.coInstructorIds.filter((id) => id && id !== primary)
    const payload: AdminCourseWritePayload = {
      locationName: form.locationName.trim(),
      address: form.address.trim(),
      courseFees: form.courseFees.trim(),
      status: form.status.trim() || 'Open',
      privateCourse: form.privateCourse.trim(),
      startDateTime: starts,
      endDateTime: ends,
      courseDescription: form.courseDescription.trim(),
      courseGraduationDate: gradIso || '',
      displayStartDate: displayStart,
      instructorName: form.instructorName.trim(),
      weekendCourse: form.weekendCourse.trim(),
      courseType: form.courseType.trim(),
      venueName: form.venueName.trim(),
      directions: form.directions.trim(),
      parkingInstructions: form.parkingInstructions.trim(),
      lunchDetails: form.lunchDetails.trim(),
      emailId: form.emailId.trim(),
      phoneNumber: form.phoneNumber.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      courseCatalogId: form.courseCatalogId.trim(),
      primaryInstructorUserId: primary,
      instructorUserIds: coIds,
      maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
      classLocation: form.classLocation.trim(),
      shortInstructor: form.shortInstructor.trim(),
      minStudentCount: form.minStudentCount ? Number(form.minStudentCount) : undefined,
      venueContactName: form.venueContactName.trim(),
      venueContactPhone: form.venueContactPhone.trim(),
      nearestHospital: form.nearestHospital.trim(),
      shortInstructorMale: form.shortInstructorMale.trim(),
      shortInstructorFemale: form.shortInstructorFemale.trim(),
      decisionDateDisplay: decisionIso || '',
    }
    setSaving(true)
    try {
      const res = form.id
        ? await updateAdminCourse(form.id, payload)
        : await createAdminCourse(payload)
      if (!res.ok) throw new Error((await res.text()) || 'Save failed')
      setSaveMsg(form.id ? 'Course updated.' : 'Course created.')
      if (!form.id) setForm(emptyForm())
      await refreshCourses()
    } catch (e) {
      setSaveMsg(String((e as Error).message || e))
    }
    setSaving(false)
  }

  function requestDeleteCourseFromForm() {
    if (!form.id) return
    setConfirmDialog({
      title: 'Delete this course?',
      description: 'Permanently delete this course? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      action: async () => {
        setSaveMsg('')
        setSaving(true)
        try {
          const res = await deleteAdminCourse(form.id!)
          if (!res.ok && res.status !== 204) throw new Error((await res.text()) || 'Delete failed')
          setSaveMsg('Course deleted.')
          setForm(emptyForm())
          await refreshCourses()
        } catch (e) {
          setSaveMsg(String((e as Error).message || e))
        }
        setSaving(false)
      },
    })
  }

  const manageRows = courses.filter((c) => {
    if (isCourseCompleted(c)) return false
    if (!manageSearch.trim()) return true
    const s = JSON.stringify(c).toLowerCase()
    return s.includes(manageSearch.toLowerCase())
  })

  const manageTotalPages = Math.max(1, Math.ceil(manageRows.length / COURSE_PAGE_SIZE))
  const manageSafePage = Math.min(managePage, manageTotalPages)
  const managePageRows = manageRows.slice((manageSafePage - 1) * COURSE_PAGE_SIZE, manageSafePage * COURSE_PAGE_SIZE)

  return (
    <>
      <PortalPageHeader
        title="Course management"
        subtitle="Roster/attendance exports, vacancy courses, pending assign-other events, and full catalog."
      />
      <p className="mb-4 text-sm text-slate-600">
        Public schedule:{' '}
        <Link href="/schedule" className="font-semibold text-[#0d9488] hover:underline">
          /schedule
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCourseTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
              courseTab === t.id
                ? 'bg-[#0f172a] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-[#00d4aa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {courseTab === 'manage' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-800">Course editor</p>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm())
                  setSaveMsg('')
                  setEditorOpen(true)
                }}
                className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white sm:text-sm"
              >
                + New course
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Smart flow: browse courses first, then open editor only when creating or editing.
            </p>
          </div>

          {editorOpen && (
            <form onSubmit={saveCourse} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">
                  {form.id ? `Editing course ${form.id}` : 'Create course'}
                </p>
                <button
                  type="button"
                  onClick={closeCourseEditor}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Close editor
                </button>
              </div>
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
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Graduation / demonstration
                        </p>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                          Final graduation or demonstration—one date and time (shown on the public schedule).
                        </p>
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
                        {(() => {
                          const ymd = usToYmd(form.graduationDate.trim())
                          if (!ymd || !form.graduationTime.trim()) return null
                          const iso = localYmdTimeToIso(ymd, form.graduationTime.trim())
                          if (!iso) return null
                          return (
                            <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-500">
                              <span className="text-slate-400">Stored: </span>
                              <span className="font-mono text-slate-600">{formatUsDateTime(new Date(iso))}</span>
                            </p>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 shadow-sm ring-1 ring-slate-100">
                      <div className="border-b border-slate-100/90 bg-white/70 px-4 py-3.5 sm:px-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Decision / cancel class by
                        </p>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                          Last date and time to run or cancel the class based on enrollment.
                        </p>
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
                        {(() => {
                          const ymd = usToYmd(form.decisionDate.trim())
                          if (!ymd || !form.decisionTime.trim()) return null
                          const iso = localYmdTimeToIso(ymd, form.decisionTime.trim())
                          if (!iso) return null
                          return (
                            <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-500">
                              <span className="text-slate-400">Stored: </span>
                              <span className="font-mono text-slate-600">{formatUsDateTime(new Date(iso))}</span>
                            </p>
                          )
                        })()}
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                      Write note if any (description)
                      <textarea
                        className={fieldClass}
                        rows={3}
                        value={form.courseDescription}
                        onChange={(e) => setField('courseDescription', e.target.value)}
                      />
                    </label>
                  </div>
                </FormSection>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={saving} type="submit" className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white">
                  {saving ? 'Saving…' : form.id ? 'Update course' : 'Create course'}
                </button>
                {form.id && (
                  <button disabled={saving} type="button" onClick={requestDeleteCourseFromForm} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700">
                    Delete
                  </button>
                )}
                <button type="button" onClick={() => setForm(emptyForm())} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Reset
                </button>
                <button
                  type="button"
                  onClick={closeCourseEditor}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Close editor
                </button>
              </div>
              {saveMsg && <p className="mt-3 text-sm text-slate-700">{saveMsg}</p>}
            </form>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">All courses</p>
              <input
                className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                placeholder="Search city, course, instructor, dates…"
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
              />
            </div>
            <p className="mb-2 text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{managePageRows.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{manageRows.length}</span> matched courses (page{' '}
              <span className="font-semibold text-slate-900">{manageSafePage}</span> of{' '}
              <span className="font-semibold text-slate-900">{manageTotalPages}</span>).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">City</th>
                    <th className="min-w-[240px] p-3">Course</th>
                    <th className="min-w-[264px] p-3">Schedule</th>
                    <th className="p-3">Min #</th>
                    <th className="p-3">Registered</th>
                    <th className="p-3">Tuition</th>
                    <th className="p-3">Instructors</th>
                    <th className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managePageRows.map((c, i) => {
                    const id = cid(c)
                    const title = courseDisplayName(c)
                    const reg = id ? regCounts[id] ?? 0 : 0
                    const minN = c.minStudentCount != null ? String(c.minStudentCount) : '—'
                    return (
                      <tr key={id || i} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="p-3 font-medium text-slate-900">{String(c.locationName || '—')}</td>
                        <td className="min-w-[240px] max-w-[288px] p-3 text-slate-700">
                          {id ? (
                            <Link
                              href={`/portal/admin/courses/${encodeURIComponent(id)}`}
                              className="font-semibold text-[#0d9488] hover:underline"
                            >
                              {title}
                            </Link>
                          ) : (
                            <span className="font-semibold">{title}</span>
                          )}
                          <p className="text-xs text-slate-500">{String(c.address || c.classLocation || '—')}</p>
                        </td>
                        <td className="min-w-[264px] max-w-[264px] p-3 text-xs leading-relaxed whitespace-pre-line text-slate-700">
                          {formatCourseSessionsCell(c)}
                        </td>
                        <td className="p-3 text-slate-600">{minN}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {id ? (
                              <button
                                type="button"
                                onClick={() => openRosterDialog(id, title)}
                                className="font-semibold text-[#0f172a] hover:underline"
                              >
                                {reg}
                              </button>
                            ) : (
                              <span className="font-semibold">{reg}</span>
                            )}
                            {id ? (
                              <button
                                type="button"
                                title="Email registered students"
                                onClick={() => openEmailDialog(id, title)}
                                className="inline-flex rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0d9488]"
                              >
                                <Mail className="size-4" aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{String(c.feeDisplay || c.courseFees || '—')}</td>
                        <td className="max-w-[180px] p-3 text-xs text-slate-600">
                          {instructorNamesCell(c, instructors)}
                        </td>
                        <td className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right align-middle">
                          <div className="flex flex-nowrap items-center justify-end gap-0.5">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => {
                                setForm(fromCourse(c, instructors))
                                setSaveMsg('')
                                setEditorOpen(true)
                              }}
                              className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </button>
                            {id &&
                            !['cancelled', 'canceled'].includes(String(c.status || '').toLowerCase()) ? (
                              <button
                                type="button"
                                title="Cancel class"
                                disabled={!!rowActionBusy}
                                onClick={() => requestCancelCourseRow(id)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                              >
                                <Ban className="size-4" aria-hidden />
                              </button>
                            ) : null}
                            {id ? (
                              <button
                                type="button"
                                title="Delete"
                                disabled={!!rowActionBusy}
                                onClick={() => requestDeleteCourseRow(id)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {manageRows.length > COURSE_PAGE_SIZE ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
                  <p>
                    Showing {(manageSafePage - 1) * COURSE_PAGE_SIZE + 1}–{Math.min(manageSafePage * COURSE_PAGE_SIZE, manageRows.length)} of{' '}
                    <span className="font-semibold text-slate-900">{manageRows.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={manageSafePage <= 1}
                      onClick={() => setManagePage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-semibold text-slate-800">
                      {manageSafePage} / {manageTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={manageSafePage >= manageTotalPages}
                      onClick={() => setManagePage((p) => Math.min(manageTotalPages, p + 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {manageRows.length === 0 && <p className="p-6 text-center text-slate-500">No courses match your search.</p>}
          </div>
        </div>
      )}

      {courseTab === 'past' && courseTable(pastCourses, 'No completed/past courses found.', { readOnly: true })}
      {courseTab === 'cancelled' && courseTable(cancelledCourses, 'No cancelled classes found.')}

      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Users className="size-5 text-[#0d9488]" aria-hidden />
              Registered students · {rosterTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3">
            {rosterLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : rosterRows.length === 0 ? (
              <p className="text-sm text-slate-500">No enrollment records for this course.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rosterRows.map((r, idx) => (
                  <li key={String(r.id || idx)} className="py-2.5 text-sm">
                    <p className="font-medium text-slate-900">
                      {String(r.studentFirstName || '').trim()} {String(r.studentLastName || '').trim()}
                    </p>
                    <p className="text-xs text-slate-500">{String(r.studentEmail || '—')}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{String(r.status || '—')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="border-t border-slate-100 px-4 py-3">
            <Button type="button" variant="outline" onClick={() => setRosterOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CourseEnrolledStudentsEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        courseId={emailCourseId}
        courseTitle={emailCourseTitle}
        studentEmails={emailStudentEmails}
        audience="admin"
        loading={emailLoading}
      />

      {courseTab !== 'past' && courseTab !== 'cancelled' && courseTab !== 'manage' && (
        <div className="space-y-4">
          {tabErr ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{tabErr}</p>
          ) : null}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {courseTab === 'vacancies' && 'Vacancy courses'}
                  {courseTab === 'pending' && 'Pending re-assignments'}
                  {courseTab === 'catalog' && 'Full catalog'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {courseTab === 'vacancies' && 'Courses marked short instructor (needs coverage).'}
                  {courseTab === 'pending' && 'Assign-other-course records pending approval.'}
                  {courseTab === 'catalog' && 'All courses returned by the admin list API.'}
                </p>
              </div>
              <input
                className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                placeholder={
                  courseTab === 'pending'
                    ? 'Search student id, course ids, status…'
                    : 'Search city, course, instructor, dates…'
                }
                value={
                  courseTab === 'vacancies'
                    ? tabSurfaceSearch.vacancies
                    : courseTab === 'pending'
                      ? tabSurfaceSearch.pending
                      : tabSurfaceSearch.catalog
                }
                onChange={(e) => {
                  const v = e.target.value
                  if (courseTab === 'vacancies') setTabSurfaceSearch((s) => ({ ...s, vacancies: v }))
                  else if (courseTab === 'pending') setTabSurfaceSearch((s) => ({ ...s, pending: v }))
                  else setTabSurfaceSearch((s) => ({ ...s, catalog: v }))
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {courseTab === 'pending' ? filteredPendingRows.length : filteredVacancyOrCatalogRows.length}
              </span>{' '}
              of {tabRows.length} rows
              {courseTab === 'catalog' ? ' (search applies to loaded list).' : '.'}
            </p>
          </section>
          {courseTab === 'pending' ? (
            <PendingAssignmentsTable
              rows={filteredPendingRows}
              courseLookup={courseLookup}
              emptyText={
                tabRows.length === 0
                  ? 'No pending assign-other-course records.'
                  : 'No rows match your search.'
              }
            />
          ) : (
            courseTable(
              filteredVacancyOrCatalogRows,
              tabRows.length === 0
                ? courseTab === 'vacancies'
                  ? 'No vacancy courses found.'
                  : 'No courses in catalog.'
                : 'No courses match your search.'
            )
          )}
        </div>
      )}

      <AlertDialog
        open={confirmDialog != null}
        onOpenChange={(open) => {
          if (!open && !confirmBusy) setConfirmDialog(null)
        }}
      >
        <AlertDialogContent className="relative border border-slate-200 bg-white p-6 pt-7 shadow-lg sm:max-w-md">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:pointer-events-none disabled:opacity-40"
            onClick={() => !confirmBusy && setConfirmDialog(null)}
            aria-label="Close dialog"
            disabled={confirmBusy}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <AlertDialogHeader className="pr-8 text-left">
            <AlertDialogTitle className="text-slate-900">{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel
              disabled={confirmBusy}
              className="mt-0 border-slate-300 sm:min-w-[6.5rem]"
            >
              Close
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={confirmBusy}
              className={cn(
                'min-w-[7.5rem] font-semibold shadow-sm sm:min-w-[8rem]',
                confirmDialog?.variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#0f172a] text-white hover:bg-[#0d9488]'
              )}
              onClick={() => void runConfirmDialogAction()}
            >
              {confirmBusy ? 'Working…' : (confirmDialog?.confirmLabel ?? 'Confirm')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
