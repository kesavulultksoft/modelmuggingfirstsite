import { coerceMongoIdFromRow, mongoIdToString } from '@/lib/legacyHelpers'

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

export function isMongoObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value)
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

/** Plain string or Mongo ObjectId / extended JSON — for state, country, location refs. */
function pickGeoRef(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v == null) continue
    if (typeof v === 'string') {
      const t = v.trim()
      if (t && t !== '[object Object]') return t
      continue
    }
    const id = mongoIdToString(v)
    if (id) return id
  }
  return ''
}

function looksLikeFormattedAddress(value: string): boolean {
  if (!value.includes(',')) return false
  if (/\b\d{5}(-\d{4})?\b/.test(value)) return true
  if (/,\s*[A-Za-z]{2}\s+\d{5}\b/.test(value)) return true
  if (/,\s*(USA|United States|Canada|UK|Australia)\s*$/i.test(value)) return true
  return value.split(',').length >= 3
}

/** Pull a free-text mailing address from common CRM / legacy field names. */
export function pickAddressRaw(row: Record<string, unknown>): string {
  const directKeys = [
    'addressLine',
    'address',
    'street',
    'mailingAddress',
    'homeAddress',
    'contactAddress',
    'parentAddress',
    'facilityAddress',
    'addressLine1',
    'contactAddressSnapshot',
    'mailingAddressSnapshot',
  ]
  for (const key of directKeys) {
    const v = str(row[key])
    if (v && !isMongoObjectId(v)) return v
  }
  const nestedKeys = ['contactAddress', 'mailingAddress', 'addressInfo', 'contactInformationForm']
  for (const key of nestedKeys) {
    const nested = row[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const o = nested as Record<string, unknown>
      const line = [o.address, o.street, o.line1, o.line2, o.addressLine].map(str).filter(Boolean).join(', ')
      if (line) return line
    }
  }
  const loc = str(row.location)
  if (loc && !isMongoObjectId(loc) && looksLikeFormattedAddress(loc)) return loc

  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_')) continue
    if (typeof value === 'string' && looksLikeFormattedAddress(value)) return value
  }
  return ''
}

/** Parse Google-style "street, city, ST 12345, USA" into parts. */
export function parseFormattedAddress(address: string): {
  city: string
  state: string
  country: string
  zipCode: string
} {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length < 2) {
    return { city: '', state: '', country: '', zipCode: '' }
  }

  let country = ''
  let work = [...parts]
  const last = work[work.length - 1]
  if (
    work.length >= 3 &&
    last.length > 2 &&
    !/^\d{5}(-\d{4})?$/.test(last) &&
    !/^[A-Za-z]{2}$/.test(last)
  ) {
    country = last
    work = work.slice(0, -1)
  }

  let state = ''
  let zipCode = ''
  let city = ''

  if (work.length >= 1) {
    const stateSeg = work[work.length - 1]
    const m = stateSeg.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/)
    if (m) {
      state = m[1].trim()
      zipCode = m[2]
    } else if (/^[A-Za-z]{2}$/.test(stateSeg)) {
      state = stateSeg.toUpperCase()
    } else {
      state = stateSeg
    }
    work = work.slice(0, -1)
  }

  if (work.length >= 1) {
    city = work[work.length - 1]
  }

  return { city, state, country, zipCode }
}

function resolveLabel(value: string, labelsById: Record<string, string>): string {
  if (!value) return ''
  if (labelsById[value]) return labelsById[value]
  const lower = value.toLowerCase()
  if (labelsById[lower]) return labelsById[lower]
  return isMongoObjectId(value) ? '' : value
}

export type SubscriberGeo = {
  addressLine: string
  city: string
  stateRegion: string
  country: string
  zipCode: string
}

