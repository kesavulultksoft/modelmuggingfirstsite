import type { CourseUserType } from '@/lib/courseRegistration'

export type CourseParticipantDraft = {
  firstName: string
  lastName: string
  email: string
  dob: string
  phone: string
  gender: string
  address: string
  city: string
  state: string
  zipCode: string
}

export type CoursePayerDraft = {
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentCity: string
  parentState: string
  parentCountry: string
}

export function emptyParticipant(): CourseParticipantDraft {
  return {
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    phone: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  }
}

export function emptyPayer(): CoursePayerDraft {
  return {
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentCity: '',
    parentState: '',
    parentCountry: 'USA',
  }
}

export function needsParticipantsStep(ut: CourseUserType | null): boolean {
  return ut != null && ut !== 'UT3'
}

export function needsPayerFields(ut: CourseUserType | null): boolean {
  return ut === 'UT1' || ut === 'UT4'
}

/** How many participant forms to render (legacy caps at 15 forms). */
export function participantFormCount(ut: CourseUserType | null, attendeeCount: number): number {
  if (!ut || ut === 'UT3') return 0
  return Math.max(1, Math.min(15, attendeeCount))
}

export function buildParticipantsList(
  count: number,
  existing: CourseParticipantDraft[],
): CourseParticipantDraft[] {
  const n = Math.max(1, Math.min(15, count))
  const out: CourseParticipantDraft[] = []
  for (let i = 0; i < n; i++) {
    out.push({ ...emptyParticipant(), ...(existing[i] ?? {}) })
  }
  return out
}

export function participantSlotLabel(ut: CourseUserType, index: number): string {
  if (ut === 'UT2' && index === 0) {
    return 'You (parent/guardian attending)'
  }
  if (ut === 'UT1' || ut === 'UT4') {
    return `Student ${index + 1}`
  }
  return `Attendee ${index + 1}`
}

export function validateParticipants(
  ut: CourseUserType,
  participants: CourseParticipantDraft[],
  expectedCount?: number,
): string | null {
  const expected = expectedCount ?? participants.length
  if (participants.length !== expected) {
    return `Please complete all ${expected} student forms (you entered ${participants.length}).`
  }
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i]
    const label = participantSlotLabel(ut, i)
    if (!p.firstName.trim() || !p.lastName.trim()) {
      return `${label}: first and last name are required.`
    }
    if (!p.dob.trim()) {
      return `${label}: date of birth is required.`
    }
    if (!p.gender.trim()) {
      return `${label}: gender is required.`
    }
    if (!p.address.trim() || !p.city.trim() || !p.state.trim() || !p.zipCode.trim()) {
      return `${label}: full address is required.`
    }
    const zip = p.zipCode.replace(/\D/g, '')
    if (zip.length < 5) {
      return `${label}: enter a valid ZIP code.`
    }
  }
  return null
}
