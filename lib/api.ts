import type { CourseDTO } from './types'

function baseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
  }
  return process.env.MM_API_URL || process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
}

async function safeFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(8000),
    })
    return res
  } catch {
    return null
  }
}

export async function fetchUpcomingCourses(): Promise<CourseDTO[]> {
  const res = await safeFetch(`${baseUrl()}/api/v1/courses/upcoming`, {
    next: { revalidate: 120 },
    headers: { Accept: 'application/json' },
  })
  if (!res?.ok) return []
  return res.json()
}

export async function checkPortalEmailExists(email: string): Promise<boolean> {
  const res = await safeFetch(`${baseUrl()}/api/v1/auth/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  if (!res?.ok) return false
  const data = (await res.json().catch(() => ({}))) as { exists?: boolean }
  return Boolean(data.exists)
}

export async function fetchCourse(id: string): Promise<CourseDTO | null> {
  const res = await safeFetch(`${baseUrl()}/api/v1/courses/${id}`, {
    next: { revalidate: 120 },
    headers: { Accept: 'application/json' },
  })
  if (!res?.ok) return null
  return res.json()
}

export async function fetchLocations(): Promise<string[]> {
  const res = await safeFetch(`${baseUrl()}/api/v1/locations`, {
    next: { revalidate: 600 },
    headers: { Accept: 'application/json' },
  })
  if (!res?.ok) return []
  return res.json()
}

export type ContactInquiryPayload = {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  /** Leave empty — anti-spam honeypot */
  website?: string
}

/** Public marketing contact — POST /api/v1/public/contact (no auth). */
export async function submitContactInquiry(body: ContactInquiryPayload): Promise<Response> {
  return fetch(`${baseUrl()}/api/v1/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
}
