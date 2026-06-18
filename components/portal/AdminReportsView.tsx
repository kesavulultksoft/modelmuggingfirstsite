'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { downloadRowsAsCsv, downloadSummaryAsCsv } from '@/lib/csvExport'
import { coerceMongoIdFromRow, legacyAsObjectArray } from '@/lib/legacyHelpers'
import {
  downloadAdminCourseExport,
  fetchAdminCompletedInstructors,
  fetchAdminCourses,
  fetchAdminCrmOperations,
  fetchAdminCrmStudentRegistrations,
  fetchAdminCrmStudents,
  fetchAdminCrmSubscriptions,
  fetchAdminCrmTable,
  fetchAdminEmailHistory,
  fetchAdminInstructorPayments,
  fetchAdminReportSummary,
  fetchAdminTransactionsAll,
  fetchAdminUsers,
} from '@/lib/portalApi'

type ReportCategory = 'snapshot' | 'people' | 'enrollment' | 'financial' | 'operations'

type ReportDef = {
  id: string
  category: ReportCategory
  title: string
  description: string
  filename: string
  load: () => Promise<Record<string, unknown>[]>
  columns?: string[]
}

const CATEGORY_META: Record<
  ReportCategory,
  { label: string; description: string; icon: typeof BarChart3; tone: string }
> = {
  snapshot: {
    label: 'Snapshot',
    description: 'High-level counts across the platform.',
    icon: BarChart3,
    tone: 'border-slate-200 bg-slate-50',
  },
  people: {
    label: 'People & contacts',
    description: 'Students, subscribers, users, and instructors.',
    icon: Users,
    tone: 'border-teal-200 bg-teal-50/80',
  },
  enrollment: {
    label: 'Enrollment',
    description: 'Registrations and class sign-ups.',
    icon: GraduationCap,
    tone: 'border-indigo-200 bg-indigo-50/80',
  },
  financial: {
    label: 'Financial',
    description: 'Payments, transactions, and donations.',
    icon: Wallet,
    tone: 'border-emerald-200 bg-emerald-50/80',
  },
  operations: {
    label: 'Operations',
    description: 'Email history and instructor payouts.',
    icon: Mail,
    tone: 'border-amber-200 bg-amber-50/80',
  },
}

