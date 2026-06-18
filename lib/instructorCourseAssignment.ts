import type { MeUser } from '@/lib/portalApi'

/**
 * Same assignment rules as backend {@code InstructorPortalController#isAssignedToCourse}:
 * primaryInstructorId, ownerUserId, instructorUserIds, or contact email match.
 */
export function isInstructorAssignedToCourseRow(me: MeUser, row: Record<string, unknown>): boolean {
  const linkId = String(me.primaryInstructorId || me.id || '').trim()
  if (!linkId) return false
  const primary = String(row.primaryInstructorId ?? '').trim()
  const owner = String(row.ownerUserId ?? '').trim()
  const contact = String(row.contactEmail ?? '').trim().toLowerCase()
  const meEmail = String(me.email ?? '').trim().toLowerCase()
  const ids = Array.isArray(row.instructorUserIds)
    ? (row.instructorUserIds as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : []
  if (primary === linkId || owner === linkId) return true
  if (ids.includes(linkId)) return true
  if (meEmail && contact && contact === meEmail) return true
  return false
}
