'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  fetchInstructorAttendanceByCourse,
  fetchInstructorCourseAccounting,
  fetchInstructorCourseDetail,
  fetchInstructorCourseExpenses,
  fetchInstructorExpenseTypes,
  fetchInstructorRoster,
  fetchMe,
  getToken,
  markInstructorAttendance,
  submitInstructorExpense,
  fetchInstructorPreClassEmail,
  uploadInstructorExpenseReceipt,
  instructorAgreeCourseAccounting,
  fetchInstructorPortalInstructors,
  downloadInstructorCourseExport,
  type ExpenseCatalogItem,
  type MeUser,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow, legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import { courseDisplayName } from '@/lib/courseTableDisplay'
import {
  formatCourseAddress,
  formatGraduationLine,
  instructorCourseBucket,
} from '@/lib/coursePortalDisplay'
import { formatCourseSessionLines } from '@/lib/usDate'
import CourseEnrolledStudentsEmailDialog from '@/components/portal/CourseEnrolledStudentsEmailDialog'
import { registeredEmailsFromEnrollmentRows } from '@/lib/courseRosterEmail'
import { formatExpenseSubmittedAt } from '@/lib/expenseDisplay'
import {
  attendanceStatusFromCell,
  lookupAttendanceCell,
  rosterSeatKey,
} from '@/lib/courseRosterAttendance'
import {
  buildInstructorNameLookupFromPortal,
  instructorDisplayName,
  mapPortalInstructors,
} from '@/lib/portalInstructors'
import type { InstructorOption } from '@/lib/adminCourseFormModel'
import ExpenseReceiptViewerDialog from '@/components/portal/ExpenseReceiptViewerDialog'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { formatInlineBackLabel } from '@/lib/formatTitleCase'
import { Calculator, ClipboardList, FileSpreadsheet, LayoutDashboard, Mail, Receipt, Users } from 'lucide-react'

type Tab = 'overview' | 'roster' | 'attendance' | 'preclass' | 'expenses' | 'accounting'
type Exp = Record<string, unknown>
const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Course context + quick stats' },
  { id: 'roster', label: 'Roster', icon: Users, description: 'Students enrolled in this class' },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList, description: 'Legacy attendance records' },
  { id: 'preclass', label: 'Pre-class', icon: LayoutDashboard, description: 'Venue + instructor prep details' },
  { id: 'expenses', label: 'Class expenses', icon: Receipt, description: 'Submit + peer review' },
  { id: 'accounting', label: 'Accounting', icon: Calculator, description: 'Totals + payments received' },
]

function listNames(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x || '').trim()).filter(Boolean).join(', ')
  const s = String(v || '').trim()
  return s || 'TBD'
}

