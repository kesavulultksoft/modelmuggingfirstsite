import type { GroupAppRow } from '@/lib/portalGroupApplicationsApi'

const MONGO_ID = /^[a-fA-F0-9]{24}$/

export function isMongoObjectId(value: string): boolean {
  return MONGO_ID.test(value.trim())
}

function rawField(row: GroupAppRow, key: string): string {
  const v = row[key]
  if (v == null) return ''
  if (typeof v === 'object' && v !== null) {
    if ('$oid' in v) return String((v as { $oid: string }).$oid).trim()
    if ('oid' in v) return String((v as { oid: string }).oid).trim()
  }
  const s = String(v).trim()
  return s && s !== '[object Object]' ? s : ''
}

function resolveLabel(value: string, geoLabels: Record<string, string>): string {
  if (!value) return ''
  if (geoLabels[value]) return geoLabels[value]
  if (!isMongoObjectId(value)) return value
  return geoLabels[value] || value
}

/** Prefer resolved *Name fields; fall back to ID fields via geo lookup map. */
export function geoDisplayField(
  row: GroupAppRow,
  geoLabels: Record<string, string>,
  nameKeys: string[],
  idKeys: string[],
): string {
  for (const key of nameKeys) {
    const v = rawField(row, key)
    if (!v) continue
    if (geoLabels[v]) return geoLabels[v]
    if (!isMongoObjectId(v)) return v
  }
  for (const key of idKeys) {
    const id = rawField(row, key)
    if (!id) continue
    const resolved = resolveLabel(id, geoLabels)
    if (resolved) return resolved
  }
  return '—'
}

export async function buildGroupCourseGeoLabelMap(): Promise<Record<string, string>> {
  const { fetchGeoCountries, fetchGeoLocations, US_COUNTRY_ID } = await import('@/lib/groupCourseApi')
  const labels: Record<string, string> = {}
  const countries = await fetchGeoCountries()
  for (const c of countries) {
    if (c.id) labels[c.id] = c.name
  }
  const usLocations = await fetchGeoLocations(US_COUNTRY_ID)
  for (const l of usLocations) {
    if (l.id) labels[l.id] = l.name
  }
  return labels
}
