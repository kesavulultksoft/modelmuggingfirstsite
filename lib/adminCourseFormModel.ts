import type { AdminCourseWritePayload } from '@/lib/portalApi'
import {
  formatTimeHm,
  formatUsDate,
  formatUsDateTime,
  localYmdTimeToIso,
  parseStoredDateTimeToUsFields,
  usDateAndTimeToIso,
  usToYmd,
} from '@/lib/usDate'

export { localYmdTimeToIso, usToYmd }
import { formatUsPhoneInput, isValidUsPhone10 } from '@/lib/phoneUs'

export { formatUsDateTime }

/** Same values as legacy `static/admin/adminCourse.html` (City webpage dropdown). */
export const LEGACY_CITY_WEBPAGE_OPTIONS: { value: string; label: string }[] = [
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

export const COURSE_TYPE_OPTIONS = ['Basic', 'Advance'] as const
export const fieldClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900'

export type SessionSlot = {
  id: string
  date: string
  startTime: string
  endTime: string
}

export function newSlotId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createSessionSlot(overrides?: Partial<Omit<SessionSlot, 'id'>> & { id?: string }): SessionSlot {
  return {
    id: overrides?.id ?? newSlotId(),
    date: overrides?.date ?? '',
    startTime: overrides?.startTime ?? '09:00',
    endTime: overrides?.endTime ?? '17:00',
  }
}

export function slotsFromSessionArrays(starts: string[], ends: string[]): SessionSlot[] {
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

export function buildSessionPayload(slots: SessionSlot[]): { starts: string[]; ends: string[] } {
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

export function validateSessionSlots(slots: SessionSlot[]): string | null {
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

export type CourseFormState = {
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

export type InstructorOption = { id: string; name: string; linkId: string }

export function courseRecordId(c: Record<string, unknown>): string {
  const raw = c.id ?? c._id
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'object' && raw !== null) {
    const rec = raw as Record<string, unknown>
    if (typeof rec.$oid === 'string' && rec.$oid.trim()) return rec.$oid.trim()
    if (typeof rec.oid === 'string' && rec.oid.trim()) return rec.oid.trim()
    if (typeof rec.hexString === 'string' && rec.hexString.trim()) return rec.hexString.trim()
    const j = JSON.stringify(rec)
    const m = j.match(/"([a-f0-9]{24})"/i)
    if (m) return m[1]
  }
  return ''
}

export function courseFormFromRecord(c: Record<string, unknown>, instructors: InstructorOption[]): CourseFormState {
  const starts = Array.isArray(c.sessionStarts) ? (c.sessionStarts as unknown[]).map((x) => String(x)) : []
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
    id: courseRecordId(c),
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

export function emptyCourseForm(): CourseFormState {
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

export function collectCourseFormErrors(form: CourseFormState): string[] {
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

export function buildAdminCourseWritePayload(form: CourseFormState): AdminCourseWritePayload {
  const { starts, ends } = buildSessionPayload(form.sessionSlots)
  const gradIso = usDateAndTimeToIso(form.graduationDate, form.graduationTime)
  const decisionIso = usDateAndTimeToIso(form.decisionDate, form.decisionTime)
  let displayStart: number | undefined
  if (starts.length > 0 && starts[0]) displayStart = new Date(starts[0]).getTime()
  else if (gradIso) displayStart = new Date(gradIso).getTime()
  const primary = form.primaryInstructorUserId.trim()
  const coIds = form.coInstructorIds.filter((id) => id && id !== primary)
  return {
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
}
