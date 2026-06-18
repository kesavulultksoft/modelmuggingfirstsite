/** Normalize legacy API response to an array of records */
export function legacyAsObjectArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.data)) return legacyAsObjectArray(o.data)
    if (o.handled === false || o.legacyCompat) return []
  }
  return []
}

export function legacyAsRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const o = data as Record<string, unknown>
  if (o.handled === false && o.legacyCompat) return null
  return o
}

/**
 * Normalize Mongo user ids from API JSON (plain string, extended JSON `{ "$oid": "..." }`, etc.).
 * Avoids `[object Object]` in URLs when Jackson serializes BSON ObjectId as a nested object.
 */
export function mongoIdToString(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const t = value.trim()
    return t
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>
    if (typeof o.$oid === 'string') return o.$oid.trim()
    if (typeof o.oid === 'string') return o.oid.trim()
    // Some JSON codecs nest the hex id (extended BSON shapes) — pick a 24-char hex if present.
    try {
      const s = JSON.stringify(value)
      const m = /"([a-fA-F0-9]{24})"/.exec(s)
      if (m) return m[1]
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** `mm_events` / admin table row → 24-char hex for API paths and React state (never `[object Object]`). */
export function coerceMongoIdFromRow(r: Record<string, unknown>): string {
  const a = mongoIdToString(r._id)
  if (/^[a-fA-F0-9]{24}$/.test(a)) return a
  const dum = r.dumId
  if (typeof dum === 'string') {
    const t = dum.trim()
    if (/^[a-fA-F0-9]{24}$/.test(t)) return t
  }
  const b = mongoIdToString(dum)
  return /^[a-fA-F0-9]{24}$/.test(b) ? b : ''
}

/** Coerce React state that should hold a hex id but may have been an object from older API JSON. */
export function mongoHexIdForUiState(id: unknown): string {
  if (typeof id === 'string') {
    const t = id.trim()
    if (/^[a-fA-F0-9]{24}$/.test(t)) return t
    if (t === '[object Object]') return ''
  }
  const s = mongoIdToString(id)
  return /^[a-fA-F0-9]{24}$/.test(s) ? s : ''
}