const SUMMARY_LABELS: Record<string, string> = {
  students: 'Students',
  instructors: 'Instructors',
  courses: 'Courses',
  portalEnrollments: 'Portal enrollments',
  studentCourseRegistrations: 'Student registrations',
  pendingInstructorExpenseDocs: 'Pending instructor receipts',
  pendingPortalExpenses: 'Pending portal expenses',
  pendingBackgroundVerification: 'Pending background checks',
  donationsCount: 'Donations',
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function formatGeneratedAt(value: unknown): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const REPORTS: ReportDef[] = [
  {
    id: 'students',
    category: 'people',
    title: 'Student profiles',
    description: 'All records from mm_students (name, email, contact, DOB).',
    filename: 'report_students',
    load: async () => legacyAsObjectArray(await fetchAdminCrmStudents()),
    columns: ['id', 'firstName', 'lastName', 'emailAddress', 'email', 'contactNumber', 'city', 'state', 'country', 'dob', 'userId', 'createdDate'],
  },
  {
    id: 'subscribers',
    category: 'people',
    title: 'Mailing list / subscriptions',
    description: 'mm_subscriptions — all subscription types.',
    filename: 'report_subscriptions',
    load: async () => legacyAsObjectArray(await fetchAdminCrmSubscriptions()),
    columns: ['firstName', 'lastName', 'email', 'type', 'city', 'state', 'country', 'countryName', 'locationName', 'phoneNumber', 'createdDate'],
  },
  {
    id: 'parents',
    category: 'people',
    title: 'Parent contacts',
    description: 'Parent records linked to student enrollments.',
    filename: 'report_parents',
    load: async () => legacyAsObjectArray(await fetchAdminCrmTable('parents')),
  },
  {
    id: 'portal-users',
    category: 'people',
    title: 'Portal users',
    description: 'Admin, instructor, and student portal accounts.',
    filename: 'report_portal_users',
    load: async () => legacyAsObjectArray(await fetchAdminUsers()),
    columns: ['id', 'email', 'firstName', 'lastName', 'role', 'active', 'createdAt'],
  },
  {
    id: 'instructors',
    category: 'people',
    title: 'Instructors (active + archived)',
    description: 'Completed instructor CRM profiles.',
    filename: 'report_instructors',
    load: async () => {
      const [active, archived] = await Promise.all([
        fetchAdminCompletedInstructors(false).catch(() => []),
        fetchAdminCompletedInstructors(true).catch(() => []),
      ])
      return [
        ...legacyAsObjectArray(active).map((r) => ({ ...r, archived: 'no' })),
        ...legacyAsObjectArray(archived).map((r) => ({ ...r, archived: 'yes' })),
      ]
    },
  },
  {
    id: 'registrations',
    category: 'enrollment',
    title: 'Student course registrations',
    description: 'mm_student_course_registrations mirror.',
    filename: 'report_student_registrations',
    load: async () => legacyAsObjectArray(await fetchAdminCrmStudentRegistrations()),
    columns: ['firstName', 'lastName', 'email', 'courseId', 'locationName', 'status', 'paymentStatus', 'createdDate', 'attendeeCount'],
  },
  {
    id: 'courses',
    category: 'enrollment',
    title: 'Course catalog',
    description: 'All admin courses — dates, location, status.',
    filename: 'report_courses',
    load: async () => legacyAsObjectArray(await fetchAdminCourses()),
    columns: ['id', 'courseTitle', 'locationName', 'eventDate', 'status', 'instructorName', 'maxAttendees'],
  },
  {
    id: 'transactions',
    category: 'financial',
    title: 'Transactions',
    description: 'Payment and transaction log (all).',
    filename: 'report_transactions',
    load: async () => legacyAsObjectArray(await fetchAdminTransactionsAll()),
  },
  {
    id: 'donations',
    category: 'financial',
    title: 'Donations',
    description: 'Donation records from operations dataset.',
    filename: 'report_donations',
    load: async () => legacyAsObjectArray(await fetchAdminCrmOperations('donations')),
  },
  {
    id: 'instructor-payments',
    category: 'financial',
    title: 'Instructor payments',
    description: 'Recorded instructor payment entries.',
    filename: 'report_instructor_payments',
    load: async () => legacyAsObjectArray(await fetchAdminInstructorPayments()),
  },
  {
    id: 'email-history',
    category: 'operations',
    title: 'Email history',
    description: 'Sent mail log from the email center.',
    filename: 'report_email_history',
    load: async () => legacyAsObjectArray(await fetchAdminEmailHistory()),
    columns: ['id', 'to', 'subject', 'category', 'sentAt', 'transportOk'],
  },
]

export default function AdminReportsView() {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [courseSearch, setCourseSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [courseExporting, setCourseExporting] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setSummaryLoading(true)
    fetchAdminReportSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false))
    fetchAdminCourses()
      .then((d) => setCourses(legacyAsObjectArray(d)))
      .catch(() => setCourses([]))
  }, [])

  const summaryCards = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary)
      .filter(([k]) => k !== 'generatedAt')
      .map(([key, value]) => ({
        key,
        label: SUMMARY_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value: typeof value === 'number' ? value.toLocaleString() : String(value ?? '—'),
      }))
  }, [summary])

  const reportsByCategory = useMemo(() => {
    const map = new Map<ReportCategory, ReportDef[]>()
    for (const cat of Object.keys(CATEGORY_META) as ReportCategory[]) {
      map.set(cat, REPORTS.filter((r) => r.category === cat))
    }
    return map
  }, [])

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase()
    const list = [...courses]
    list.sort((a, b) => {
      const da = pickString(a, ['eventDate', 'startDate', 'courseDate'])
      const db = pickString(b, ['eventDate', 'startDate', 'courseDate'])
      return db.localeCompare(da)
    })
    if (!q) return list.slice(0, 40)
    return list
      .filter((c) => {
        const title = pickString(c, ['courseTitle', 'title', 'name']).toLowerCase()
        const loc = pickString(c, ['locationName', 'city']).toLowerCase()
        const id = pickString(c, ['id', '_id']).toLowerCase()
        return title.includes(q) || loc.includes(q) || id.includes(q)
      })
      .slice(0, 40)
  }, [courses, courseSearch])

  const downloadReport = useCallback(async (report: ReportDef) => {
    setMsg('')
    setDownloadingId(report.id)
    try {
      const rows = await report.load()
      if (!rows.length) {
        setMsg(`${report.title}: no rows to export.`)
        return
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadRowsAsCsv(`${report.filename}_${stamp}`, rows, report.columns)
    } catch (e) {
      setMsg(`${report.title}: ${String((e as Error).message || e)}`)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const downloadSummary = useCallback(() => {
    if (!summary) {
      setMsg('Summary is not loaded yet.')
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    downloadSummaryAsCsv(`report_organization_summary_${stamp}`, summary)
  }, [summary])

  const exportCourse = useCallback(async (courseId: string, kind: 'roster' | 'attendance') => {
    setMsg('')
    setCourseExporting(`${courseId}-${kind}`)
    try {
      await downloadAdminCourseExport(courseId, kind)
    } catch (e) {
      setMsg(String((e as Error).message || e))
    } finally {
      setCourseExporting(null)
    }
  }, [])

  return (
    <>
      <PortalPageHeader
        title="Reports & exports"
        subtitle="Download CSV snapshots of CRM data or Excel roster and attendance files per course."
      />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Organization snapshot</p>
            <p className="text-sm text-slate-600">
              Live counts from the database
              {summary?.generatedAt != null ? (
                <> · Updated {formatGeneratedAt(summary.generatedAt)}</>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadSummary()}
            disabled={summaryLoading || !summary}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d9488] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#0f766e] disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download summary CSV
          </button>
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Loading metrics…
          </div>
        ) : summaryCards.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.key}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Could not load summary metrics.</p>
        )}
      </section>

      {msg ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{msg}</p>
      ) : null}

      {(Object.keys(CATEGORY_META) as ReportCategory[]).map((category) => {
        const meta = CATEGORY_META[category]
        const reports = reportsByCategory.get(category) ?? []
        if (!reports.length) return null
        const Icon = meta.icon
        return (
          <section key={category} className="mb-6">
            <div className={`mb-3 rounded-xl border px-4 py-3 ${meta.tone}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-slate-700" aria-hidden />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{meta.label}</h2>
                  <p className="text-xs text-slate-600">{meta.description}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {reports.map((report) => {
                const busy = downloadingId === report.id
                return (
                  <article
                    key={report.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200/80 hover:shadow-md"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{report.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{report.description}</p>
                      <p className="mt-2 font-mono text-[10px] text-slate-400">{report.filename}.csv</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void downloadReport(report)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 hover:border-[#0d9488]/40 hover:bg-teal-50 hover:text-[#0d9488] disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden />
                      )}
                      {busy ? 'Preparing…' : 'Download CSV'}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
                <FileSpreadsheet className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Course Excel exports</h2>
                <p className="text-sm text-slate-600">
                  Legacy roster and attendance workbooks (.xlsx) — same format as Course management.
                </p>
              </div>
            </div>
            <Link
              href="/portal/admin/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0d9488] hover:underline"
            >
              Open courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <label className="relative mt-4 block max-w-md">
            <span className="sr-only">Search courses</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm"
              placeholder="Search course title, location, or id…"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length ? (
                filteredCourses.map((c) => {
                  const courseId = coerceMongoIdFromRow(c) || pickString(c, ['id', 'courseId'])
                  const title = pickString(c, ['courseTitle', 'title', 'name']) || 'Untitled course'
                  const loc = pickString(c, ['locationName', 'city']) || '—'
                  const date = pickString(c, ['eventDate', 'startDate', 'courseDate']) || '—'
                  const rosterBusy = courseExporting === `${courseId}-roster`
                  const attBusy = courseExporting === `${courseId}-attendance`
                  return (
                    <tr key={courseId || title} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{title}</p>
                        {courseId ? (
                          <p className="font-mono text-[10px] text-slate-400">{courseId.slice(0, 12)}…</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{loc}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">{date}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={!courseId || rosterBusy || attBusy}
                            onClick={() => courseId && void exportCourse(courseId, 'roster')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-[#0d9488]/30 hover:text-[#0d9488] disabled:opacity-40"
                          >
                            {rosterBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            ) : (
                              <BookOpen className="h-3.5 w-3.5" aria-hidden />
                            )}
                            Roster
                          </button>
                          <button
                            type="button"
                            disabled={!courseId || rosterBusy || attBusy}
                            onClick={() => courseId && void exportCourse(courseId, 'attendance')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-[#0d9488]/30 hover:text-[#0d9488] disabled:opacity-40"
                          >
                            {attBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            ) : (
                              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
                            )}
                            Attendance
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No courses match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!courseSearch.trim() && courses.length > 40 ? (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Showing 40 most recent courses — search to find others.
          </p>
        ) : null}
      </section>
    </>
  )
}
