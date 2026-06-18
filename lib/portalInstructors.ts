import type { InstructorOption } from '@/lib/adminCourseFormModel'

export function mapPortalInstructors(rows: Record<string, unknown>[]): InstructorOption[] {
  return rows.map((r) => {
    const id = String(r.id || '')
    const fn = String(r.firstName || '')
    const ln = String(r.lastName || '')
    const name = `${fn} ${ln}`.trim() || String(r.email || id)
    const linkId = String(r.primaryInstructorId || id)
    return { id, name, linkId }
  })
}

export function buildInstructorNameLookupFromPortal(instructors: InstructorOption[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const i of instructors) {
    if (i.linkId) m.set(i.linkId, i.name)
    if (i.id) m.set(i.id, i.name)
  }
  return m
}

export function buildInstructorNameLookupFromAdminUsers(users: Record<string, unknown>[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const hit of users) {
    const id = String(hit.id ?? '').trim()
    const pid = String(hit.primaryInstructorId ?? '').trim()
    const fn = String(hit.firstName ?? '').trim()
    const ln = String(hit.lastName ?? '').trim()
    const name = `${fn} ${ln}`.trim() || String(hit.email ?? id)
    if (id) m.set(id, name)
    if (pid) m.set(pid, name)
  }
  return m
}

export function instructorDisplayName(lookup: Map<string, string>, linkOrUserId: unknown): string {
  const id = String(linkOrUserId ?? '').trim()
  if (!id) return '—'
  return lookup.get(id) || id
}

export function buildInstructorNameLookupFromCrmRows(rows: Record<string, unknown>[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) {
    const id = String(r._id ?? r.id ?? '').trim()
    if (!id) continue
    const fn = String(r.firstName ?? '').trim()
    const ln = String(r.lastName ?? '').trim()
    const name = `${fn} ${ln}`.trim() || String(r.email ?? id)
    m.set(id, name)
  }
  return m
}

export function mergeInstructorNameLookups(...lookups: Map<string, string>[]): Map<string, string> {
  const out = new Map<string, string>()
  for (const lookup of lookups) {
    for (const [k, v] of lookup) out.set(k, v)
  }
  return out
}
