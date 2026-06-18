/** Legacy {@code AdminEmail} id — Pre-Class Preparations for Basic Course (roster / 7-day reminder). */
export const LEGACY_PRE_CLASS_TEMPLATE_ID = '5cd028b3e37ac24048b9dbae'

const EMAIL_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_SIMPLE.test(email.trim())
}

function rosterEmailFromRow(r: Record<string, unknown>, emailKey: string): string {
  const keys = [emailKey, 'studentEmail', 'email', 'emailId']
  for (const k of keys) {
    const em = String(r[k] || '').trim().toLowerCase()
    if (em && isValidEmail(em)) return em
  }
  return ''
}

/** Enrollments with a deliverable email (active + completed classes; not cancelled/waitlist). */
export function isActiveEnrollmentStatus(status: unknown): boolean {
  const s = String(status || '').trim().toUpperCase()
  if (!s) return true
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'WAITLIST') return false
  return (
    s === 'REGISTERED' ||
    s === 'COMPLETED' ||
    s === 'PAID' ||
    s === 'ACTIVE' ||
    s === 'ENROLLED'
  )
}

/** REGISTERED (and paid/active) enrollments; deduped, lowercased. */
export function registeredEmailsFromEnrollmentRows(
  rows: Record<string, unknown>[],
  emailKey = 'studentEmail',
): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    if (!isActiveEnrollmentStatus(r.status)) continue
    const em = rosterEmailFromRow(r, emailKey)
    if (em) set.add(em)
  }
  return [...set]
}

export function joinEmailList(emails: string[]): string {
  return emails.join(', ')
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && isValidEmail(s))
}

/** Legacy {@code sendAllEnrolledStudentsEmail}: first student in To, rest in Bcc. */
export function legacyEnrolledStudentRecipients(studentEmails: string[], formTo: string, formBcc: string) {
  const roster = studentEmails.filter(Boolean)
  const manualBcc = parseEmailList(formBcc)
  const to = formTo.trim() || roster[0] || ''
  const rosterBcc = roster.filter((e) => e !== to)
  const bccSet = new Set([...rosterBcc, ...manualBcc])
  return { to, bcc: [...bccSet].join(', ') }
}

export function htmlFromBody(body: string): { text: string; html: string } {
  const trimmed = body.trim()
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed)
  if (looksHtml) {
    const text = trimmed
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
    return { text, html: trimmed }
  }
  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return { text: trimmed, html: escaped }
}

export type EmailTemplateRow = Record<string, unknown>

export function templateLegacyId(row: EmailTemplateRow): string {
  const lid = row.legacyId
  if (typeof lid === 'string' && lid.trim()) return lid.trim()
  const id = row._id
  if (typeof id === 'string') return id
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: string }).$oid)
  return ''
}

export function findEmailTemplateByLegacyId(
  rows: EmailTemplateRow[],
  legacyId: string,
): EmailTemplateRow | undefined {
  const want = legacyId.trim()
  if (!want) return undefined
  return rows.find((r) => templateLegacyId(r) === want)
}

export function templateSubject(row: EmailTemplateRow): string {
  return String(row.subject || '').trim()
}

export function templateBodyHtml(row: EmailTemplateRow): string {
  return String(row.emailBody || row.body || '').trim()
}
