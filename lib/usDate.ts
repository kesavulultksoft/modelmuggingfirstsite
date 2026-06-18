/**
 * US client date conventions for this app: display calendar dates as **MM/dd/yyyy**
 * and timestamps as **MM/dd/yyyy h:mm a** (12-hour, local). Prefer these helpers anywhere
 * in the portal or public site instead of `toLocaleDateString()` without a fixed pattern.
 * Internal APIs may still use ISO strings; convert at the UI boundary.
 */

import { format, isValid } from 'date-fns'

export const US_DATE_DISPLAY = 'MM/dd/yyyy'
export const US_DATETIME_DISPLAY = 'MM/dd/yyyy h:mm a'

const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatTimeHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Calendar date in local time → MM/dd/yyyy */
export function formatUsDate(d: Date): string {
  return format(d, US_DATE_DISPLAY)
}

/** Instant → MM/dd/yyyy h:mm a (local) */
export function formatUsDateTime(d: Date): string {
  return format(d, US_DATETIME_DISPLAY)
}

/** Time only, 12-hour (e.g. 5:00 PM), local */
export function formatUsTime12(d: Date): string {
  return format(d, 'h:mm a')
}

/** yyyy-mm-dd (local components) → MM/dd/yyyy */
export function ymdToUs(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return ''
  const y = Number(m[1])
  const mo = Number(m[2])
  const da = Number(m[3])
  const d = new Date(y, mo - 1, da)
  if (!isValid(d) || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return ''
  return format(d, US_DATE_DISPLAY)
}

/** MM/dd/yyyy → yyyy-mm-dd for internal composition, or null if invalid */
/** Local calendar date (yyyy-mm-dd) + time (HH:mm) → ISO string for APIs */
export function localYmdTimeToIso(dateYmd: string, timeHm: string): string {
  const [y, mo, da] = dateYmd.split('-').map((x) => Number(x))
  const [hh, mm] = timeHm.split(':').map((x) => Number(x))
  if (!y || !mo || !da || Number.isNaN(hh) || Number.isNaN(mm)) return ''
  const dt = new Date(y, mo - 1, da, hh, mm, 0, 0)
  return dt.toISOString()
}

/** MM/dd/yyyy + HH:mm → ISO string */
export function usDateAndTimeToIso(usDate: string, timeHm: string): string {
  const ymd = usToYmd(usDate.trim())
  if (!ymd || !timeHm.trim()) return ''
  return localYmdTimeToIso(ymd, timeHm.trim())
}

export function parseStoredDateTimeToUsFields(stored: string): { date: string; time: string } {
  const s = stored.trim()
  if (!s) return { date: '', time: '12:00' }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    return { date: formatUsDate(d), time: formatTimeHm(d) }
  }
  return { date: '', time: '12:00' }
}

export function usToYmd(us: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(us.trim())
  if (!m) return null
  const mo = Number(m[1])
  const da = Number(m[2])
  const y = Number(m[3])
  const d = new Date(y, mo - 1, da)
  if (!isValid(d) || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null
  return `${y}-${pad2(mo)}-${pad2(da)}`
}

/** Normalize a blurred field to MM/dd/yyyy when parseable; otherwise return trimmed raw. */
export function normalizeUsDateBlur(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const ymd = usToYmd(t)
  return ymd ? ymdToUs(ymd) : t
}

/**
 * Instructor CRM / API date fields: MM/dd/yyyy, yyyy-mm-dd, ISO, or Mongo $date → MM/dd/yyyy for portal forms.
 */
export function crmDateFieldToUs(v: unknown): string {
  if (v == null || v === '') return ''
  if (typeof v === 'object' && v !== null && '$date' in v) {
    return mongoDisplayStartToUs(v)
  }
  const s = typeof v === 'string' ? v.trim() : String(v)
  if (!s) return ''
  const fromUs = usToYmd(s)
  if (fromUs) return ymdToUs(fromUs)
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (ymd) return ymdToUs(ymd[0]) || ''
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return formatUsDate(d)
  return s
}

/** Parse Mongo / API displayStartDate field → MM/dd/yyyy for form fields */
export function mongoDisplayStartToUs(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : formatUsDate(d)
  }
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : formatUsDate(d)
  }
  if (typeof v === 'object' && v !== null && '$date' in v) {
    const t = (v as { $date: unknown }).$date
    if (typeof t === 'number' || typeof t === 'string') {
      const d = new Date(t)
      return Number.isNaN(d.getTime()) ? '' : formatUsDate(d)
    }
  }
  return ''
}

