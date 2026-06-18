'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calculator,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Mail,
  Receipt,
  Users,
} from 'lucide-react'
import {
  approveExpense,
  assignOtherCourse,
  bulkMarkAdminCourseAttendance,
  closeAdminCourse,
  fetchAdminCourses,
  fetchAdminCourseAttendance,
  downloadAdminCourseExport,
  fetchAdminCourse,
  fetchAdminCourseAccounting,
  fetchAdminCourseEnrollments,
  fetchAdminCourseExpenses,
  fetchAdminCompletedInstructors,
  fetchAdminPreClassEmail,
  fetchAdminUsers,
  fetchMe,
  getToken,
  markAdminCourseAttendance,
  markExpensePaid,
  rejectExpense,
  saveAdminInstructorPayment,
  type AdminCourseAttendanceRow,
  type AdminCourseEnrollmentRow,
  type MeUser,
} from '@/lib/portalApi'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { formatUsDate, formatUsDateTime, usToYmd } from '@/lib/usDate'
import { courseDisplayName } from '@/lib/courseTableDisplay'
import { formatCourseAddress, formatGraduationLine, isCourseCompleted } from '@/lib/coursePortalDisplay'
import { formatCourseSessionLines } from '@/lib/usDate'
import CourseEnrolledStudentsEmailDialog from '@/components/portal/CourseEnrolledStudentsEmailDialog'
import ExpenseReceiptViewerDialog from '@/components/portal/ExpenseReceiptViewerDialog'
import { registeredEmailsFromEnrollmentRows } from '@/lib/courseRosterEmail'
import { formatExpenseSubmittedAt } from '@/lib/expenseDisplay'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import {
  adminCanApproveExpense,
  adminCanMarkPaid,
  adminCanRejectExpense,
  expenseRowId,
} from '@/lib/expenseAdminGroups'
import {
  attendanceStatusFromCell,
  lookupAttendanceCell,
  rosterSeatKey,
} from '@/lib/courseRosterAttendance'
import {
  buildInstructorNameLookupFromAdminUsers,
  buildInstructorNameLookupFromCrmRows,
  instructorDisplayName,
  mergeInstructorNameLookups,
} from '@/lib/portalInstructors'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Tab = 'details' | 'roster' | 'attendance' | 'preclass' | 'expenses' | 'complete' | 'accounting'
type Exp = Record<string, unknown>

function moneyLabel(v: unknown): string {
  const raw = String(v ?? '').trim()
  if (!raw) return ''
  if (/^\$/.test(raw)) return raw
  const n = Number(raw.replace(/,/g, ''))
  if (!Number.isFinite(n)) return raw
  return `$${n}`
}

function sessionLabelFromStarts(starts: unknown[], day: number): string {
  const idx = day - 1
  const raw = idx >= 0 && idx < starts.length ? String(starts[idx] ?? '').trim() : ''
  if (!raw) return `Day ${day}`
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return `Day ${day}`
  // Format as "MMM dd yyyy" like legacy dropdown
  return formatUsDate(d)
}

/** Unique React key per roster seat (multi-attendee rows may share payer userId). */
function rosterRowKey(s: AdminCourseEnrollmentRow, index: number): string {
  const id = String(s.id ?? '').trim()
  if (id) return id
  const uid = String(s.userId ?? '').trim()
  const email = String(s.studentEmail ?? '').trim().toLowerCase()
  const name = `${String(s.studentFirstName ?? '').trim()}|${String(s.studentLastName ?? '').trim()}`
  if (uid && email) return `${uid}|${email}`
  if (uid) return uid
  if (email) return `email:${email}|${name}`
  return `roster-row-${index}`
}

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'details', label: 'Overview', icon: LayoutDashboard, description: 'Venue, tuition, description' },
  { id: 'roster', label: 'Roster', icon: Users, description: 'Students enrolled in this class' },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList, description: 'Mark attendance + history' },
  { id: 'preclass', label: 'Pre-class', icon: LayoutDashboard, description: 'Venue info + instructions' },
  { id: 'expenses', label: 'Class expenses', icon: Receipt, description: 'Summary + approvals' },
  { id: 'complete', label: 'Complete', icon: LayoutDashboard, description: 'Instructor agreement gating' },
  { id: 'accounting', label: 'Accounting', icon: Calculator, description: 'Totals for this class' },
]

