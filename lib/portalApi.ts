import { emitInstructorCrmProfileChanged } from './instructorCrmProfileSync'

export const API = () =>
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
    : process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'

function apiFallbackUrl(base: string): string | null {
  try {
    const u = new URL(base)
    if (u.hostname === '127.0.0.1') {
      u.hostname = 'localhost'
      return u.toString().replace(/\/$/, '')
    }
    if (u.hostname === 'localhost') {
      u.hostname = '127.0.0.1'
      return u.toString().replace(/\/$/, '')
    }
    return null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mm_token')
}

export function setToken(t: string | null) {
  if (typeof window === 'undefined') return
  if (t) localStorage.setItem('mm_token', t)
  else localStorage.removeItem('mm_token')
}

export type MeUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  userType?: string | null
  primaryInstructorId?: string | null
  /** INSTRUCTOR only: CRM row converted (Completed / becameInstructorDate); applicants are false or omitted. */
  activeInstructor?: boolean | null
  /** Portal account phone ({@code mm_users.phone}), when set. */
  phone?: string | null
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken()
  const base = API().replace(/\/$/, '')
  const hasJsonBody =
    init.body !== undefined && init.body !== null && String(init.body).length > 0
  const requestInit: RequestInit = {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  }
  try {
    return await fetch(`${base}${path}`, requestInit)
  } catch {
    const fallback = apiFallbackUrl(base)
    if (fallback) {
      try {
        return await fetch(`${fallback}${path}`, requestInit)
      } catch {
        // Fall through to synthetic error response.
      }
    }
    return new Response(
      JSON.stringify({
        error: 'Failed to reach API server',
        apiBase: base,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/** Authenticated GET returning JSON or throwing with response body. */
export async function authFetchJson<T = unknown>(path: string): Promise<T> {
  const res = await authFetch(path)
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return res.json() as Promise<T>
}

/** Session key set after successful public trainer lead submit (cleared after successful instructor register). */
export const MM_TRAINER_LEAD_TOKEN_KEY = 'mm_trainer_lead_token'

/** Public — Option C short lead from /apply/trainer (no JWT). */
export async function submitTrainerLead(body: {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender?: string
  locationIntent?: string
  notes?: string
  /** Honeypot — leave blank */
  website?: string
}): Promise<{ ok: boolean; leadToken?: string }> {
  const base = API().replace(/\/$/, '')
  const res = await fetch(`${base}/api/v1/public/trainer-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; leadToken?: string }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Could not save your request')
  }
  return { ok: Boolean(data.ok), leadToken: data.leadToken }
}

export async function fetchTrainerApplication(): Promise<Record<string, unknown>> {
  const res = await authFetch('/api/v1/instructor/trainer-application')
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function patchTrainerApplication(
  questionnairePatch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await authFetch('/api/v1/instructor/trainer-application', {
    method: 'PATCH',
    body: JSON.stringify(questionnairePatch),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return res.json() as Promise<Record<string, unknown>>
}

/** Single-page public instructor signup (email verification required before login). */
export async function submitPublicInstructorSignup(body: {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  locationIntent?: string
  notes?: string
  password: string
  agreedTerms: boolean
  website?: string
}): Promise<{ ok: boolean; message?: string }> {
  const base = API().replace(/\/$/, '')
  const res = await fetch(`${base}/api/v1/public/instructor-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string }
  if (!res.ok) {
    throw new Error(data.error || 'Could not create your account')
  }
  return { ok: Boolean(data.ok), message: data.message }
}

export type VerifyEmailAuthResponse = {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  user: MeUser
  verificationRequired?: boolean
  redirectPath?: string | null
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailAuthResponse> {
  const base = API().replace(/\/$/, '')
  const res = await fetch(`${base}/api/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<VerifyEmailAuthResponse>
  if (!res.ok) {
    throw new Error(data.error || 'Verification failed')
  }
  return data as VerifyEmailAuthResponse
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const base = API().replace(/\/$/, '')
  const res = await fetch(`${base}/api/v1/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || 'Could not resend email')
  }
}

export async function fetchAdminTrainerPortalApplications(): Promise<Record<string, unknown>[]> {
  return authFetchJson<Record<string, unknown>[]>('/api/v1/admin/trainer-applications')
}

export async function fetchAdminTrainerPortalApplication(userId: string): Promise<Record<string, unknown>> {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/admin/trainer-applications/${encodeURIComponent(userId)}`,
  )
}

// --- Admin CRM (replaces legacy gateway ops) ---

export async function fetchAdminCrmOperations(
  dataset: 'locations' | 'library' | 'donations' | 'inventory' | 'email-history' | 'testimonials',
  type?: string
) {
  const q = type ? `?type=${encodeURIComponent(type)}` : ''
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/operations/${dataset}${q}`)
}

export async function fetchAdminCrmStudents() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/students')
}

export async function fetchAdminCrmStudentRegistrations() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/student-registrations')
}

export async function fetchAdminCrmSubscriptions(type?: string) {
  const q = type ? `?type=${encodeURIComponent(type)}` : ''
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/subscriptions${q}`)
}

/** Named admin CRM table (Mongo-backed; empty if collection unused). */
export async function fetchAdminCrmTable(key: string) {
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/tables/${encodeURIComponent(key)}`)
}

export async function createAdminEmailTemplate(
  bucket: 'email-templates' | 'email-new-templates',
  body: Record<string, unknown>
) {
  return authFetch(`/api/v1/admin/crm/templates/${encodeURIComponent(bucket)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminEmailTemplate(
  bucket: 'email-templates' | 'email-new-templates',
  id: string,
  body: Record<string, unknown>
) {
  return authFetch(`/api/v1/admin/crm/templates/${encodeURIComponent(bucket)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminInstructorPayments() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/instructor-payments')
}

export async function saveAdminInstructorPayment(body: {
  instructorId: string
  instructorName?: string
  courseId?: string
  amount: number
  paymentDate: string
  note?: string
}) {
  return authFetch('/api/v1/admin/crm/instructor-payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminTshirtOrders(completed: boolean) {
  return authFetchJson<unknown[]>(
    `/api/v1/admin/crm/tshirt-orders?completed=${completed ? 'true' : 'false'}`
  )
}

export type AdminTshirtItemAggregate = {
  name: string
  small: number
  medium: number
  large: number
  Xl: number
  xxl: number
}

export async function fetchAdminTshirtOrdersByItem(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams()
  if (fromDate?.trim()) params.set('fromDate', fromDate.trim())
  if (toDate?.trim()) params.set('toDate', toDate.trim())
  const q = params.toString()
  return authFetchJson<AdminTshirtItemAggregate[]>(
    `/api/v1/admin/crm/tshirt-orders/by-item${q ? `?${q}` : ''}`
  )
}

export async function completeAdminTshirtOrder(orderId: string) {
  return authFetch(`/api/v1/admin/crm/tshirt-orders/${orderId}/complete`, {
    method: 'POST',
  })
}

export async function deleteAdminTshirtOrder(orderId: string) {
  return authFetch(`/api/v1/admin/crm/tshirt-orders/${orderId}`, { method: 'DELETE' })
}

/** Legacy {@code TShirtPriceAdmin} document (newest) — instructor portal uses the same catalog. */
export async function fetchAdminTshirtPriceCatalog() {
  return authFetchJson<Record<string, unknown>>('/api/v1/admin/crm/tshirt-price-catalog')
}

export async function saveAdminTshirtPriceCatalog(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/tshirt-price-catalog', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminTrainerApplicants(archived: boolean) {
  return authFetchJson<unknown[]>(
    `/api/v1/admin/crm/trainer-applicants?archived=${archived ? 'true' : 'false'}`
  )
}

/** Read-only: applicant-submitted payload for one pipeline column (admin). `userId` may be portal user id or trainer row id (`dumId` / `_id`). */
export async function fetchAdminTrainerApplicantSubmission(userId: string, stage: string) {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/admin/crm/trainer-applicant/${encodeURIComponent(userId)}/submission?stage=${encodeURIComponent(stage)}`
  )
}

/** Legacy admin instructor roster: completed pipeline only (`mm_instructors`). */
export async function fetchAdminCompletedInstructors(archived: boolean) {
  return authFetchJson<unknown[]>(
    `/api/v1/admin/crm/completed-instructors?archived=${archived ? 'true' : 'false'}`
  )
}

export async function fetchAdminCompletedInstructorDetail(id: string) {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/admin/crm/completed-instructors/${encodeURIComponent(id)}`
  )
}

export type ExpenseCatalogItem = {
  _id?: string
  dumId?: string
  name?: string
  type?: string
  label?: string
}

export async function fetchAdminExpenseCatalog() {
  return authFetchJson<ExpenseCatalogItem[]>('/api/v1/admin/crm/expense-catalog')
}

export async function createAdminExpenseCatalogItem(body: { name: string; type: string }) {
  return authFetch('/api/v1/admin/crm/expense-catalog', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminExpenseCatalogItem(
  id: string,
  body: { name: string; type: string }
) {
  return authFetch(`/api/v1/admin/crm/expense-catalog/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminExpenseCatalogItem(id: string) {
  return authFetch(`/api/v1/admin/crm/expense-catalog/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export type InventoryCatalogItem = {
  _id?: string
  dumId?: string
  name?: string
  description?: string
  inventoryCategoryId?: string
  venderDescription?: string
  label?: string
}

export type InventoryCategoryItem = {
  _id?: string
  dumId?: string
  inventoryType?: string
  name?: string
}

export async function fetchAdminInventoryCatalog() {
  return authFetchJson<InventoryCatalogItem[]>('/api/v1/admin/crm/inventory-catalog')
}

export async function createAdminInventoryCatalogItem(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/inventory-catalog', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminInventoryCatalogItem(id: string, body: Record<string, unknown>) {
  return authFetch(`/api/v1/admin/crm/inventory-catalog/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminInventoryCatalogItem(id: string) {
  return authFetch(`/api/v1/admin/crm/inventory-catalog/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminInventoryCategories() {
  return authFetchJson<InventoryCategoryItem[]>('/api/v1/admin/crm/inventory-categories')
}

export async function createAdminInventoryCategory(body: { inventoryType: string }) {
  return authFetch('/api/v1/admin/crm/inventory-categories', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminInventoryCategory(id: string, body: { inventoryType: string }) {
  return authFetch(`/api/v1/admin/crm/inventory-categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminInventoryCategory(id: string) {
  return authFetch(`/api/v1/admin/crm/inventory-categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export type EmailHistoryRow = {
  _id?: string
  dumId?: string
  sentDate?: string
  sentOn?: string
  fromEmail?: string
  toEmails?: string
  subject?: string
  emailType?: string
  sentByName?: string
  sentByRole?: string
  recipientCount?: number
  status?: string
  transportOk?: boolean
  emailBody?: string
  ccEmails?: string
  bccEmails?: string
}

export async function fetchAdminEmailHistory() {
  return authFetchJson<EmailHistoryRow[]>('/api/v1/admin/crm/email/history')
}

export async function fetchAdminEmailHistoryDetail(id: string) {
  return authFetchJson<EmailHistoryRow>(`/api/v1/admin/crm/email/history/${encodeURIComponent(id)}`)
}

/** Instructor: outbound emails this user sent (legacy getMyEmailHistory — sentBy). */
export async function fetchInstructorEmailHistory() {
  return authFetchJson<EmailHistoryRow[]>('/api/v1/instructor/crm/email/history')
}

export async function fetchInstructorEmailHistoryDetail(id: string) {
  return authFetchJson<EmailHistoryRow>(
    `/api/v1/instructor/crm/email/history/${encodeURIComponent(id)}`
  )
}

export type PortalDocumentSection =
  | 'library'
  | 'training'
  | 'general'
  | 'application'
  | 'health'
  | 'marketing'
  | 'presentation'

export type PortalDocumentRow = {
  _id?: string
  dumId?: string
  displayTitle?: string
  name?: string
  applicationName?: string
  materialName?: string
  presentationName?: string
  presentationSubName?: string
  type?: string
  emailType?: string
  materialType?: string
  documentType?: string
  docType?: string
  createdDate?: string
  updatedAt?: string
  byAdmin?: string
  hasAttachment?: boolean
  downloadUrl?: string
  link?: string
  url?: string
  videoName?: string
  status?: string
}

export async function fetchAdminPortalDocuments(section: PortalDocumentSection) {
  return authFetchJson<PortalDocumentRow[]>(
    `/api/v1/admin/crm/documents/${encodeURIComponent(section)}`
  )
}

export async function fetchInstructorPortalDocuments(section: PortalDocumentSection) {
  return authFetchJson<PortalDocumentRow[]>(
    `/api/v1/instructor/crm/documents/${encodeURIComponent(section)}`
  )
}

export async function createAdminPortalDocument(
  section: PortalDocumentSection,
  body: Record<string, unknown>
) {
  return authFetch(`/api/v1/admin/crm/documents/${encodeURIComponent(section)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function uploadAdminPortalDocument(
  section: PortalDocumentSection,
  file: File,
  fields: Record<string, string> = {}
) {
  const base = API().replace(/\/$/, '')
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  for (const [k, v] of Object.entries(fields)) {
    if (v.trim()) fd.append(k, v.trim())
  }
  return fetch(`${base}/api/v1/admin/crm/documents/${encodeURIComponent(section)}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
}

export async function deleteAdminPortalDocument(section: PortalDocumentSection, id: string) {
  return authFetch(`/api/v1/admin/crm/documents/${encodeURIComponent(section)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export type LiabilityHealthRow = {
  _id?: string
  dumId?: string
  courseId?: string
  courseName?: string
  locationName?: string
  courseStartDate?: string
  courseEndDate?: string
  createdDate?: string
  trainerName?: string
  instructorName?: string
  signature?: string
  liabilityDate?: string
  hasAttachment?: boolean
  address?: string
  city?: string
  state?: string
  zipCode?: string
  dob?: string
  contactNumber?: string
  submissionCount?: number
}

export async function fetchInstructorLiabilityHealth() {
  return authFetchJson<LiabilityHealthRow[]>('/api/v1/instructor/crm/liability-health')
}

export async function postInstructorLiabilityHealth(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/liability-health', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function uploadInstructorLiabilityHealthFile(file: File, courseId?: string) {
  const base = API().replace(/\/$/, '')
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  if (courseId?.trim()) fd.append('courseId', courseId.trim())
  return fetch(`${base}/api/v1/instructor/crm/liability-health/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
}

export async function downloadInstructorLiabilityHealthFile(id: string, fallbackName?: string) {
  const res = await authFetch(`/api/v1/instructor/crm/liability-health/${encodeURIComponent(id)}/file`)
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let name = fallbackName || 'LiabilityFormDocument.pdf'
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
    if (m?.[1]) name = decodeURIComponent(m[1].trim())
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export async function deleteInstructorLiabilityHealth(id: string) {
  return authFetch(`/api/v1/instructor/crm/liability-health/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminLiabilityCourses() {
  return authFetchJson<LiabilityHealthRow[]>('/api/v1/admin/crm/liability-health/courses')
}

export async function fetchAdminLiabilityHealth(courseId?: string) {
  const q = courseId?.trim() ? `?courseId=${encodeURIComponent(courseId.trim())}` : ''
  return authFetchJson<LiabilityHealthRow[]>(`/api/v1/admin/crm/liability-health${q}`)
}

export async function deleteAdminLiabilityHealth(id: string) {
  return authFetch(`/api/v1/admin/crm/liability-health/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function downloadAdminLiabilityHealthFile(id: string, fallbackName?: string) {
  const res = await authFetch(`/api/v1/admin/crm/liability-health/${encodeURIComponent(id)}/file`)
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let name = fallbackName || 'LiabilityFormDocument.pdf'
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
    if (m?.[1]) name = decodeURIComponent(m[1].trim())
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadPortalDocumentFile(
  scope: 'admin' | 'instructor',
  section: string,
  id: string,
  fallbackName?: string
) {
  const base =
    scope === 'admin' ? '/api/v1/admin/crm/documents' : '/api/v1/instructor/crm/documents'
  const res = await authFetch(`${base}/${encodeURIComponent(section)}/${encodeURIComponent(id)}/file`)
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let name = fallbackName || 'document'
  if (cd) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd)
    if (m?.[1]) name = decodeURIComponent(m[1].trim())
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Read-only: questions, answers (all interviewers), comments — for admin trainer review. */
export async function fetchAdminTrainerInterviewReview(applicantId: string) {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/admin/crm/trainer/${encodeURIComponent(applicantId)}/interview-review`
  )
}

export async function postAdminEmailSend(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/email/send', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Legacy AdminEmail _id → subject/body from {@code mm_email_templates}. */
export async function fetchAdminEmailTemplateByLegacyId(legacyId: string) {
  const res = await authFetch(
    `/api/v1/admin/crm/email-templates/legacy/${encodeURIComponent(legacyId)}`,
  )
  if (!res.ok) return null
  return res.json() as Promise<Record<string, unknown>>
}

export async function fetchInstructorEmailTemplateByLegacyId(legacyId: string) {
  const res = await authFetch(
    `/api/v1/instructor/crm/email-templates/legacy/${encodeURIComponent(legacyId)}`,
  )
  if (!res.ok) return null
  return res.json() as Promise<Record<string, unknown>>
}

/** Pre-class email template with course placeholders merged (legacy CourseServiceImpl). */
export async function fetchAdminPreClassEmail(courseId: string) {
  const res = await authFetch(
    `/api/v1/admin/courses/${encodeURIComponent(courseId)}/pre-class-email`,
  )
  if (!res.ok) return null
  return res.json() as Promise<{ subject?: string; html?: string; text?: string; emailBody?: string }>
}

export async function fetchInstructorPreClassEmail(courseId: string) {
  const res = await authFetch(
    `/api/v1/instructor/courses/${encodeURIComponent(courseId)}/pre-class-email`,
  )
  if (!res.ok) return null
  return res.json() as Promise<{ subject?: string; html?: string; text?: string; emailBody?: string }>
}

export async function postAdminEmailBroadcast(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/email/broadcast', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function postAdminEmailToCourse(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/email/course', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function postAdminEmailToStudent(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/email/student', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminInterviewCandidates() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/interview-candidates')
}

export async function fetchAdminInterviewers() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/interviewers')
}

export async function fetchAdminInterviewQuestions() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/interview-questions')
}

export async function createAdminInterviewQuestion(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/interview-questions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminInterviewQuestion(id: string, body: Record<string, unknown>) {
  return authFetch(`/api/v1/admin/crm/interview-questions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminInterviewQuestion(id: string) {
  return authFetch(`/api/v1/admin/crm/interview-questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminBackgroundVerifications(tab: 'pending' | 'approved' | 'rejected') {
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/background-verifications?tab=${tab}`)
}

/** Portal users with role BGAGENT (background investigators / contractors). */
export async function fetchAdminBgAgentUsers() {
  return authFetchJson<unknown[]>('/api/v1/admin/crm/tables/bg-agents')
}

export async function fetchAdminInstructorExpenseDocs(status: 'pending' | 'approved' | 'rejected') {
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/instructor-expense-docs?status=${status}`)
}

export async function fetchAdminExpensePools(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return authFetchJson<unknown[]>(`/api/v1/admin/crm/expense-pools${q}`)
}

export async function updateAdminExpensePoolStatus(id: string, status: string, adminNote?: string) {
  return authFetch(`/api/v1/admin/crm/expense-pools/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote }),
  })
}

export async function createAdminEvent(body: Record<string, unknown>) {
  return authFetch('/api/v1/admin/crm/events', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminEvent(id: string, body: Record<string, unknown>) {
  return authFetch(`/api/v1/admin/crm/events/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminEvent(id: string) {
  return authFetch(`/api/v1/admin/crm/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function createInstructorEvent(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/events', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateInstructorEvent(id: string, body: Record<string, unknown>) {
  return authFetch(`/api/v1/instructor/crm/events/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteInstructorEvent(id: string) {
  return authFetch(`/api/v1/instructor/crm/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export type TrainerActionKind =
  | 'APPLICATION'
  | 'INTERVIEW'
  | 'BG'
  | 'PHYSICAL'
  | 'EQUIPMENT'
  | 'TRAVEL'
  | 'TSHIRT'
  | 'BASIC_COURSE'
  | 'EXPENSE_POOL'
  | 'ARCHIVE'
  | 'ASSIGN_INTERVIEWER'
  | 'SCHEDULE_INTERVIEW'
  | 'INTERVIEW_TRACKER'
  | 'CONVERT_TO_INSTRUCTOR'
  | 'REJECT_AND_RESET'

export async function postAdminTrainerAction(body: {
  kind: TrainerActionKind
  trainerId?: string
  userId?: string
  status?: string
  qualifyNote?: string
  isArchived?: boolean
  interviewerIds?: string[]
  interviewDate?: string
}) {
  return authFetch('/api/v1/admin/crm/trainer-actions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// --- Instructor CRM ---

export async function fetchInstructorCrmProfile() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/profile')
}

export async function updateInstructorCrmProfile(body: Record<string, unknown>) {
  const res = await authFetch('/api/v1/instructor/crm/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (res.ok && typeof window !== 'undefined') {
    emitInstructorCrmProfileChanged()
  }
  return res
}

export async function fetchInstructorCrmView(view: string) {
  return authFetchJson<unknown[]>(`/api/v1/instructor/crm/views/${encodeURIComponent(view)}`)
}

export async function fetchInstructorInterviewQuestions() {
  return authFetchJson<unknown[]>('/api/v1/instructor/crm/interview/questions')
}

export async function fetchInstructorInterviewAnswers(applicantId: string) {
  return authFetchJson<unknown[]>(`/api/v1/instructor/crm/interview/answers/${encodeURIComponent(applicantId)}`)
}

export async function saveInstructorInterviewAnswers(body: {
  applicantId: string
  finalSubmission?: boolean
  answers: { questionId: string; answer: string; displayOrder?: number; scheduleDate?: string }[]
}) {
  return authFetch('/api/v1/instructor/crm/interview/answers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function saveInstructorInterviewComment(body: {
  applicantId: string
  instructorComment?: string
  recommendedApproval?: string
}) {
  return authFetch('/api/v1/instructor/crm/interview/comment', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorInterviewComment(applicantId: string) {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/instructor/crm/interview/comment/${encodeURIComponent(applicantId)}`
  )
}

export async function fetchInstructorDocumentLists() {
  return authFetchJson<Record<string, unknown[]>>('/api/v1/instructor/crm/document-lists')
}

export async function fetchInstructorEquipmentMeasurement() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/equipment-measurement')
}

export async function fetchInstructorTravelInfo() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/travel-info')
}

export async function updateInstructorEquipmentMeasurement(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/equipment-measurement', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateInstructorTravelInfo(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/travel-info', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorPhysicalVerification() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/physical-verification')
}

export async function updateInstructorPhysicalVerification(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/physical-verification', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorTshirtOrders() {
  return authFetchJson<unknown[]>('/api/v1/instructor/crm/tshirt-orders')
}

export async function fetchInstructorTshirtPriceCatalog() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/tshirt-price-catalog')
}

export async function fetchInstructorTshirtShippingPreview() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/tshirt-shipping-preview')
}

export async function fetchInstructorTshirtOrderDraft() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/tshirt-order/draft')
}

export async function saveInstructorTshirtOrder(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/tshirt-order', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function createInstructorTshirtOrderPaymentIntent(orderId: string) {
  return authFetch('/api/v1/instructor/crm/tshirt-order/payment-intent', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  })
}

export async function confirmInstructorTshirtOrderPayment(orderId: string, paymentIntentId: string) {
  return authFetch('/api/v1/instructor/crm/tshirt-order/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId, paymentIntentId }),
  })
}

export async function fetchInstructorBackgroundVerification() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/background-verification')
}

export async function fetchInstructorBackgroundVerificationFee() {
  return authFetchJson<{
    feeCents: number
    additionalCents: number
    stripeEnabled: boolean
    standardFeeInCart?: boolean
    additionalFeeInCart?: boolean
  }>('/api/v1/instructor/crm/background-verification/fee')
}

export async function updateInstructorBackgroundVerification(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/background-verification', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** Legacy parity: one Stripe checkout for all unpaid {@code mm_cart} lines. */
export async function createInstructorCartPaymentIntent() {
  return authFetch('/api/v1/instructor/crm/cart/payment-intent', {
    method: 'POST',
    body: '{}',
  })
}

export async function confirmInstructorCartPayment(paymentIntentId: string) {
  return authFetch('/api/v1/instructor/crm/cart/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  })
}

export async function fetchAdminTransactionsAll() {
  return authFetchJson<Record<string, unknown>[]>('/api/v1/admin/crm/tables/transactions-all')
}

export async function createInstructorBackgroundVerificationPaymentIntent() {
  return authFetch('/api/v1/instructor/crm/background-verification/payment-intent', {
    method: 'POST',
    body: '{}',
  })
}

export async function confirmInstructorBackgroundVerificationPayment(paymentIntentId: string) {
  return authFetch('/api/v1/instructor/crm/background-verification/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  })
}

export async function createInstructorBackgroundVerificationAdditionalPaymentIntent() {
  return authFetch('/api/v1/instructor/crm/background-verification/additional-payment-intent', {
    method: 'POST',
    body: '{}',
  })
}

export async function confirmInstructorBackgroundVerificationAdditionalPayment(paymentIntentId: string) {
  return authFetch('/api/v1/instructor/crm/background-verification/confirm-additional-payment', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  })
}

export async function uploadInstructorBackgroundVerificationPdf(file: File) {
  const base = API().replace(/\/$/, '')
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${base}/api/v1/instructor/crm/background-verification/supporting-document`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
}

export async function addInstructorBackgroundVerificationFeeToCart() {
  return authFetch('/api/v1/instructor/crm/background-verification/add-standard-fee-to-cart', {
    method: 'POST',
    body: '{}',
  })
}

export async function addInstructorBackgroundVerificationAdditionalFeeToCart() {
  return authFetch('/api/v1/instructor/crm/background-verification/add-additional-fee-to-cart', {
    method: 'POST',
    body: '{}',
  })
}

/** Loads HTML form snippets; legacy parity via public `getAdminFormByDumId` (mm_form_templates / AdminForms). */
export async function fetchInstructorBackgroundVerificationFormTemplate(templateId: string) {
  const base = API().replace(/\/$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/api/v1/public/form-template/${encodeURIComponent(templateId)}`, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    const fallback = apiFallbackUrl(base)
    if (!fallback) throw new Error('Failed to reach API server')
    res = await fetch(`${fallback}/api/v1/public/form-template/${encodeURIComponent(templateId)}`, {
      headers: { Accept: 'application/json' },
    })
  }
  const raw = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const msg =
      (typeof data.error === 'string' && data.error) ||
      (raw.trim().slice(0, 400) || `Request failed (${res.status})`)
    throw new Error(msg)
  }
  return data
}

export async function deleteInstructorBackgroundVerificationSupportingPdf(index: number) {
  return authFetch(`/api/v1/instructor/crm/background-verification/supporting-document/${index}`, {
    method: 'DELETE',
  })
}

/** Opens in a new tab after fetching with the portal bearer token (avoid putting JWT in query strings). */
export async function openInstructorBackgroundVerificationSupportingPdf(index: number): Promise<boolean> {
  const res = await authFetch(`/api/v1/instructor/crm/background-verification/supporting-document/${index}`, {
    headers: { Accept: 'application/pdf' },
  })
  if (!res.ok) return false
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}

export async function fetchInstructorExpensePool() {
  return authFetchJson<Record<string, unknown>>('/api/v1/instructor/crm/expense-pool')
}

export async function updateInstructorExpensePool(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/expense-pool', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateInstructorContact(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/contact', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateInstructorTax(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/tax', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorVacancyCourses() {
  return authFetchJson<unknown[]>('/api/v1/instructor/crm/vacancy-courses')
}

export async function fetchInstructorAttendanceByCourse(courseId: string) {
  return authFetchJson<unknown[]>(`/api/v1/instructor/attendance/course/${encodeURIComponent(courseId)}`)
}

export async function markInstructorAttendance(body: {
  courseId: string
  studentUserId: string
  sessionDay: number
  present?: boolean
  status?: string
  note?: string
}) {
  return authFetch('/api/v1/instructor/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorExpenseTypes() {
  return authFetchJson<ExpenseCatalogItem[]>('/api/v1/instructor/crm/expense-types')
}

export async function fetchInstructorInventoryNames() {
  return authFetchJson<Record<string, unknown>[]>('/api/v1/instructor/crm/inventory-names')
}

export async function createInstructorEquipmentRequest(body: Record<string, unknown>) {
  return authFetch('/api/v1/instructor/crm/equipment-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// --- Student data ---

export async function fetchStudentDashboardCounts() {
  return authFetchJson<{ registered: number; ongoing: number; attended: number }>(
    '/api/v1/student/data/dashboard-counts'
  )
}

export async function fetchStudentProfileDoc() {
  return authFetchJson<Record<string, unknown>>('/api/v1/student/data/profile')
}

export async function updateStudentProfileDoc(body: Record<string, unknown>) {
  return authFetch('/api/v1/student/data/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchStudentTransactions() {
  return authFetchJson<unknown[]>('/api/v1/student/data/transactions')
}

export async function fetchStudentLiabilityDocuments() {
  return authFetchJson<unknown[]>('/api/v1/student/data/liability-documents')
}

export async function fetchStudentCalendarEvents() {
  return authFetchJson<unknown[]>('/api/v1/student/data/calendar-events')
}

/** Multipart upload; max 10MB server-side. */
export async function uploadStudentLiabilityFile(file: File) {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API()}/api/v1/student/data/liability-documents/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(res.status === 413 ? 'File too large (max 10MB).' : t || res.statusText)
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function downloadStudentLiabilityFile(id: string) {
  const token = getToken()
  const res = await fetch(
    `${API()}/api/v1/student/data/liability-documents/${encodeURIComponent(id)}/file`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  )
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const cd = res.headers.get('Content-Disposition')
  let filename = `document-${id}`
  if (cd) {
    const star = /filename\*=UTF-8''([^;\n]+)/i.exec(cd)
    const plain = /filename="([^"]+)"/i.exec(cd)
    const loose = /filename=([^;\s]+)/i.exec(cd)
    const raw = star?.[1] ?? plain?.[1] ?? loose?.[1]
    if (raw) {
      try {
        filename = decodeURIComponent(raw.replace(/^"|"$/g, ''))
      } catch {
        filename = raw.replace(/^"|"$/g, '')
      }
    }
  }
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function addStudentLiabilityDocument(body: Record<string, unknown>) {
  return authFetch('/api/v1/student/data/liability-documents', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteStudentLiabilityDocument(id: string) {
  return authFetch(`/api/v1/student/data/liability-documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchStudentCoursesAttended() {
  return authFetchJson<unknown[]>('/api/v1/student/data/courses-attended')
}

export async function downloadStudentCertificate(courseId: string) {
  const token = getToken()
  const res = await fetch(`${API()}/api/v1/student/data/certificate/${encodeURIComponent(courseId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let filename = `certificate-${courseId}.pdf`
  if (cd) {
    const m = /filename="?([^";\n]+)"?/i.exec(cd)
    if (m) filename = m[1].replace(/^"|"$/g, '')
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function fetchMe(): Promise<MeUser | null> {
  const res = await authFetch('/api/v1/me')
  if (!res.ok) return null
  return res.json()
}

export async function changeMyPassword(body: { currentPassword: string; newPassword: string }) {
  return authFetch('/api/v1/me/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type EnrollmentAttendeeView = {
  firstName?: string
  lastName?: string
  email?: string
  dob?: string
  primary?: boolean
}

export type StudentEnrollmentView = {
  id: string
  courseId: string
  status: string
  enrolledAt?: string | null
  courseTitle?: string
  locationLabel?: string
  venueName?: string
  address?: string
  feeDisplay?: string
  sessionStarts?: string[]
  sessionEnds?: string[]
  graduationDisplay?: string
  description?: string
  instructorName?: string
  contactEmail?: string
  contactPhone?: string
  weekendLabel?: string
  directions?: string
  parkingInfo?: string
  lunchInfo?: string
  attendeeCount?: number
  tuitionPaidDisplay?: string
  attendees?: EnrollmentAttendeeView[]
}

export async function fetchMyEnrollments(): Promise<StudentEnrollmentView[]> {
  const res = await authFetch('/api/v1/student/enrollments')
  if (!res.ok) return []
  return res.json() as Promise<StudentEnrollmentView[]>
}

export async function createEnrollmentPaymentIntent(courseId: string, attendeeCount?: number) {
  return authFetch('/api/v1/student/enrollments/payment-intent', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      attendeeCount: attendeeCount != null && attendeeCount > 0 ? attendeeCount : undefined,
    }),
  })
}

export async function enrollInCourse(
  courseId: string,
  paymentIntentId?: string | null,
  attendeeCount?: number,
) {
  const res = await authFetch('/api/v1/student/enrollments', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      paymentIntentId: paymentIntentId || undefined,
      attendeeCount: attendeeCount != null && attendeeCount > 0 ? attendeeCount : undefined,
    }),
  })
  return res
}

export async function fetchCourseRegistrationDraft(courseId: string) {
  return authFetchJson<Record<string, unknown>>(
    `/api/v1/student/course-registration-draft?courseId=${encodeURIComponent(courseId)}`,
  )
}

export async function sendInstructorEmail(body: {
  to: string
  cc?: string
  bcc?: string
  subject: string
  text: string
  html?: string
}) {
  return authFetch('/api/v1/instructor/crm/email/send', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorCourses() {
  const res = await authFetch('/api/v1/instructor/courses')
  if (!res.ok) return []
  return res.json()
}

/** REGISTERED counts for courses visible to this instructor (same scope as instructor course list). */
export async function fetchInstructorCourseRegistrationCounts(): Promise<Record<string, number>> {
  const res = await authFetch('/api/v1/instructor/course-registration-counts')
  if (!res.ok) return {}
  const raw = (await res.json()) as Record<string, unknown>
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k] = typeof v === 'number' ? v : Number(v) || 0
  }
  return out
}

export async function fetchInstructorCourseDetail(courseId: string) {
  const res = await authFetch(`/api/v1/instructor/courses/${encodeURIComponent(courseId)}`)
  if (!res.ok) return null
  return res.json() as Promise<{
    course: Record<string, unknown>
    instructorDisplayNames: string[]
  }>
}

export async function fetchInstructorPortalInstructors() {
  const res = await authFetch('/api/v1/instructor/crm/portal-instructors')
  if (!res.ok) return []
  return res.json() as Promise<Record<string, unknown>[]>
}

export async function fetchInstructorCourseAccounting(courseId: string) {
  const res = await authFetch(`/api/v1/instructor/expenses/course/${encodeURIComponent(courseId)}/accounting`)
  if (!res.ok) return null
  return res.json()
}

export async function instructorApproveAllCourseExpenses(courseId: string) {
  return authFetch(`/api/v1/instructor/expenses/course/${encodeURIComponent(courseId)}/approve-all`, {
    method: 'POST',
  })
}

export async function createInstructorCourse(body: AdminCourseWritePayload) {
  return authFetch('/api/v1/instructor/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateInstructorCourse(id: string, body: AdminCourseWritePayload) {
  return authFetch(`/api/v1/instructor/courses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteInstructorCourse(id: string) {
  return authFetch(`/api/v1/instructor/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function cancelInstructorCourse(id: string) {
  return authFetch(`/api/v1/instructor/courses/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  })
}

export async function fetchInstructorRoster(
  courseId: string,
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  const res = await authFetch(`/api/v1/instructor/courses/${encodeURIComponent(courseId)}/roster`)
  if (!res.ok) {
    const error =
      res.status === 403
        ? 'Not authorized to view this course roster.'
        : res.status === 404
          ? 'Course not found.'
          : 'Failed to load roster.'
    return { rows: [], error }
  }
  const data = await res.json()
  return { rows: Array.isArray(data) ? (data as Record<string, unknown>[]) : [] }
}

export async function fetchAdminCourses() {
  const res = await authFetch('/api/v1/admin/courses')
  if (!res.ok) return []
  return res.json()
}

/** Map course id (hex) → REGISTERED enrollment count (admin course table). */
export async function fetchAdminCourseRegistrationCounts(): Promise<Record<string, number>> {
  const res = await authFetch('/api/v1/admin/courses/registration-counts')
  if (!res.ok) return {}
  const raw = (await res.json()) as Record<string, unknown>
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k] = typeof v === 'number' ? v : Number(v) || 0
  }
  return out
}

export type AdminCourseEnrollmentRow = Record<string, unknown> & {
  id?: string
  userId?: string
  courseId?: string
  status?: string
  studentFirstName?: string
  studentLastName?: string
  studentEmail?: string
  enrolledAt?: string
}

export async function fetchAdminCourseEnrollments(courseId: string): Promise<AdminCourseEnrollmentRow[]> {
  const res = await authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/enrollments`)
  if (!res.ok) return []
  return res.json() as Promise<AdminCourseEnrollmentRow[]>
}

export type AdminCourseAttendanceRow = {
  id: string
  courseId: string
  studentUserId: string
  sessionDay: number
  present: boolean
  status?: string | null
  note?: string | null
}

export async function fetchAdminCourseAttendance(courseId: string): Promise<AdminCourseAttendanceRow[]> {
  const res = await authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/attendance`)
  if (!res.ok) return []
  return res.json() as Promise<AdminCourseAttendanceRow[]>
}

export async function markAdminCourseAttendance(
  courseId: string,
  body: { studentUserId: string; sessionDay: number; status?: string; note?: string }
) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/attendance`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function bulkMarkAdminCourseAttendance(courseId: string, body: { sessionDay: number; rows: any[] }) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/attendance/bulk`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function assignOtherCourse(courseId: string, body: { studentUserId: string; toCourseId: string }) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/assign-other-course`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function cancelAdminCourse(courseId: string) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/cancel`, {
    method: 'POST',
  })
}

export async function fetchAdminCourse(id: string) {
  const res = await authFetch(`/api/v1/admin/courses/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  return res.json()
}

export type AdminCourseWritePayload = {
  locationName: string
  address?: string
  courseFees?: string
  status?: string
  privateCourse?: string
  startDateTime?: string[]
  endDateTime?: string[]
  courseDescription?: string
  courseGraduationDate?: string
  displayStartDate?: number
  instructorName?: string
  weekendCourse?: string
  courseType?: string
  venueName?: string
  directions?: string
  parkingInstructions?: string
  lunchDetails?: string
  emailId?: string
  phoneNumber?: string
  latitude?: string
  longitude?: string
  courseCatalogId?: string
  primaryInstructorUserId?: string
  instructorUserIds?: string[]
  maxStudents?: number
  classLocation?: string
  shortInstructor?: string
  minStudentCount?: number
  venueContactName?: string
  venueContactPhone?: string
  nearestHospital?: string
  shortInstructorMale?: string
  shortInstructorFemale?: string
  decisionDateDisplay?: string
}

export async function createAdminCourse(body: AdminCourseWritePayload) {
  return authFetch('/api/v1/admin/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminCourse(id: string, body: AdminCourseWritePayload) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteAdminCourse(id: string) {
  return authFetch(`/api/v1/admin/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminCourseVacancies() {
  const res = await authFetch('/api/v1/admin/courses/vacancies')
  if (!res.ok) {
    throw new Error((await res.text()) || res.statusText || 'Failed to load vacancies')
  }
  return res.json()
}

export async function fetchAdminPendingAssignments() {
  const res = await authFetch('/api/v1/admin/courses/pending-assignments')
  if (!res.ok) {
    throw new Error((await res.text()) || res.statusText || 'Failed to load pending re-assignments')
  }
  return res.json()
}

/** Download roster or attendance XLSX (legacy Excel layout + Attendance Notes sheet). */
async function downloadCourseExportBlob(
  courseId: string,
  audience: 'admin' | 'instructor',
  kind: 'roster' | 'attendance',
  overrideFilename?: string,
) {
  const token = getToken()
  const suffix = kind === 'roster' ? 'roster' : 'attendance'
  const path =
    audience === 'admin'
      ? `/api/v1/admin/courses/${encodeURIComponent(courseId)}/export/${suffix}`
      : `/api/v1/instructor/courses/${encodeURIComponent(courseId)}/export/${suffix}`
  const res = await fetch(`${API()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let name = kind === 'roster' ? 'roster.xlsx' : 'attendance.xlsx'
  const m = cd?.match(/filename="?([^";]+)"?/)
  if (m) name = m[1]
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = overrideFilename?.trim() ? overrideFilename : name
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function downloadAdminCourseExport(
  courseId: string,
  kind: 'roster' | 'attendance',
  overrideFilename?: string,
) {
  await downloadCourseExportBlob(courseId, 'admin', kind, overrideFilename)
}

export async function downloadInstructorCourseExport(
  courseId: string,
  kind: 'roster' | 'attendance',
  overrideFilename?: string,
) {
  await downloadCourseExportBlob(courseId, 'instructor', kind, overrideFilename)
}

export async function fetchAdminUsers(): Promise<Record<string, unknown>[]> {
  return authFetchJson<Record<string, unknown>[]>('/api/v1/admin/users')
}

export async function fetchPendingExpenses() {
  const res = await authFetch('/api/v1/admin/expenses/pending')
  if (!res.ok) return []
  return res.json()
}

export async function fetchBgAgentPending() {
  const res = await authFetch('/api/v1/bgagent/queue/pending')
  if (!res.ok) return []
  return res.json()
}

export async function fetchBgAgentApproved() {
  const res = await authFetch('/api/v1/bgagent/queue/approved')
  if (!res.ok) return []
  return res.json()
}

export async function fetchBgAgentRejected() {
  const res = await authFetch('/api/v1/bgagent/queue/rejected')
  if (!res.ok) return []
  return res.json()
}

export async function fetchBgAgentAdditional() {
  const res = await authFetch('/api/v1/bgagent/queue/additional')
  if (!res.ok) return []
  return res.json()
}

export async function fetchBgAgentVerificationByUserId(userId: string) {
  const res = await authFetch(`/api/v1/bgagent/verification/${encodeURIComponent(userId)}`)
  if (!res.ok) return null
  return res.json()
}

export async function updateBgAgentVerificationStatus(
  userId: string,
  status: string,
  updates?: Record<string, unknown>
) {
  return authFetch(`/api/v1/bgagent/verification/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, updates }),
  })
}

export async function createBgAgentAdditionalVerification(body: {
  userId: string
  additionalAmount?: number
  additionalVerificationStatus?: string
}) {
  return authFetch('/api/v1/bgagent/queue/additional', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function sendBgAgentEmail(body: {
  to: string
  cc?: string
  bcc?: string
  subject?: string
  text?: string
}) {
  return authFetch('/api/v1/bgagent/email/send', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function uploadBgAgentVerificationPdf(userId: string, file: File) {
  const token = getToken()
  const base = API().replace(/\/$/, '')
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(
    `${base}/api/v1/bgagent/verification/${encodeURIComponent(userId)}/agent-document`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    },
  )
  return res
}

export async function openBgAgentCandidateSupportingPdf(userId: string, index: number): Promise<boolean> {
  const res = await authFetch(
    `/api/v1/bgagent/verification/${encodeURIComponent(userId)}/supporting-document/${index}`,
    { method: 'GET' },
  )
  if (!res.ok) return false
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export async function openBgAgentInvestigatorPdf(userId: string, index: number): Promise<boolean> {
  const res = await authFetch(
    `/api/v1/bgagent/verification/${encodeURIComponent(userId)}/agent-document/${index}`,
    { method: 'GET' },
  )
  if (!res.ok) return false
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export async function fetchEquipPending() {
  const res = await authFetch('/api/v1/equip/queue/pending')
  if (!res.ok) return []
  return res.json()
}

export async function fetchEquipApproved() {
  const res = await authFetch('/api/v1/equip/queue/approved')
  if (!res.ok) return []
  return res.json()
}

export async function fetchEquipReturned() {
  const res = await authFetch('/api/v1/equip/queue/returned')
  if (!res.ok) return []
  return res.json()
}

export async function fetchEquipRequestById(requestId: string) {
  const res = await authFetch(`/api/v1/equip/request/${encodeURIComponent(requestId)}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchEquipRequestHistory(requestId: string) {
  const res = await authFetch(`/api/v1/equip/request/${encodeURIComponent(requestId)}/history`)
  if (!res.ok) return []
  return res.json()
}

export async function updateEquipRequestStatus(
  requestId: string,
  status: string,
  adminNote?: string,
  updates?: Record<string, unknown>
) {
  return authFetch(`/api/v1/equip/request/${encodeURIComponent(requestId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote, updates }),
  })
}

export async function fetchAdminReportSummary() {
  const res = await authFetch('/api/v1/reports/summary')
  if (!res.ok) return null
  return res.json()
}

export async function fetchNotifications() {
  const res = await authFetch('/api/v1/notifications')
  if (!res.ok) return []
  return res.json()
}

export async function fetchMessagesInbox() {
  const res = await authFetch('/api/v1/messages')
  if (!res.ok) return []
  return res.json()
}

export async function fetchInstructorExpenses() {
  const res = await authFetch('/api/v1/instructor/expenses')
  if (!res.ok) return []
  return res.json()
}

export async function submitInstructorExpense(body: {
  courseId: string
  amount: number
  description: string
  expenseType?: string
  expenseCatalogId?: string
  receiptUrl?: string
}) {
  return authFetch('/api/v1/instructor/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchInstructorCourseExpenses(courseId: string) {
  const res = await authFetch(`/api/v1/instructor/expenses/course/${encodeURIComponent(courseId)}`)
  if (!res.ok) return []
  return res.json()
}

export async function approveExpense(id: string) {
  return authFetch(`/api/v1/admin/expenses/${id}/approve`, { method: 'PATCH' })
}

export async function rejectExpense(id: string, reason?: string) {
  return authFetch(`/api/v1/admin/expenses/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: reason ?? null }),
  })
}

export async function instructorApproveExpense(id: string) {
  return authFetch(`/api/v1/instructor/expenses/${id}/approve`, { method: 'PATCH' })
}

export async function instructorRejectExpense(id: string, reason?: string) {
  return authFetch(`/api/v1/instructor/expenses/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

/** Legacy “I agree” with final course expense accounting. */
export async function instructorAgreeCourseAccounting(courseId: string) {
  return authFetch(`/api/v1/instructor/expenses/course/${encodeURIComponent(courseId)}/agree-accounting`, {
    method: 'POST',
  })
}

/** Upload expense receipt (PDF/images/Word; blocks .html etc.). Returns relative receiptUrl. */
export async function uploadInstructorExpenseReceipt(file: File) {
  const base = API().replace(/\/$/, '')
  const token = getToken()
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${base}/api/v1/instructor/expenses/receipt/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  return res
}

export function expenseReceiptDownloadUrl(receiptUrl: string): string {
  const path = receiptUrl.startsWith('http') ? new URL(receiptUrl).pathname : receiptUrl
  return `${API().replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

function expenseReceiptApiPath(receiptUrl: string): string {
  const trimmed = receiptUrl.trim()
  if (!trimmed) throw new Error('Receipt link is missing')
  if (trimmed.startsWith('http')) return new URL(trimmed).pathname
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/** Load receipt bytes for in-app preview (JWT required; plain anchor href will not work). */
async function receiptAuthFetch(path: string): Promise<Response> {
  const token = getToken()
  const base = API().replace(/\/$/, '')
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(`${base}${path}`, { headers })
  } catch {
    const fallback = apiFallbackUrl(base)
    if (!fallback) throw new Error('Could not open receipt')
    return fetch(`${fallback}${path}`, { headers })
  }
}

export async function fetchExpenseReceiptPreview(receiptUrl: string): Promise<{
  objectUrl: string
  contentType: string
  fileName: string
}> {
  const path = expenseReceiptApiPath(receiptUrl)
  let res = await receiptAuthFetch(path)
  if (!res.ok) throw new Error('Could not open receipt')
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const disp = res.headers.get('content-disposition') || ''
  const fileNameMatch = /filename="?([^";]+)"?/i.exec(disp)
  const fileName = fileNameMatch?.[1]?.trim() || 'receipt'
  const blob = await res.blob()
  return { objectUrl: URL.createObjectURL(blob), contentType, fileName }
}

/** @deprecated Prefer in-app ExpenseReceiptViewerDialog */
export async function openExpenseReceipt(receiptUrl: string): Promise<void> {
  const preview = await fetchExpenseReceiptPreview(receiptUrl)
  window.open(preview.objectUrl, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(preview.objectUrl), 60_000)
}

export async function fetchAdminCourseAccounting(courseId: string) {
  const res = await authFetch(`/api/v1/admin/expenses/course/${encodeURIComponent(courseId)}/accounting`)
  if (!res.ok) return null
  return res.json()
}

export async function closeAdminCourse(courseId: string) {
  return authFetch(`/api/v1/admin/expenses/course/${encodeURIComponent(courseId)}/close`, {
    method: 'PATCH',
  })
}

export async function fetchAdminCourseExpenses(courseId: string) {
  const res = await authFetch(`/api/v1/admin/expenses/course/${encodeURIComponent(courseId)}`)
  if (!res.ok) return []
  return res.json()
}

export async function markExpensePaid(id: string, paidAmount?: number, note?: string) {
  return authFetch(`/api/v1/admin/expenses/${id}/mark-paid`, {
    method: 'PATCH',
    body: JSON.stringify({ paidAmount, note }),
  })
}

export async function closeCourse(courseId: string) {
  return authFetch(`/api/v1/admin/expenses/course/${encodeURIComponent(courseId)}/close`, {
    method: 'PATCH',
  })
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API()}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  })
  return res
}

export async function forgotPassword(email: string) {
  return fetch(`${API()}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function fetchStripeConfig() {
  const res = await fetch(`${API()}/api/v1/payments/stripe/config`)
  if (!res.ok) return null
  return res.json() as Promise<{ publishableKey?: string; stripeEnabled?: boolean }>
}

export async function createPaymentIntent(amountDollars: string, metadata?: Record<string, string>) {
  const res = await fetch(`${API()}/api/v1/payments/stripe/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountDollars, currency: 'usd', metadata }),
  })
  return res
}