export function displayStartTimestampFromUsDateField(usField: string): number | undefined {
  const ymd = usToYmd(usField.trim())
  if (!ymd) return undefined
  const [y, mo, da] = ymd.split('-').map(Number)
  return new Date(y, mo - 1, da, 12, 0, 0, 0).getTime()
}

/** Arrays of session ISO strings (or legacy) → comma-separated US date/time */
export function formatSessionListValue(v: unknown): string {
  if (v == null) return '—'
  if (Array.isArray(v)) {
    const parts = v.map((x) => formatSessionTimestamp(x)).filter((s) => s !== '—')
    return parts.length ? parts.join(', ') : '—'
  }
  return formatSessionTimestamp(v)
}

/** Schedule / ISO-ish string → user-facing US date+time */
export function formatSessionTimestamp(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'object' && value !== null && '$date' in value) {
    const t = (value as { $date: unknown }).$date
    const d = new Date(typeof t === 'number' ? t : String(t))
    if (!Number.isNaN(d.getTime())) return formatUsDateTime(d)
  }
  const s = typeof value === 'string' ? value : String(value)
  const normalized = /\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(' ', 'T') : s
  const d = new Date(normalized)
  if (!Number.isNaN(d.getTime())) return formatUsDateTime(d)
  return s
}

/** First session line for cards: MM/dd/yyyy · h:mm a */
export function formatCourseWhenLabel(sessionStart: string | undefined): string {
  if (!sessionStart?.trim()) return 'Dates TBA'
  const normalized = sessionStart.includes(' ') && !sessionStart.includes('T') ? sessionStart.replace(' ', 'T') : sessionStart
  const d = new Date(normalized)
  if (!Number.isNaN(d.getTime())) {
    return `${format(d, US_DATE_DISPLAY)} · ${format(d, 'h:mm a')}`
  }
  return sessionStart
}

/** California course times are always shown in Pacific, regardless of server/browser TZ. */
export const COURSE_DISPLAY_TIMEZONE = 'America/Los_Angeles'

const pacificDateLongFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: COURSE_DISPLAY_TIMEZONE,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const pacificTime12Fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: COURSE_DISPLAY_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const pacificYmdFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: COURSE_DISPLAY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function parseSessionInstant(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null
  const normalized = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatPacificDateLong(d: Date): string {
  return pacificDateLongFmt.format(d)
}

/** e.g. 8:00 am (legacy-style lowercase meridiem) */
function formatPacificTime12(d: Date): string {
  return pacificTime12Fmt.format(d).replace(/\s(AM|PM)$/i, (_, mer: string) => ` ${mer.toLowerCase()}`)
}

function pacificCalendarDayKey(d: Date): string {
  return pacificYmdFmt.format(d)
}

/**
 * One line per session day, e.g.:
 * Saturday, October 17, 2026 @ 8:00 am - 6:30 pm
 * or cross-day: Saturday, October 17, 2026 @ 8:00 am - Sunday, October 18, 2026 @ 6:30 pm
 */
export function formatCourseSessionLines(sessionStarts: string[] | undefined, sessionEnds: string[] | undefined): string[] {
  const starts = sessionStarts ?? []
  const ends = sessionEnds ?? []
  if (starts.length === 0) return ['Dates TBA']

  const lines: string[] = []
  const n = Math.max(starts.length, ends.length)
  for (let i = 0; i < n; i++) {
    const start = parseSessionInstant(starts[i])
    if (!start) continue
    const end = parseSessionInstant(ends[i])
    if (end) {
      const sameDay = pacificCalendarDayKey(start) === pacificCalendarDayKey(end)
      if (sameDay) {
        lines.push(
          `${formatPacificDateLong(start)} @ ${formatPacificTime12(start)} - ${formatPacificTime12(end)}`,
        )
      } else {
        lines.push(
          `${formatPacificDateLong(start)} @ ${formatPacificTime12(start)} - ${formatPacificDateLong(end)} @ ${formatPacificTime12(end)}`,
        )
      }
    } else {
      lines.push(`${formatPacificDateLong(start)} @ ${formatPacificTime12(start)}`)
    }
  }
  return lines.length ? lines : ['Dates TBA']
}