export function extractSubscriberGeo(
  row: Record<string, unknown>,
  labelsById: Record<string, string> = {},
): SubscriberGeo {
  const addressLine = pickAddressRaw(row)
  const parsed = addressLine ? parseFormattedAddress(addressLine) : { city: '', state: '', country: '', zipCode: '' }

  const city =
    pickString(row, [
      'city',
      'parentCity',
      'cityName',
      'parentCityName',
      'locationCity',
      'parentLocationCity',
      'town',
      'townName',
    ]) || parsed.city

  const stateCandidates = [
    pickString(row, ['stateRegion', 'stateRegionName', 'stateName', 'provinceName']),
    pickString(row, ['locationName']), // backend-resolved state / market region label
    pickGeoRef(row, ['state', 'parentState', 'stateProvince', 'region', 'parentStateRegion', 'parentStateProvince']),
    pickString(row, ['locationState', 'parentLocationState', 'locationRegion', 'parentLocationRegion']),
    pickGeoRef(row, ['location']),
  ]
  let stateRegion = ''
  for (const candidate of stateCandidates) {
    const resolved = resolveLabel(candidate, labelsById)
    if (resolved) {
      stateRegion = resolved
      break
    }
  }
  if (!stateRegion) stateRegion = parsed.state

  const countryCandidates = [
    pickString(row, ['countryName', 'countryShort', 'countryFullName']),
    pickGeoRef(row, ['country', 'parentCountry']),
    pickString(row, ['parentCountryName', 'locationCountry', 'parentLocationCountry']),
  ]
  let country = ''
  for (const candidate of countryCandidates) {
    const resolved = resolveLabel(candidate, labelsById)
    if (resolved) {
      country = resolved
      break
    }
  }
  if (!country) country = parsed.country

  return {
    addressLine,
    city,
    stateRegion,
    country,
    zipCode: pickString(row, ['zipCode', 'zip', 'postalCode', 'parentZipCode']) || parsed.zipCode,
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function profileEmail(row: Record<string, unknown>): string {
  return normalizeEmail(
    pickString(row, [
      'email',
      'emailId',
      'emailAddress',
      'studentEmail',
      'portalUserEmail',
      'parentEmailAddress',
    ]),
  )
}

function subscriberEmail(row: Record<string, unknown>): string {
  return normalizeEmail(
    pickString(row, ['email', 'emailId', 'emailAddress', 'parentEmailAddress']),
  )
}

/** Index instructor / applicant CRM rows by email for subscriber geo backfill. */
export function buildProfileGeoByEmail(
  profiles: Record<string, unknown>[],
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {}
  for (const profile of profiles) {
    const email = profileEmail(profile)
    if (!email) continue
    const address = pickAddressRaw(profile)
    const geo = extractSubscriberGeo(profile, {})
    const patch: Record<string, unknown> = {}
    if (address) {
      patch.address = address
      patch.addressLine = address
    }
    if (geo.city) patch.city = geo.city
    if (geo.stateRegion) {
      patch.state = geo.stateRegion
      patch.locationName = geo.stateRegion
    }
    if (geo.country) {
      patch.country = geo.country
      patch.countryName = geo.country
    }
    if (geo.zipCode) patch.zipCode = geo.zipCode
    const snap = pickString(profile, ['contactAddressSnapshot'])
    if (snap) patch.contactAddressSnapshot = snap
    out[email] = { ...out[email], ...patch }
  }
  return out
}

function isUnresolvedGeoRef(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'object') return Boolean(mongoIdToString(value))
  const s = String(value).trim()
  if (!s || s === '[object Object]') return true
  return isMongoObjectId(s)
}

/** Fill missing city/state/country on subscription rows from CRM profiles (same email). */
export function enrichSubscriberRowsWithProfileGeo(
  rows: Record<string, unknown>[],
  profileByEmail: Record<string, Record<string, unknown>>,
): Record<string, unknown>[] {
  if (!Object.keys(profileByEmail).length) return rows
  return rows.map((row) => {
    const email = subscriberEmail(row) || profileEmail(row)
    const profile = email ? profileByEmail[email] : undefined
    if (!profile) return row
    const merged: Record<string, unknown> = { ...row }
    for (const [key, value] of Object.entries(profile)) {
      if (value == null || String(value).trim() === '') continue
      const existing = merged[key]
      if (isUnresolvedGeoRef(existing)) {
        merged[key] = value
      }
    }
    return merged
  })
}

/** Build id → display label maps from operations location rows. */
export function buildGeoLabelLookup(locationRows: Record<string, unknown>[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of locationRows) {
    const id = coerceMongoIdFromRow(row)
    const label =
      str(row.locationName) || str(row.countryName) || str(row.city) || str(row.state) || str(row.country)
    if (id && label) out[id] = label
    const dumId = str(row.dumId)
    if (dumId && label) out[dumId] = label
  }
  return out
}
