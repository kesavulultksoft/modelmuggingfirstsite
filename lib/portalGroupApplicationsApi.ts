import { API, getToken } from '@/lib/portalApi'

async function adminFetch(path: string, init: RequestInit = {}) {
  const token = getToken()
  const base = API().replace(/\/$/, '')
  const hasJsonBody = init.body !== undefined && init.body !== null && String(init.body).length > 0
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
}

export type GroupAppRow = Record<string, unknown>

export async function fetchAdminPreGroupApplications(): Promise<GroupAppRow[]> {
  const res = await adminFetch('/api/v1/admin/group-applications/pre-group')
  if (!res.ok) return []
  const raw = await res.json()
  return Array.isArray(raw) ? (raw as GroupAppRow[]) : []
}

export async function fetchAdminFullGroupApplications(): Promise<GroupAppRow[]> {
  const res = await adminFetch('/api/v1/admin/group-applications/full')
  if (!res.ok) return []
  const raw = await res.json()
  return Array.isArray(raw) ? (raw as GroupAppRow[]) : []
}

export async function fetchAdminFullGroupApplicationDetail(id: string): Promise<{
  application: GroupAppRow
  students: GroupAppRow[]
} | null> {
  const res = await adminFetch(`/api/v1/admin/group-applications/full/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  const raw = (await res.json()) as { application?: GroupAppRow; students?: GroupAppRow[] }
  return {
    application: raw.application || {},
    students: Array.isArray(raw.students) ? raw.students : [],
  }
}

export async function fetchAdminPreGroupDetail(id: string): Promise<GroupAppRow | null> {
  const res = await adminFetch(`/api/v1/admin/group-applications/pre-group/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  return (await res.json()) as GroupAppRow
}

export async function adminMarkPreGroupQualified(id: string): Promise<Response> {
  return adminFetch(`/api/v1/admin/group-applications/pre-group/${encodeURIComponent(id)}/qualified`, {
    method: 'POST',
  })
}

export async function adminMarkPreGroupNotQualified(id: string): Promise<Response> {
  return adminFetch(`/api/v1/admin/group-applications/pre-group/${encodeURIComponent(id)}/not-qualified`, {
    method: 'POST',
  })
}

export async function adminDeletePreGroup(id: string): Promise<Response> {
  return adminFetch(`/api/v1/admin/group-applications/pre-group/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function adminResendGroupApplicationLink(id: string): Promise<Response> {
  return adminFetch(`/api/v1/admin/group-applications/pre-group/${encodeURIComponent(id)}/resend-link`, {
    method: 'POST',
  })
}