export default function AdminCourseWorkspacePage() {
  const router = useRouter()
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId || ''
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<Tab>('details')
  const [course, setCourse] = useState<Record<string, unknown> | null>(null)
  const [expenses, setExpenses] = useState<Exp[]>([])
  const [enrollments, setEnrollments] = useState<AdminCourseEnrollmentRow[]>([])
  const [attendanceRows, setAttendanceRows] = useState<AdminCourseAttendanceRow[]>([])
  const [sessionDay, setSessionDay] = useState(1)
  const [accounting, setAccounting] = useState<Record<string, unknown> | null>(null)
  const [adminUsers, setAdminUsers] = useState<Record<string, unknown>[]>([])
  const [crmInstructors, setCrmInstructors] = useState<Record<string, unknown>[]>([])
  const [allCourses, setAllCourses] = useState<Record<string, unknown>[]>([])
  const [preClassEmail, setPreClassEmail] = useState<{ subject?: string; html?: string } | null>(null)
  const [emailStudentsOpen, setEmailStudentsOpen] = useState(false)
  const [emailStudentEmails, setEmailStudentEmails] = useState<string[]>([])
  const [emailDialogVariant, setEmailDialogVariant] = useState<'bulk' | 'simple'>('bulk')
  const [attDraft, setAttDraft] = useState<Record<string, { status: string; note: string }>>({})
  const [receiptViewUrl, setReceiptViewUrl] = useState('')
  const [receiptViewOpen, setReceiptViewOpen] = useState(false)
  const [editAttendanceDay, setEditAttendanceDay] = useState<number | null>(null)
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, { status: string; note: string }>>({})
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; studentUserId: string; toCourseId: string }>(
    { open: false, studentUserId: '', toCourseId: '' }
  )
  const [payInstructorId, setPayInstructorId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(() => formatUsDate(new Date()))
  const [payNote, setPayNote] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/portal/admin/courses/${encodeURIComponent(courseId)}`)
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router, courseId])

  async function refreshAll() {
    if (!courseId) return
    const [c0, ex, ac, enr, att] = await Promise.all([
      fetchAdminCourse(courseId),
      fetchAdminCourseExpenses(courseId),
      fetchAdminCourseAccounting(courseId),
      fetchAdminCourseEnrollments(courseId),
      fetchAdminCourseAttendance(courseId),
    ])
    let c = c0 as Record<string, unknown> | null
    // Fallback: if single-course endpoint misses this id, find it from admin list.
    if (!c) {
      try {
        const rows = await fetchAdminCourses()
        const m = Array.isArray(rows)
          ? (rows as Record<string, unknown>[]).find((r) => String(r.id || '') === courseId)
          : null
        if (m) c = m
      } catch {
        /* ignore fallback errors */
      }
    }
    setCourse(c)
    setExpenses(Array.isArray(ex) ? (ex as Exp[]) : [])
    setEnrollments(Array.isArray(enr) ? enr : [])
    setAttendanceRows(Array.isArray(att) ? att : [])
    setAccounting(ac && typeof ac === 'object' ? (ac as Record<string, unknown>) : null)
    if (!c) setMsg('Course details not found for this id.')

    if (adminUsers.length === 0) {
      try {
        const u = await fetchAdminUsers()
        setAdminUsers(Array.isArray(u) ? (u as Record<string, unknown>[]) : [])
      } catch {
        setAdminUsers([])
      }
    }
    if (crmInstructors.length === 0) {
      try {
        const crm = await fetchAdminCompletedInstructors(false)
        setCrmInstructors(Array.isArray(crm) ? (crm as Record<string, unknown>[]) : [])
      } catch {
        setCrmInstructors([])
      }
    }
    if (allCourses.length === 0) {
      const rows = await fetchAdminCourses()
      setAllCourses(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [])
    }
  }

  useEffect(() => {
    if (!me) return
    refreshAll()
  }, [me, courseId])

  useEffect(() => {
    if (tab !== 'preclass' || !courseId) return
    fetchAdminPreClassEmail(courseId)
      .then((d) => setPreClassEmail(d))
      .catch(() => setPreClassEmail(null))
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
    const m = new Map<string, { status?: string | null; note?: string | null }>()
    attendanceRows.forEach((r) =>
      m.set(`${r.studentUserId}:${r.sessionDay}`, { status: r.status, note: r.note }),
    )
    return m
  }, [attendanceRows])

  useEffect(() => {
    const next: Record<string, { status: string; note: string }> = {}
    enrollments.forEach((s, i) => {
      const { seatKey, cell } = lookupAttendanceCell(
        attendanceByKey,
        s as Record<string, unknown>,
        i,
        sessionDay,
      )
      next[seatKey] = {
        status: attendanceStatusFromCell(cell),
        note: String(cell?.note || ''),
      }
    })
    setAttDraft(next)
  }, [sessionDay, enrollments, attendanceByKey])

  const instructorNameLookup = useMemo(
    () =>
      mergeInstructorNameLookups(
        buildInstructorNameLookupFromAdminUsers(adminUsers),
        buildInstructorNameLookupFromCrmRows(crmInstructors),
      ),
    [adminUsers, crmInstructors],
  )
  const instructorNameFor = (linkId: string): string => instructorDisplayName(instructorNameLookup, linkId)

  async function exportFile(kind: 'roster' | 'attendance') {
    setMsg('')
    try {
      const safe = (s: string) =>
        s
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      const first = sessionStarts[0] ? String(sessionStarts[0]) : ''
      const datePart = first.length >= 10 ? first.substring(0, 10) : first || 'event'
      const filename = `${safe(courseTitle)}_${safe(location) || 'location'}_${datePart}_${kind}.xlsx`
      await downloadAdminCourseExport(courseId, kind, filename)
    } catch (e) {
      setMsg(String((e as Error).message || e))
    }
  }

  function downloadExpenseSummaryCsv() {
    const csvEscape = (v: unknown): string => {
      const s = v == null ? '' : String(v)
      const needsQuotes = /[",\r\n]/.test(s)
      const escaped = s.replace(/"/g, '""')
      return needsQuotes ? `"${escaped}"` : escaped
    }

    const headers = ['Expense name', 'Total amount ($)', ...instructorIds.map((iid) => instructorNameFor(iid))]
    const lines: string[] = []
    lines.push(headers.map(csvEscape).join(','))

    for (const r of expenseSummary.rows) {
      const row = [
        r.expenseType,
        r.total.toFixed(2),
        ...instructorIds.map((iid) => (r.byInstructor.get(iid) ?? 0).toFixed(2)),
      ]
      lines.push(row.map(csvEscape).join(','))
    }

    // Footer totals row (legacy summary parity)
    const footerRow = [
      'Total amount',
      expenseSummary.totalExpense.toFixed(2),
      ...instructorIds.map((iid) => (expenseSummary.instructorTotals.get(iid) ?? 0).toFixed(2)),
    ]
    lines.push(footerRow.map(csvEscape).join(','))

    const safeTitle = courseTitle
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
    const filename = `course_${safeTitle}_expenses_${String(courseId).slice(0, 8)}.csv`

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    setMsg('Expense summary downloaded.')
  }

  async function refreshCourseExpenses() {
    const [ex, ac] = await Promise.all([
      fetchAdminCourseExpenses(courseId),
      fetchAdminCourseAccounting(courseId),
    ])
    setExpenses(Array.isArray(ex) ? (ex as Exp[]) : [])
    setAccounting(ac && typeof ac === 'object' ? (ac as Record<string, unknown>) : null)
  }

  async function expenseAct(id: string, type: 'approve' | 'reject' | 'pay', amount?: number) {
    if (!id || id.startsWith('__row-')) {
      setMsg('This expense row is missing an id; refresh the page and try again.')
      return
    }
    setMsg('')
    setBusy(id + type)
    try {
      const res =
        type === 'approve'
          ? await approveExpense(id)
          : type === 'reject'
            ? await rejectExpense(id)
            : await markExpensePaid(id, amount, 'Paid from course workspace')
      if (!res.ok) {
        const errText = (await res.text().catch(() => '')).trim()
        setMsg(errText || 'Failed to update expense.')
        return
      }
      setMsg(
        type === 'approve'
          ? 'Expense approved.'
          : type === 'reject'
            ? 'Expense rejected.'
            : 'Expense marked paid.',
      )
      await refreshCourseExpenses()
    } finally {
      setBusy(null)
    }
  }

  async function setAttendance(studentUserId: string, status: string, note?: string) {
    setBusy(`att-${studentUserId}-${sessionDay}`)
    const res = await markAdminCourseAttendance(courseId, { studentUserId, sessionDay, status, note })
    setBusy(null)
    if (!res.ok) {
      setMsg('Failed to save attendance.')
      return
    }
    await refreshAll()
  }

  async function saveAttendanceDayBulk(day: number) {
    setBusy(`att-bulk-${day}`)
    const rows = enrollments.map((s, i) => {
      const rowKey = rosterRowKey(s, i)
      const sid = rosterSeatKey(s as Record<string, unknown>, i)
      const d = attendanceDraft[rowKey] || attendanceDraft[sid] || { status: '', note: '' }
      return { studentUserId: sid, status: d.status, note: d.note }
    })
    const res = await bulkMarkAdminCourseAttendance(courseId, { sessionDay: day, rows })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to save attendance day.')
      return
    }
    setEditAttendanceDay(null)
    await refreshAll()
    setMsg('Attendance updated.')
  }

  async function closeCourse() {
    setBusy('close-course')
    const res = await closeAdminCourse(courseId)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to close course.')
      return
    }
    await refreshAll()
    setMsg('Course marked as completed.')
  }

  async function submitAssignOther() {
    setBusy('assign-other')
    try {
      const res = await assignOtherCourse(courseId, {
        studentUserId: assignDialog.studentUserId,
        toCourseId: assignDialog.toCourseId,
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to queue reassignment.')
      setAssignDialog({ open: false, studentUserId: '', toCourseId: '' })
      setMsg('Assignment queued (Pending).')
    } catch (e) {
      setMsg(String((e as Error).message || e))
    }
    setBusy(null)
  }

  async function submitInstructorPayment() {
    const iid = payInstructorId.trim()
    const amt = Number(payAmount)
    if (!iid || !Number.isFinite(amt) || amt <= 0) {
      setMsg('Select instructor and enter a valid amount.')
      return
    }
    setBusy('course-pay-instructor')
    try {
      const res = await saveAdminInstructorPayment({
        instructorId: iid,
        instructorName: instructorNameFor(iid),
        courseId,
        amount: amt,
        paymentDate: (() => {
          const ymd = usToYmd(payDate.trim())
          if (!ymd) return new Date().toISOString()
          const [y, mo, da] = ymd.split('-').map(Number)
          return new Date(y, mo - 1, da, 12, 0, 0, 0).toISOString()
        })(),
        note: payNote.trim() || `Course payout (${courseTitle})`,
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to record payment.')
      setPayAmount('')
      setPayNote('')
      await refreshCourseExpenses()
      setMsg('Instructor payment recorded. It is now visible in Transactions and Payroll.')
    } catch (e) {
      setMsg(String((e as Error).message || e))
    }
    setBusy(null)
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const location = String(course?.locationName || course?.venueName || 'Location TBD')
  const courseTitle = course ? courseDisplayName(course) : `Course ${courseId.slice(0, 8)}`
  const courseLocked = isCourseCompleted(course)
  const totalStudents = enrollments.length
  const totalReceived = accounting?.totalReceived
  const enrollmentRowsForEmail = enrollments as Record<string, unknown>[]
  const sessionStarts = Array.isArray(course?.sessionStarts) ? (course?.sessionStarts as unknown[]) : []

  const instructorIds = (() => {
    const out: string[] = []
    const add = (v: unknown) => {
      const s = String(v ?? '').trim()
      if (s && !out.includes(s)) out.push(s)
    }
    // Prefer explicit course instructor link ids when present.
    const ids = Array.isArray((course as any)?.instructorUserIds)
      ? ((course as any).instructorUserIds as unknown[])
      : []
    ids.forEach(add)
    add((course as any)?.primaryInstructorId)
    add((course as any)?.ownerUserId)
    // Fallback: derive from expenses if course list is missing instructor ids.
    if (out.length === 0) {
      expenses.forEach((e) => add((e as any)?.instructorUserId))
    }
    return out
  })()

  const expenseSummary = (() => {
    const byType = new Map<
      string,
      { expenseType: string; total: number; byInstructor: Map<string, number> }
    >()
    const asNumber = (v: unknown) => {
      const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/,/g, ''))
      return Number.isFinite(n) ? n : 0
    }
    for (const e of expenses) {
      const t = String((e as any).expenseType || 'General').trim() || 'General'
      const inst = String((e as any).instructorUserId || '').trim()
      const amt = asNumber((e as any).amount)
      if (!byType.has(t)) byType.set(t, { expenseType: t, total: 0, byInstructor: new Map() })
      const row = byType.get(t)!
      row.total += amt
      if (inst) row.byInstructor.set(inst, (row.byInstructor.get(inst) ?? 0) + amt)
    }
    const rows = Array.from(byType.values()).sort((a, b) => a.expenseType.localeCompare(b.expenseType))
    const instructorTotals = new Map<string, number>()
    for (const iid of instructorIds) instructorTotals.set(iid, 0)
    for (const r of rows) {
      for (const [iid, amt] of r.byInstructor.entries()) {
        if (!instructorTotals.has(iid)) instructorTotals.set(iid, 0)
        instructorTotals.set(iid, (instructorTotals.get(iid) ?? 0) + amt)
      }
    }
    const totalExpense = Array.from(instructorTotals.values()).reduce((a, b) => a + b, 0)
    return { rows, instructorTotals, totalExpense }
  })()

  const completeState = (() => {
    const agreedBy = new Map<string, boolean>()
    const legacyAgreeRaw = Array.isArray((course as any)?.expenseInstructorAgree)
      ? ((course as any).expenseInstructorAgree as unknown[])
      : []
    const legacyAgree = legacyAgreeRaw.map((x) => String(x)).filter(Boolean)
    const instructorHasAgreed = (iid: string): boolean => {
      if (legacyAgree.includes(iid)) return true
      const hit = adminUsers.find((u) => {
        const id = String(u.id ?? '').trim()
        const pid = String(u.primaryInstructorId ?? '').trim()
        return id === iid || pid === iid
      })
      if (!hit) return false
      const id = String(hit.id ?? '').trim()
      const pid = String(hit.primaryInstructorId ?? '').trim()
      return legacyAgree.includes(id) || Boolean(pid && legacyAgree.includes(pid))
    }
    for (const iid of instructorIds) {
      agreedBy.set(iid, instructorHasAgreed(iid))
    }
    const allAgreed = instructorIds.length > 0 && instructorIds.every((iid) => agreedBy.get(iid))
    return { agreedBy, allAgreed, legacyAgree, instructorHasAgreed }
  })()

  return (
    <>
      <PortalPageHeader
        title="Course workspace"
        subtitle="Review roster, attendance, pre-class details, expenses, and accounting for this class."
      />

      <div className="mb-4">
        <Link
          href="/portal/admin/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d9488] hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All courses
        </Link>
      </div>

      <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0f172a] via-[#0b2a3f] to-[#0d9488] p-5 text-white shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-200">Course workspace</p>
            <p className="text-3xl font-extrabold">{courseTitle}</p>
            <p className="mt-1 text-sm text-slate-100">{location}</p>
            <p className="mt-1 text-sm text-slate-200">{courseAddress}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900/40 px-3 py-1 text-xs font-semibold">
              {String(course?.status || '—')}
            </span>
            <span className="rounded-full bg-slate-900/40 px-3 py-1 text-xs font-semibold">
              {moneyLabel(course?.feeDisplay || course?.courseFees) || 'Tuition TBD'}
            </span>
          </div>
        </div>
        {courseLocked ? (
          <p className="mb-4 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-sm text-amber-50">
            This course is completed. Roster reassignment, attendance edits, pre-class email, completion, and
            accounting payouts are read-only.
          </p>
        ) : null}
        <div className="grid gap-4 border-t border-white/20 pt-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Sessions</p>
            {sessionLines.length === 0 ? (
              <p className="text-sm text-slate-100">—</p>
            ) : (
              sessionLines.map((line, i) => (
                <p key={`sess-${i}`} className="text-sm text-slate-100">
                  {line}
                </p>
              ))
            )}
            {graduationLine ? (
              <p className="mt-2 text-sm font-semibold text-teal-100">Graduation: {graduationLine}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Instructors</p>
            {instructorIds.length === 0 ? (
              <p className="text-sm text-slate-100">—</p>
            ) : (
              <p className="text-sm text-slate-100">{instructorIds.map((iid) => instructorNameFor(iid)).join(', ')}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
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

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? 'bg-[#0f172a] text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Icon className={`size-4 shrink-0 ${active ? 'text-teal-300' : 'text-slate-500'}`} aria-hidden />
                    {item.label}
                  </span>
                  <span className={`text-[11px] leading-snug ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.description}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          {msg && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">{msg}</p>}

          {tab === 'details' && (
            <>
              <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Students</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{totalStudents}</p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Attendance rows</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-900">{attendanceRows.length}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Expense rows</p>
                    <p className="mt-1 text-2xl font-bold text-amber-900">{expenses.length}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Total revenue</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">{String(totalReceived ?? '—')}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-700">
                  Use this workspace to review roster, attendance, pre-class details, class expenses, and accounting for
                  this course.
                </p>
              </section>
            </>
          )}

          {tab === 'roster' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-900">Roster</h3>
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-500">No enrolled students.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((s, i) => {
                        const email = String(s.studentEmail || '').trim()
                        const phone = formatUsPhoneDisplay(String((s as Record<string, unknown>).studentPhone || ''))
                        return (
                          <tr key={rosterRowKey(s, i)} className="border-t border-slate-100">
                            <td className="p-3 font-medium text-slate-900">
                              {String(`${s.studentFirstName || ''} ${s.studentLastName || ''}`.trim() || '—')}
                            </td>
                            <td className="p-3 text-slate-600">
                              {email ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{email}</span>
                                  <button
                                    type="button"
                                    className="rounded-md border border-slate-200 p-1 text-slate-600 hover:border-[#0d9488] hover:text-[#0d9488]"
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
                            <td className="p-3 text-slate-600">{String(s.status || '—')}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                disabled={courseLocked}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-[#00d4aa] disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() =>
                                  setAssignDialog({ open: true, studentUserId: String(s.userId || ''), toCourseId: '' })
                                }
                              >
                                Assign to another course
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                    {String(
                      course?.venueContactName ||
                        course?.locationPointContact ||
                        course?.venuePocName ||
                        course?.venuePointOfContact ||
                        '—',
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">POC phone</dt>
                  <dd className="font-medium text-slate-900">
                    {formatUsPhoneDisplay(
                      String(
                        course?.venueContactPhone ||
                          course?.locationPointContactPh ||
                          course?.venuePocPhone ||
                          course?.venuePointOfContactPhone ||
                          '',
                      ),
                    ) || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Closest hospital</dt>
                  <dd className="font-medium text-slate-900">
                    {String(course?.nearestHospital || course?.locationCloseHospital || '—')}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Class location (if different)</dt>
                  <dd className="font-medium text-slate-900">{String(course?.classLocation || '—')}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Directions</dt>
                  <dd className="whitespace-pre-line font-medium text-slate-900">{String(course?.directions || '—')}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Parking instructions</dt>
                  <dd className="whitespace-pre-line font-medium text-slate-900">
                    {String(course?.parkingInfo || course?.parkingInstructions || '—')}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Lunch details</dt>
                  <dd className="whitespace-pre-line font-medium text-slate-900">
                    {String(course?.lunchInfo || course?.lunchDetails || '—')}
                  </dd>
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
                  Send pre-class information to enrolled students (server send with optional pre-class template).
                </p>
                {preClassEmail?.subject ? (
                  <p className="mb-2 text-sm">
                    <span className="font-semibold text-slate-700">Template subject:</span> {preClassEmail.subject}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={courseLocked || enrollments.length === 0}
                  onClick={() => {
                    setEmailDialogVariant('bulk')
                    setEmailStudentEmails(registeredEmailsFromEnrollmentRows(enrollmentRowsForEmail))
                    setEmailStudentsOpen(true)
                  }}
                  className="inline-flex rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Email enrolled students
                </button>
              </div>
            </section>
          )}

          {tab === 'attendance' && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Attendance</h3>
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
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-500">No roster rows for attendance marking.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Email</th>
                        <th className="w-16 p-3">Current</th>
                        <th className="min-w-[320px] p-3">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((s, i) => {
                        const rowKey = rosterRowKey(s, i)
                        const seatKey = rosterSeatKey(s as Record<string, unknown>, i)
                        const { cell } = lookupAttendanceCell(
                          attendanceByKey,
                          s as Record<string, unknown>,
                          i,
                          sessionDay,
                        )
                        const curStatus = attendanceStatusFromCell(cell)
                        const draft = attDraft[seatKey] ?? { status: curStatus, note: String(cell?.note || '') }
                        return (
                          <tr key={`${rowKey}-att-${sessionDay}`} className="border-t border-slate-100">
                            <td className="p-3 font-medium text-slate-900">
                              {String(`${s.studentFirstName || ''} ${s.studentLastName || ''}`.trim() || '—')}
                            </td>
                            <td className="max-w-[200px] truncate p-3 text-slate-600" title={String(s.studentEmail || '')}>
                              {String(s.studentEmail || '—')}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">{curStatus || '—'}</td>
                            <td className="p-3">
                              <div className="flex flex-nowrap items-center gap-2">
                                <select
                                  value={draft.status}
                                  disabled={courseLocked}
                                  onChange={(e) =>
                                    setAttDraft((prev) => ({
                                      ...prev,
                                      [seatKey]: { ...draft, status: e.target.value },
                                    }))
                                  }
                                  className="shrink-0 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
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
                                  className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <button
                                  type="button"
                                  disabled={courseLocked || busy === `att-${seatKey}-${sessionDay}`}
                                  onClick={() => setAttendance(seatKey, draft.status, draft.note)}
                                  className="shrink-0 rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* History matrix */}
              {maxSessionDay > 0 && enrollments.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-base font-bold text-slate-900">Attendance history</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 font-semibold text-slate-700">Student</th>
                          {Array.from({ length: maxSessionDay }, (_, i) => i + 1).map((d) => (
                            <th key={d} className="p-3 font-semibold text-slate-700">
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  {sessionLines[d - 1] && sessionLines[d - 1] !== 'Dates TBA'
                                    ? sessionLines[d - 1]
                                    : `Day ${d}`}
                                </span>
                                <button
                                  type="button"
                                  disabled={courseLocked}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:border-[#00d4aa] disabled:cursor-not-allowed disabled:opacity-50"
                                  onClick={() => {
                                    setEditAttendanceDay(d)
                                    const next: Record<string, { status: string; note: string }> = {}
                                    enrollments.forEach((s, i) => {
                                      const rowKey = rosterRowKey(s, i)
                                      const { cell } = lookupAttendanceCell(
                                        attendanceByKey,
                                        s as Record<string, unknown>,
                                        i,
                                        d,
                                      )
                                      next[rowKey] = {
                                        status: attendanceStatusFromCell(cell),
                                        note: String(cell?.note || ''),
                                      }
                                    })
                                    setAttendanceDraft(next)
                                  }}
                                >
                                  Edit
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((s, rowIdx) => {
                          const rowKey = rosterRowKey(s, rowIdx)
                          return (
                            <tr key={`hist-${rowKey}`} className="border-t border-slate-100">
                              <td className="p-3 text-slate-800">
                                <strong>{String(`${s.studentFirstName || ''} ${s.studentLastName || ''}`.trim() || '—')}</strong>
                              </td>
                              {Array.from({ length: maxSessionDay }, (_, i) => i + 1).map((d) => {
                                const { cell } = lookupAttendanceCell(
                                  attendanceByKey,
                                  s as Record<string, unknown>,
                                  rowIdx,
                                  d,
                                )
                                const st = attendanceStatusFromCell(cell)
                                return (
                                  <td key={`${rowKey}-day-${d}`} className="p-3 text-slate-700">
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

          {tab === 'expenses' && (
            <div className="space-y-6">
              {completeState.allAgreed ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  All assigned instructors have agreed with the course expense accounting.
                </p>
              ) : instructorIds.length > 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Not all instructors have agreed with expenses yet. See Complete tab for per-instructor status.
                </p>
              ) : null}
              {/* Legacy-style summary matrix */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Expenses</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Summary by expense type and instructor (legacy admin parity).
                    </p>
                  </div>
                      <div className="text-sm text-slate-700 flex flex-col items-start gap-2">
                    <div><strong>Total students:</strong> {totalStudents}</div>
                    <div><strong>Total revenue:</strong> {String(totalReceived ?? '—')}</div>
                    <button
                      type="button"
                      onClick={downloadExpenseSummaryCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#00d4aa]"
                    >
                      Download expenses
                    </button>
                  </div>
                </div>

                {expenseSummary.rows.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No expenses submitted for this course.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 font-semibold text-slate-700">Expense name</th>
                          <th className="p-3 font-semibold text-slate-700">Total amount ($)</th>
                          {instructorIds.map((iid) => {
                            const agreed = completeState.instructorHasAgreed(iid)
                            return (
                              <th key={iid} className="p-3 font-semibold text-slate-700">
                                <span className={agreed ? 'text-emerald-700' : ''}>{instructorNameFor(iid)}</span>
                                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  {agreed ? 'Agreed' : 'Pending'}
                                </span>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {expenseSummary.rows.map((r) => (
                          <tr key={r.expenseType} className="border-t border-slate-100">
                            <td className="p-3 text-slate-800">{r.expenseType}</td>
                            <td className="p-3 text-slate-800">${r.total.toFixed(2)}</td>
                            {instructorIds.map((iid) => (
                              <td key={`${r.expenseType}:${iid}`} className="p-3 text-slate-700">
                                {(r.byInstructor.get(iid) ?? 0).toFixed(2)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="border-t border-slate-200 bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-800">Total amount</td>
                          <td className="p-3 font-semibold text-slate-800">${expenseSummary.totalExpense.toFixed(2)}</td>
                          {instructorIds.map((iid) => (
                            <td key={`tot:${iid}`} className="p-3 font-semibold text-slate-700">
                              ${(expenseSummary.instructorTotals.get(iid) ?? 0).toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Detailed rows with admin actions (approve/reject/pay) */}
              <div className="space-y-3">
                {expenses.map((e, i) => {
                  const id = expenseRowId(e as Exp, i)
                  const inst = String((e as any).instructorUserId || '').trim()
                  const canApprove = adminCanApproveExpense(e as Exp)
                  const canReject = adminCanRejectExpense(e as Exp)
                  const canPay = adminCanMarkPaid(e as Exp)
                  return (
                    <div key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          ${String((e as any).amount || 0)} · {String((e as any).expenseType || 'General')}
                          {inst ? <span className="ml-2 text-xs font-medium text-slate-500">({instructorNameFor(inst)})</span> : null}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-700">
                          {String((e as any).status || '—')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{String((e as any).description || '')}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted: {formatExpenseSubmittedAt((e as any).submittedAt)}
                      </p>
                      {String((e as any).receiptUrl || '').trim() ? (
                        <p className="mt-2 text-sm">
                          <button
                            type="button"
                            className="font-semibold text-[#0d9488] hover:underline"
                            onClick={() => {
                              setReceiptViewUrl(String((e as any).receiptUrl))
                              setReceiptViewOpen(true)
                            }}
                          >
                            View receipt
                          </button>
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canApprove ? (
                          <button
                            type="button"
                            disabled={busy === id + 'approve'}
                            onClick={() => expenseAct(id, 'approve')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                        ) : null}
                        {canReject ? (
                          <button
                            type="button"
                            disabled={busy === id + 'reject'}
                            onClick={() => expenseAct(id, 'reject')}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        ) : null}
                        {canPay ? (
                          <button
                            type="button"
                            disabled={busy === id + 'pay'}
                            onClick={() => expenseAct(id, 'pay', Number((e as any).amount || 0))}
                            className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-bold text-indigo-700 disabled:opacity-50"
                          >
                            Mark paid
                          </button>
                        ) : null}
                        {!canApprove && !canReject && !canPay ? (
                          <span className="text-xs font-semibold text-slate-500">No further actions for this status.</span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'complete' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-slate-900">Mark course as complete</h3>
              <p className="mb-4 text-sm text-slate-600">
                To mark this course as complete, all instructors must agree with the expenses (legacy parity).
              </p>

              {instructorIds.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No instructors found for this course.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Expense agreement status</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {instructorIds.map((iid) => {
                      const ok = completeState.agreedBy.get(iid)
                      return (
                        <li key={iid} className="flex items-center justify-between">
                          <span className="text-slate-700">{instructorNameFor(iid)}</span>
                          <span className={ok ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                            {ok ? 'Agreed' : 'Pending'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-5">
                <button
                  type="button"
                  disabled={courseLocked || !completeState.allAgreed || busy === 'close-course'}
                  onClick={closeCourse}
                  className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark course as complete
                </button>
                {!completeState.allAgreed && !courseLocked && (
                  <p className="mt-3 text-sm text-slate-600">Not all instructors have agreed with the expenses yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'accounting' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Accounting</h3>
              {accounting?.allInstructorsAgreed === true ? (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  All assigned instructors have agreed with the course expense accounting.
                </p>
              ) : accounting?.allInstructorsAgreed === false ? (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Not all instructors have agreed with expenses yet.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Total received</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{moneyLabel(accounting?.totalReceived)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Payment gateway fees</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{moneyLabel(accounting?.totalGatewayFees)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Approved instructor expenses</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{moneyLabel(accounting?.totalExpenses)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Submitted expenses (all open)</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{moneyLabel(accounting?.totalSubmittedExpenses)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Paid to instructors</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{moneyLabel(accounting?.totalInstructorPayouts)}</p>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                  <p className="text-xs font-semibold text-teal-800">Balance remaining</p>
                  <p className="mt-1 text-xl font-bold text-teal-950">{moneyLabel(accounting?.balance)}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="mb-3 text-sm font-bold text-slate-900">Pay instructors (course-linked)</p>
                  {instructorIds.length === 0 ? (
                    <p className="text-sm text-slate-600">No instructors found for this course.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <label className="text-xs font-semibold text-slate-600">
                        Instructor
                        <select
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          value={payInstructorId}
                          disabled={courseLocked}
                          onChange={(e) => setPayInstructorId(e.target.value)}
                        >
                          <option value="">Select instructor…</option>
                          {instructorIds.map((iid) => (
                            <option key={iid} value={iid}>
                              {instructorNameFor(iid)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Amount (USD)
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          type="number"
                          step="0.01"
                          min="0"
                          value={payAmount}
                          disabled={courseLocked}
                          onChange={(e) => setPayAmount(e.target.value)}
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Payment date
                        <div className="mt-1">
                          <UsDatePicker
                            value={payDate}
                            onChange={setPayDate}
                            disabled={courseLocked}
                            buttonClassName="min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Note
                        <input
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          value={payNote}
                          disabled={courseLocked}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="Optional note"
                        />
                      </label>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={courseLocked || busy === 'course-pay-instructor'}
                      onClick={submitInstructorPayment}
                      className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Record payment
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-3 text-sm font-bold text-slate-900">Payment history</p>
                  {Array.isArray(accounting?.instructorPayments) &&
                  (accounting!.instructorPayments as Record<string, unknown>[]).length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-3 font-semibold text-slate-700">Instructor</th>
                            <th className="p-3 font-semibold text-slate-700">Amount</th>
                            <th className="p-3 font-semibold text-slate-700">Date</th>
                            <th className="p-3 font-semibold text-slate-700">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(accounting!.instructorPayments as Record<string, unknown>[]).map((row, idx) => (
                            <tr
                              key={
                                coerceMongoIdFromRow(row) ||
                                `payment-${idx}-${String(row.instructorId || '')}-${String(row.paymentDate || '')}`
                              }
                              className="border-t border-slate-100"
                            >
                              <td className="p-3 text-slate-800">
                                {String(row.instructorName || '').trim() ||
                                  instructorNameFor(String(row.instructorId || ''))}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">{moneyLabel(row.amount)}</td>
                              <td className="p-3 text-slate-700">
                                {row.paymentDate
                                  ? formatUsDateTime(new Date(String(row.paymentDate)))
                                  : '—'}
                              </td>
                              <td className="p-3 text-slate-600">
                                {String(row.notes || row.note || row.description || '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No instructor payouts recorded for this course yet.</p>
                  )}
                </div>

                <p className="mb-3 text-sm text-slate-600">
                  To close the course, all expenses should be resolved (Paid or Admin Rejected).
                </p>
                <button
                  type="button"
                  disabled={courseLocked || busy === 'close-course'}
                  onClick={closeCourse}
                  className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark course as completed
                </button>
              </div>
            </div>
          )}

          {/* Bulk attendance edit modal */}
          {editAttendanceDay != null && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Edit attendance</h4>
                    <p className="text-sm text-slate-600">
                      {sessionLabelFromStarts(sessionStarts, editAttendanceDay)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
                    onClick={() => setEditAttendanceDay(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 font-semibold text-slate-700">Student</th>
                        <th className="p-3 font-semibold text-slate-700">Status</th>
                        <th className="p-3 font-semibold text-slate-700">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((s, i) => {
                        const rowKey = rosterRowKey(s, i)
                        const seatKey = rosterSeatKey(s as Record<string, unknown>, i)
                        const d = attendanceDraft[rowKey] || attendanceDraft[seatKey] || { status: '', note: '' }
                        return (
                          <tr key={`bulk-${rowKey}`} className="border-t border-slate-100">
                            <td className="p-3 text-slate-800">
                              {String(`${s.studentFirstName || ''} ${s.studentLastName || ''}`.trim() || '—')}
                            </td>
                            <td className="p-3">
                              <select
                                className="w-52 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                value={d.status}
                                disabled={courseLocked}
                                onChange={(e) =>
                                  setAttendanceDraft((m) => ({ ...m, [rowKey]: { ...d, status: e.target.value } }))
                                }
                              >
                                <option value="">Select Status</option>
                                <option value="P">P = Present</option>
                                <option value="X">X = Absent</option>
                                <option value="T">T = Tardy</option>
                                <option value="E">E = Left Early</option>
                                <option value="IN">IN = Injured</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                value={d.note}
                                disabled={courseLocked}
                                onChange={(e) =>
                                  setAttendanceDraft((m) => ({ ...m, [rowKey]: { ...d, note: e.target.value } }))
                                }
                                placeholder="remarks"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:border-[#00d4aa]"
                    onClick={() => setEditAttendanceDay(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={courseLocked || busy === `att-bulk-${editAttendanceDay}`}
                    className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => saveAttendanceDayBulk(editAttendanceDay)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assign other course modal */}
          {assignDialog.open && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Assign to another course</h4>
                    <p className="text-sm text-slate-600">Creates a Pending reassignment request (legacy parity).</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
                    onClick={() => setAssignDialog({ open: false, studentUserId: '', toCourseId: '' })}
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-slate-600">
                    Target course
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={assignDialog.toCourseId}
                      onChange={(e) => setAssignDialog((d) => ({ ...d, toCourseId: e.target.value }))}
                    >
                      <option value="">Select course…</option>
                      {allCourses
                        .filter((c) => String((c as any).id || '') !== courseId)
                        .slice(0, 300)
                        .map((c) => {
                          const id = String((c as any).id || '')
                          const label = String((c as any).locationName || '')
                          const addr = String((c as any).address || '')
                          const when = Array.isArray((c as any).sessionStarts)
                            ? sessionLabelFromStarts((c as any).sessionStarts as unknown[], 1)
                            : ''
                          return (
                            <option key={id} value={id}>
                              {label} — {when} — {addr}
                            </option>
                          )
                        })}
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:border-[#00d4aa]"
                    onClick={() => setAssignDialog({ open: false, studentUserId: '', toCourseId: '' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={courseLocked || !assignDialog.toCourseId || busy === 'assign-other'}
                    className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={submitAssignOther}
                  >
                    Queue reassignment
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CourseEnrolledStudentsEmailDialog
        open={emailStudentsOpen}
        onOpenChange={setEmailStudentsOpen}
        courseId={courseId}
        courseTitle={courseTitle}
        studentEmails={emailStudentEmails}
        audience="admin"
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
