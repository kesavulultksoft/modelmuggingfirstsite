/**
 * Normalize API/Mongo date shapes (ISO strings, extended JSON) for course session arrays.
 */
export function coerceToDate(raw: unknown): Date | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof raw === 'object' && raw !== null && '$date' in raw) {
    const v = (raw as { $date: unknown }).$date
    const d = new Date(typeof v === 'string' || typeof v === 'number' ? v : String(v))
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw
  }
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseSessionStartsDates(course: Record<string, unknown>): Date[] {
  const starts = Array.isArray(course.sessionStarts) ? course.sessionStarts : []
  const out: Date[] = []
  for (const raw of starts) {
    const d = coerceToDate(raw)
    if (d) out.push(d)
  }
  return out
}

/** Earliest session strictly in the future (now is exclusive of past). */
export function earliestFutureSession(course: Record<string, unknown>): Date | null {
  const now = Date.now()
  const dates = parseSessionStartsDates(course)
  let best: Date | null = null
  for (const dt of dates) {
    if (dt.getTime() < now) continue
    if (!best || dt.getTime() < best.getTime()) best = dt
  }
  return best
}

/** Earliest listed session (even if already passed) — for dashboard when no future session exists. */
export function earliestListedSession(course: Record<string, unknown>): Date | null {
  const dates = parseSessionStartsDates(course)
  if (dates.length === 0) return null
  return dates.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b))
}
