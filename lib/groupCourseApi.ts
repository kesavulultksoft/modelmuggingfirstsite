function baseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
  }
  return process.env.MM_API_URL || process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
}

export type GeoOption = { id: string; name: string }

/** Legacy Mongo country id for United States (geo API). */
export const US_COUNTRY_ID = '5d8379f462a13d16d05a9a33'

export type GroupCourseStudentRow = {
  participantName?: string
  participantParentName?: string
  dm?: string
  participantEmail?: string
  participantPhone?: string
  teenAge?: string
}

export type PreGroupApplicationPayload = {
  firstName: string
  lastName: string
  groupOrAffiliation?: string
  orgEmail: string
  city?: string
  country?: string
  state?: string
  locationName?: string
  coOrganizerName?: string
  coOrgGroupOrAffiliation?: string
  coOrgEmail?: string
  coOrgCountry?: string
  coOrgState?: string
  coOrgCity?: string
  coLocationName?: string
  coOrgPhone?: string
  question1: string
  question2: string
  question3: string
  website?: string
}

export async function fetchGeoCountries(): Promise<GeoOption[]> {
  const res = await fetch(`${baseUrl()}/api/v1/public/geo/countries`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []
  const raw = (await res.json()) as { id?: string; name?: string }[]
  return Array.isArray(raw)
    ? raw.map((r) => ({ id: String(r.id || ''), name: String(r.name || '') })).filter((r) => r.id)
    : []
}

export async function fetchGeoLocations(countryId: string): Promise<GeoOption[]> {
  if (!countryId) return []
  const res = await fetch(
    `${baseUrl()}/api/v1/public/geo/locations?countryId=${encodeURIComponent(countryId)}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!res.ok) return []
  const raw = (await res.json()) as { id?: string; name?: string }[]
  return Array.isArray(raw)
    ? raw.map((r) => ({ id: String(r.id || ''), name: String(r.name || '') })).filter((r) => r.id)
    : []
}

export type GroupCourseApplicationAccess = {
  valid: boolean
  error?: string
  organizationName?: string
  orgEmail?: string
  groupOrAffiliation?: string
  city?: string
  country?: string
  state?: string
  coOrganizerName?: string
  coOrgEmail?: string
  coOrgGroupOrAffiliation?: string
  coOrgPhone?: string
  coOrgCity?: string
  coOrgCountry?: string
  coOrgState?: string
}

export async function fetchGroupCourseApplicationAccess(
  groupCourseId: string,
): Promise<GroupCourseApplicationAccess> {
  const res = await fetch(
    `${baseUrl()}/api/v1/public/group-course-application/access?groupCourseId=${encodeURIComponent(groupCourseId)}`,
    { headers: { Accept: 'application/json' } },
  )
  const data = (await res.json().catch(() => ({}))) as GroupCourseApplicationAccess
  if (!res.ok) {
    return { valid: false, error: data.error || 'Unable to verify application link.' }
  }
  return data
}

export async function submitPreGroupApplication(body: PreGroupApplicationPayload): Promise<Response> {
  return fetch(`${baseUrl()}/api/v1/public/pre-group-application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function submitGroupCourseApplication(
  groupCourseId: string | undefined,
  body: Record<string, unknown>,
  students: GroupCourseStudentRow[],
): Promise<Response> {
  const q = groupCourseId ? `?groupCourseId=${encodeURIComponent(groupCourseId)}` : ''
  return fetch(`${baseUrl()}/api/v1/public/group-course-application${q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...body, listOfStudents: students }),
  })
}