export default function InstructorCourseWorkspacePage() {
  const params = useParams<{ courseId: string }>()
  const courseId = decodeURIComponent(String(params.courseId || ''))
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') || 'overview') as Tab
  const tab: Tab = ['overview', 'roster', 'attendance', 'preclass', 'expenses', 'accounting'].includes(initialTab)
    ? initialTab
    : 'overview'
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [course, setCourse] = useState<Record<string, unknown> | null>(null)
  const [instructorDisplayNames, setInstructorDisplayNames] = useState<string[]>([])
  const [accounting, setAccounting] = useState<Record<string, unknown> | null>(null)
  const [myLinkId, setMyLinkId] = useState<string | null>(null)
  const [roster, setRoster] = useState<Record<string, unknown>[]>([])
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([])
  const [expenses, setExpenses] = useState<Exp[]>([])
  const [sessionDay, setSessionDay] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [expenseType, setExpenseType] = useState('')
  const [expenseTypeOther, setExpenseTypeOther] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [expenseTypes, setExpenseTypes] = useState<ExpenseCatalogItem[]>([])
  const [attDraft, setAttDraft] = useState<Record<string, { status: string; note: string }>>({})
  const [preClassEmail, setPreClassEmail] = useState<{ subject?: string; html?: string } | null>(null)
  const [receiptFileName, setReceiptFileName] = useState('')
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [agreeBusy, setAgreeBusy] = useState(false)
  const [emailStudentsOpen, setEmailStudentsOpen] = useState(false)
  const [emailStudentEmails, setEmailStudentEmails] = useState<string[]>([])
  const [emailDialogVariant, setEmailDialogVariant] = useState<'bulk' | 'simple'>('bulk')
  const [portalInstructors, setPortalInstructors] = useState<InstructorOption[]>([])
  const [receiptViewUrl, setReceiptViewUrl] = useState('')
  const [receiptViewOpen, setReceiptViewOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
        const link = u.primaryInstructorId || u.id
        setMyLinkId(link)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me || !courseId) return
    fetchInstructorCourseDetail(courseId)
      .then((d) => {
        if (d?.course) {
          setCourse(d.course as Record<string, unknown>)
          setInstructorDisplayNames(Array.isArray(d.instructorDisplayNames) ? d.instructorDisplayNames : [])
        } else {
          setCourse(null)
          setInstructorDisplayNames([])
        }
      })
      .catch(() => {
        setCourse(null)
        setInstructorDisplayNames([])
      })
    fetchInstructorRoster(courseId)
      .then((d) => setRoster(legacyAsObjectArray(d.rows)))
      .catch(() => setRoster([]))
    fetchInstructorAttendanceByCourse(courseId)
      .then((d) => setAttendance(legacyAsObjectArray(d)))
      .catch(() => setAttendance([]))
    fetchInstructorCourseExpenses(courseId)
      .then((d) => setExpenses(legacyAsObjectArray(d)))
      .catch(() => setExpenses([]))
    fetchInstructorExpenseTypes()
      .then((rows) => setExpenseTypes(Array.isArray(rows) ? rows : []))
      .catch(() => setExpenseTypes([]))
    fetchInstructorCourseAccounting(courseId)
      .then((a) => setAccounting(a && typeof a === 'object' ? (a as Record<string, unknown>) : null))
      .catch(() => setAccounting(null))
    fetchInstructorPortalInstructors()
      .then((rows) => setPortalInstructors(mapPortalInstructors(Array.isArray(rows) ? rows : [])))
      .catch(() => setPortalInstructors([]))
  }, [me, courseId])

  const instructorNameLookup = useMemo(
    () => buildInstructorNameLookupFromPortal(portalInstructors),
    [portalInstructors],
  )

  useEffect(() => {
    if (tab !== 'preclass' || !courseId) return
    fetchInstructorPreClassEmail(courseId)
      .then((d) => setPreClassEmail(d))
      .catch(() => setPreClassEmail(null))
  }, [tab, courseId])

  useEffect(() => {
    if (tab !== 'accounting' || !courseId) return
    fetchInstructorCourseAccounting(courseId)
      .then((a) => setAccounting(a && typeof a === 'object' ? (a as Record<string, unknown>) : null))
      .catch(() => setAccounting(null))
  }, [tab, courseId])

  const sessionLines = useMemo(() => {
    const starts = Array.isArray(course?.sessionStarts)
      ? (course?.sessionStarts as unknown[]).map(String)
      : Array.isArray(course?.starts)
        ? (course?.starts as unknown[]).map(String)
        : []
    const ends = Array.isArray(course?.sessionEnds) ? (course?.sessionEnds as unknown[]).map(String) : []
    return formatCourseSessionLines(starts, ends)
  }, [course])
  const graduationLine = course ? formatGraduationLine(course) : ''
  const courseAddress = course ? formatCourseAddress(course) : ''
  const maxSessionDay = Math.max(1, sessionLines.filter((l) => l !== 'Dates TBA').length || 1)

  const attendanceByKey = useMemo(() => {
    const m = new Map<string, Record<string, unknown>>()
    attendance.forEach((r) => m.set(`${String(r.studentUserId || '')}:${Number(r.sessionDay || 0)}`, r))
    return m
  }, [attendance])

  useEffect(() => {
    const next: Record<string, { status: string; note: string }> = {}
    roster.forEach((r, i) => {
      const { seatKey, cell } = lookupAttendanceCell(attendanceByKey, r, i, sessionDay)
      next[seatKey] = {
        status: attendanceStatusFromCell(cell),
        note: String(cell?.note || ''),
      }
    })
    setAttDraft(next)
  }, [sessionDay, roster, attendanceByKey])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const courseName = course ? courseDisplayName(course) : `Course ${courseId.slice(0, 8)}`
  const location = String(course?.locationName || course?.venueName || 'Location TBD')
  const status = String(course?.status || 'Pending')
  const instructors =
    instructorDisplayNames.length > 0
      ? instructorDisplayNames.join(', ')
      : listNames(course?.instructorNames || course?.instructors || course?.instructorName || course?.primaryInstructorName)
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const paidExpenseCount = expenses.filter((e) => /paid/i.test(String(e.status || ''))).length
  const expenseAgreedIds = Array.isArray(course?.expenseInstructorAgree)
    ? (course!.expenseInstructorAgree as unknown[]).map(String)
    : []
  const iAgreedAccounting = Boolean(myLinkId && expenseAgreedIds.includes(String(myLinkId)))
  const courseLocked = instructorCourseBucket(course) !== 'upcoming'

  async function refreshAttendanceAndExpenses() {
    const [att, ex, ac] = await Promise.all([
      fetchInstructorAttendanceByCourse(courseId).catch(() => []),
      fetchInstructorCourseExpenses(courseId).catch(() => []),
      fetchInstructorCourseAccounting(courseId).catch(() => null),
    ])
    setAttendance(legacyAsObjectArray(att))
    setExpenses(legacyAsObjectArray(ex))
    setAccounting(ac && typeof ac === 'object' ? (ac as Record<string, unknown>) : null)
  }

  async function markAttendance(studentUserId: string, status: string, note: string) {
    if (courseLocked) return
    setBusy(`${studentUserId}-${sessionDay}`)
    setMsg('')
    const st = status.trim().toUpperCase()
    const present = st === 'P' || st === 'T'
    const res = await markInstructorAttendance({ courseId, studentUserId, sessionDay, present, status: st, note })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to save attendance')
      return
    }
    await refreshAttendanceAndExpenses()
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault()
    if (courseLocked) return
    const n = parseFloat(amount)
    if (!(n > 0) || !description.trim()) {
      setMsg('Amount and description are required.')
      return
    }
    setMsg('')
    const res = await submitInstructorExpense({
      courseId,
      amount: n,
      description: description.trim(),
      expenseType: (expenseType === 'Other' ? expenseTypeOther : expenseType).trim(),
      receiptUrl: receiptUrl.trim(),
    })
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to submit expense')
      return
    }
    setAmount('')
    setDescription('')
    setExpenseType('')
    setExpenseTypeOther('')
    setReceiptUrl('')
    setReceiptFileName('')
    setMsg('Expense submitted.')
    await refreshAttendanceAndExpenses()
  }

  async function exportFile(kind: 'roster' | 'attendance') {
    setMsg('')
    try {
      const safe = (s: string) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      const rawStarts = Array.isArray(course?.sessionStarts)
        ? course?.sessionStarts
        : Array.isArray((course as any)?.starts)
          ? (course as any)?.starts
          : []
      const first = rawStarts?.[0] ? String(rawStarts[0]) : ''
      const datePart = first.length >= 10 ? first.substring(0, 10) : first || 'event'
      const filename = `${safe(courseName)}_${safe(location) || 'location'}_${datePart}_${kind}.xlsx`
      await downloadInstructorCourseExport(courseId, kind, filename)
    } catch (e) {
      setMsg(String((e as Error).message || 'Export failed'))
    }
  }

  async function reloadCourse() {
    const d = await fetchInstructorCourseDetail(courseId).catch(() => null)
    if (d?.course) setCourse(d.course as Record<string, unknown>)
  }

  async function agreeCourseAccounting() {
    if (courseLocked) return
    setAgreeBusy(true)
    setMsg('')
    const res = await instructorAgreeCourseAccounting(courseId)
    setAgreeBusy(false)
    if (!res.ok) {
      setMsg((await res.text()) || 'Could not record agreement')
      return
    }
    setMsg('You agreed with the course expense accounting.')
    await reloadCourse()
  }

  function num(v: unknown): number {
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    const n = parseFloat(String(v ?? ''))
    return Number.isFinite(n) ? n : 0
  }

  const myPayments = Array.isArray(accounting?.myInstructorPayments)
    ? (accounting!.myInstructorPayments as Record<string, unknown>[])
    : []

  return (
    <>
      <PortalPageHeader
        title="Course workspace"
        subtitle="Use this workspace to understand the class context, roster, attendance records, and course expenses."
      />
      <Link href="/portal/instructor/trainings" className="mb-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline">
        {formatInlineBackLabel('← Back to trainings')}
      </Link>

      <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0b2a3f] to-[#0d9488] p-5 text-white shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200">Course workspace</p>
            <p className="text-3xl font-extrabold">{courseName}</p>
            <p className="mt-1 text-sm text-slate-100">{location}</p>
            <p className="mt-1 text-sm text-slate-200">{courseAddress}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900/40 px-3 py-1 text-xs font-semibold">{status}</span>
          </div>
        </div>
        {courseLocked ? (
          <p className="mb-4 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-sm text-amber-50">
            This course is completed. Attendance edits, pre-class email, expense submissions, and accounting agreement
            are read-only.
          </p>
        ) : null}
        <div className="grid gap-4 border-t border-white/20 pt-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Sessions</p>
            {sessionLines.map((line, i) => (
              <p key={`sess-${i}`} className="text-sm text-slate-100">
                {line}
              </p>
            ))}
            {graduationLine ? (
              <p className="mt-2 text-sm font-semibold text-teal-100">
                Graduation: {graduationLine}
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Instructors</p>
            <p className="text-sm text-slate-100">{instructors}</p>
          </div>
        </div>
      </section>
      {msg && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{msg}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportFile('roster')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          Download roster (.xlsx)
        </button>
        <button
          type="button"
          onClick={() => exportFile('attendance')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:border-[#0d9488]"
        >
          <ClipboardList className="size-4" aria-hidden />
          Download attendance (.xlsx)
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Course tabs</p>
          <div className="space-y-1">
            {NAV.map((n) => {
              const Icon = n.icon
              const active = tab === n.id
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    router.replace(`/portal/instructor/courses/${encodeURIComponent(courseId)}?tab=${n.id}`)
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-bold">{n.label}</span>
                  </div>
                  <p className={`mt-1 text-xs ${active ? 'text-slate-200' : 'text-slate-500'}`}>{n.description}</p>
                </button>
              )
            })}
          </div>
        </aside>

        <section>
          {tab === 'overview' && (
        <>
          <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Students</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{roster.length}</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Attendance rows</p>
                <p className="mt-1 text-2xl font-bold text-indigo-900">{attendance.length}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Expense rows</p>
                <p className="mt-1 text-2xl font-bold text-amber-900">{expenses.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Total expenses</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">${totalExpenseAmount.toFixed(2)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">
              Use this workspace like course details: review roster context, attendance records, pre-class details,
              and course expenses in one place.
            </p>
          </section>
        </>
          )}

          {tab === 'roster' && (
        <>
          <h2 className="mb-3 font-bold text-slate-900">Roster</h2>
          {roster.length === 0 ? (
            <p className="text-sm text-slate-500">No portal enrollments for this course yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, i) => {
                    const email = String(r.studentEmail || '').trim()
                    const phone = formatUsPhoneDisplay(r.studentPhone || r.phone || r.contactNumber || '')
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-900">
                          {String(r.studentFirstName || '')} {String(r.studentLastName || '')}
                        </td>
                        <td className="p-3 text-slate-600">
                          {email ? (
                            <span className="inline-flex items-center gap-2">
                              <span>{email}</span>
                              <button
                                type="button"
                                disabled={courseLocked}
                                className="rounded-md border border-slate-200 p-1 text-slate-600 hover:border-[#0d9488] hover:text-[#0d9488] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Email ${email}`}
                                onClick={() => {
                                  setEmailDialogVariant('simple')
                                  setEmailStudentEmails([email])
                                  setEmailStudentsOpen(true)
                                }}
                              >
                                <Mail className="h-4 w-4" aria-hidden />
                              </button>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{phone || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
          )}

          {tab === 'attendance' && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Attendance</h2>
            <select
              value={sessionDay}
              onChange={(e) => setSessionDay(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              {Array.from({ length: maxSessionDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                  {sessionLines[d - 1] && sessionLines[d - 1] !== 'Dates TBA'
                    ? ` — ${sessionLines[d - 1]}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          {roster.length === 0 ? (
            <p className="text-sm text-slate-500">No roster rows for attendance marking.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Current</th>
                    <th className="p-3">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, i) => {
                    const seatKey = rosterSeatKey(r, i)
                    const { cell } = lookupAttendanceCell(attendanceByKey, r, i, sessionDay)
                    const curStatus = attendanceStatusFromCell(cell)
                    const draft = attDraft[seatKey] ?? { status: curStatus, note: String(cell?.note || '') }
                    return (
                      <tr key={`${seatKey}-${i}`} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-900">
                          {String(r.studentFirstName || '')} {String(r.studentLastName || '')}
                        </td>
                        <td className="p-3 text-slate-600">{String(r.studentEmail || '—')}</td>
                        <td className="p-3 font-semibold text-slate-900">{curStatus || '-'}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={draft.status}
                              disabled={courseLocked}
                              onChange={(e) =>
                                setAttDraft((prev) => ({
                                  ...prev,
                                  [seatKey]: { ...draft, status: e.target.value },
                                }))
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select</option>
                              <option value="P">P</option>
                              <option value="X">X</option>
                              <option value="T">T</option>
                              <option value="E">E</option>
                              <option value="IN">IN</option>
                            </select>
                            <input
                              value={draft.note}
                              disabled={courseLocked}
                              onChange={(e) =>
                                setAttDraft((prev) => ({
                                  ...prev,
                                  [seatKey]: { ...draft, note: e.target.value },
                                }))
                              }
                              placeholder="Note"
                              className="min-w-[180px] rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                              type="button"
                              disabled={courseLocked || busy === `${seatKey}-${sessionDay}`}
                              onClick={() => markAttendance(seatKey, draft.status, draft.note)}
                              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {maxSessionDay > 0 && roster.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">Attendance history</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-3">Student</th>
                      {Array.from({ length: maxSessionDay }, (_, i) => i + 1).map((d) => (
                        <th key={d} className="p-3">
                          {sessionLines[d - 1] && sessionLines[d - 1] !== 'Dates TBA'
                            ? sessionLines[d - 1]
                            : `Day ${d}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((r, i) => {
                      const seatKey = rosterSeatKey(r, i)
                      return (
                        <tr key={`hist-${seatKey}-${i}`} className="border-t border-slate-100">
                          <td className="p-3 font-medium text-slate-900">
                            {String(r.studentFirstName || '')} {String(r.studentLastName || '')}
                          </td>
                          {Array.from({ length: maxSessionDay }, (_, j) => j + 1).map((d) => {
                            const { cell } = lookupAttendanceCell(attendanceByKey, r, i, d)
                            const st = attendanceStatusFromCell(cell)
                            return (
                              <td key={`${seatKey}-day-${d}`} className="p-3 text-slate-700">
                                {st || '—'}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
          )}

          {tab === 'preclass' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-bold text-slate-900">Pre-class details</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Venue</dt>
              <dd className="font-medium text-slate-900">{String(course?.venueName || course?.locationName || '—')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Venue address</dt>
              <dd className="font-medium text-slate-900">{String(course?.venueAddress || course?.address || '—')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Point of contact</dt>
              <dd className="font-medium text-slate-900">
                {String(course?.venueContactName || course?.locationPointContact || course?.venuePocName || course?.venuePointOfContact || '—')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">POC phone</dt>
              <dd className="font-medium text-slate-900">
                {formatUsPhoneDisplay(
                  course?.venueContactPhone ||
                    course?.locationPointContactPh ||
                    course?.venuePocPhone ||
                    course?.venuePointOfContactPhone ||
                    ''
                ) || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Closest hospital</dt>
              <dd className="font-medium text-slate-900">{String(course?.nearestHospital || course?.locationCloseHospital || '—')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Class location (if different)</dt>
              <dd className="font-medium text-slate-900">{String(course?.classLocation || '—')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Decision / cancel by</dt>
              <dd className="font-medium text-slate-900">{String(course?.decisionDateDisplay || course?.decisionDateTo || '—')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Min / Max students</dt>
              <dd className="font-medium text-slate-900">
                {String(course?.minStudentCount ?? '—')} / {String(course?.maxStudents ?? '—')}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Directions</dt>
              <dd className="whitespace-pre-line font-medium text-slate-900">{String(course?.directions || '—')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Parking instructions</dt>
              <dd className="whitespace-pre-line font-medium text-slate-900">{String(course?.parkingInfo || '—')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Lunch details</dt>
              <dd className="whitespace-pre-line font-medium text-slate-900">{String(course?.lunchInfo || '—')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Pre-class instructions</dt>
              <dd className="whitespace-pre-line font-medium text-slate-900">
                {String(course?.preClassInstructions || course?.notes || '—')}
              </dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="mb-2 font-bold text-slate-900">Pre-class email</h3>
            <p className="mb-3 text-sm text-slate-600">
              Send pre-class information to enrolled students (legacy parity — server send with merged template).
            </p>
            {preClassEmail?.subject ? (
              <p className="mb-2 text-sm">
                <span className="font-semibold text-slate-700">Template subject:</span> {preClassEmail.subject}
              </p>
            ) : null}
            <button
              type="button"
              disabled={courseLocked || roster.length === 0}
              onClick={() => {
                setEmailDialogVariant('bulk')
                setEmailStudentEmails(registeredEmailsFromEnrollmentRows(roster))
                setEmailStudentsOpen(true)
              }}
              className="inline-flex rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Email enrolled students
            </button>
          </div>
        </section>
          )}

          {tab === 'expenses' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">Course expenses</h2>
            <button
              type="button"
              disabled={courseLocked || agreeBusy || iAgreedAccounting}
              onClick={() => void agreeCourseAccounting()}
              className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {iAgreedAccounting ? 'You agreed with accounting' : agreeBusy ? 'Saving…' : 'I agree with course expenses'}
            </button>
          </div>
          <p className="mb-2 text-sm text-slate-600">
            Total: <span className="font-semibold">${totalExpenseAmount.toFixed(2)}</span> · Paid rows:{' '}
            <span className="font-semibold">{paidExpenseCount}</span>
            {' · '}
            <button
              type="button"
              className="font-semibold text-[#0d9488] underline hover:text-[#0f766e]"
              onClick={() =>
                router.replace(`/portal/instructor/courses/${encodeURIComponent(courseId)}?tab=accounting`)
              }
            >
              Open accounting
            </button>{' '}
            for course totals and payments entered by admin.
          </p>
          <p className="mb-4 text-sm text-slate-600">
            Review all course expenses below, then use <span className="font-semibold">I agree with course expenses</span>{' '}
            when you have reviewed receipts from every instructor (legacy parity — not per-line approval).
          </p>
          <form
            onSubmit={submitExpense}
            className={`mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 ${courseLocked ? 'opacity-60' : ''}`}
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Submit expense</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                disabled={courseLocked}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />
              <select
                value={expenseType}
                disabled={courseLocked}
                onChange={(e) => setExpenseType(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select expense type</option>
                {expenseTypes.map((t) => {
                  const label = String(t.name || t.label || t.type || '').trim()
                  if (!label) return null
                  const key = String(t._id || t.dumId || label)
                  return (
                    <option key={key} value={label}>
                      {label}
                    </option>
                  )
                })}
                <option value="Other">Other</option>
              </select>
              {expenseType === 'Other' && (
                <input
                  value={expenseTypeOther}
                  disabled={courseLocked}
                  onChange={(e) => setExpenseTypeOther(e.target.value)}
                  placeholder="Custom expense type"
                  className="rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}
              <input
                value={description}
                disabled={courseLocked}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Receipt (optional)</label>
                <input
                  type="file"
                  disabled={courseLocked}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.tif,.tiff,.doc,.docx,.txt,.rtf,image/*,application/pdf"
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    setReceiptUploading(true)
                    const res = await uploadInstructorExpenseReceipt(f)
                    setReceiptUploading(false)
                    if (!res.ok) {
                      setMsg('Receipt upload failed')
                      setReceiptUrl('')
                      setReceiptFileName('')
                      return
                    }
                    const j = (await res.json()) as { receiptUrl?: string }
                    setReceiptUrl(String(j.receiptUrl || ''))
                    setReceiptFileName(f.name)
                  }}
                />
                {receiptFileName ? (
                  <p className="mt-1 text-xs text-emerald-800">Attached: {receiptFileName}</p>
                ) : null}
                {receiptUploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
              </div>
            </div>
            <button
              type="submit"
              disabled={courseLocked}
              className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit expense
            </button>
          </form>
          {expenses.length === 0 ? (
            <p className="text-sm text-slate-500">No expense rows for this course yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Receipt</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
              {expenses.map((e, i) => {
                const id = String(e.id || i)
                const st = String(e.status || '—')
                const submitterId = String(e.instructorUserId || '')
                const submitterName = instructorDisplayName(instructorNameLookup, submitterId)
                const receipt = String(e.receiptUrl || '').trim()
                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="p-3 font-semibold text-slate-900">${Number(e.amount || 0).toFixed(2)}</td>
                    <td className="p-3 text-slate-700">{String(e.expenseType || 'General')}</td>
                    <td className="p-3 text-slate-700">{String(e.description || '—')}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">
                        {st}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{formatExpenseSubmittedAt(e.submittedAt)}</td>
                    <td className="p-3 text-slate-700">{submitterName}</td>
                    <td className="p-3 text-slate-600">
                      {receipt ? (
                        <button
                          type="button"
                          className="font-semibold text-[#0d9488] hover:underline"
                          onClick={() => {
                            setReceiptViewUrl(receipt)
                            setReceiptViewOpen(true)
                          }}
                        >
                          View
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
            </div>
          )}
        </section>
          )}

          {tab === 'accounting' && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-1 font-bold text-slate-900">Accounting</h2>
                <p className="mb-4 text-sm text-slate-600">
                  Your payments and class expense summary. Course revenue totals are visible to admin only (legacy parity).
                </p>
                {accounting ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Approved / paid expenses (course)</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-900">${num(accounting.totalExpenses).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Expense rows</p>
                      <p className="mt-1 text-2xl font-bold text-amber-900">{num(accounting.expenseRows)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Loading accounting…</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-bold text-slate-900">Payments received (admin)</h3>
                {myPayments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payment records for you on this course yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myPayments.map((row, idx) => (
                          <tr
                            key={
                              coerceMongoIdFromRow(row) ||
                              `payment-${idx}-${String(row.paymentDate || '')}-${String(row.amount || '')}`
                            }
                            className="border-t border-slate-100"
                          >
                            <td className="p-3 text-slate-700">
                              {row.paymentDate
                                ? new Date(String(row.paymentDate)).toLocaleDateString('en-US')
                                : '—'}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">${num(row.amount).toFixed(2)}</td>
                            <td className="p-3 text-slate-600">
                              {String(row.notes || row.description || row.memo || row.note || '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-bold text-slate-900">Course expenses (all instructors)</h3>
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-500">No expenses on this course yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="p-3">Instructor</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Submitted</th>
                          <th className="p-3">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e, idx) => {
                          const submitterId = String(e.instructorUserId || '')
                          const receipt = String(e.receiptUrl || '').trim()
                          return (
                            <tr key={String(e.id || idx)} className="border-t border-slate-100">
                              <td className="p-3 text-slate-800">
                                {instructorDisplayName(instructorNameLookup, submitterId)}
                                {myLinkId && submitterId === myLinkId ? (
                                  <span className="ml-1 text-xs font-semibold text-emerald-700">(you)</span>
                                ) : null}
                              </td>
                              <td className="p-3 text-slate-700">{String(e.expenseType || 'General')}</td>
                              <td className="p-3 font-semibold text-slate-900">${Number(e.amount || 0).toFixed(2)}</td>
                              <td className="p-3 text-slate-700">{String(e.status || '—')}</td>
                              <td className="p-3 text-slate-600">{formatExpenseSubmittedAt(e.submittedAt)}</td>
                              <td className="p-3">
                                {receipt ? (
                                  <button
                                    type="button"
                                    className="font-semibold text-[#0d9488] hover:underline"
                                    onClick={() => {
                                      setReceiptViewUrl(receipt)
                                      setReceiptViewOpen(true)
                                    }}
                                  >
                                    View
                                  </button>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-3 text-sm text-slate-600">
                  When you have reviewed every line item, use{' '}
                  <span className="font-semibold">I agree with course expenses</span> on the Class expenses tab (legacy parity).
                </p>
              </div>
            </section>
          )}
        </section>
      </div>

      <CourseEnrolledStudentsEmailDialog
        open={emailStudentsOpen}
        onOpenChange={setEmailStudentsOpen}
        courseId={courseId}
        courseTitle={courseName}
        studentEmails={emailStudentEmails}
        audience="instructor"
        variant={emailDialogVariant}
      />

      <ExpenseReceiptViewerDialog
        open={receiptViewOpen}
        receiptUrl={receiptViewUrl}
        onClose={() => {
          setReceiptViewOpen(false)
          setReceiptViewUrl('')
        }}
      />

    </>
  )
}
