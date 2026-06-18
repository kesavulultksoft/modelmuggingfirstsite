'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  approveExpense,
  fetchAdminCourseExpenses,
  fetchAdminCourses,
  fetchAdminCompletedInstructors,
  fetchAdminUsers,
  fetchMe,
  getToken,
  markExpensePaid,
  rejectExpense,
  type MeUser,
} from '@/lib/portalApi'
import { formatExpenseSubmittedAt } from '@/lib/expenseDisplay'
import {
  adminCanApproveExpense,
  adminCanMarkPaid,
  adminCanRejectExpense,
  expenseRowId,
  groupExpensesForAdminSections,
} from '@/lib/expenseAdminGroups'
import {
  buildInstructorNameLookupFromAdminUsers,
  buildInstructorNameLookupFromCrmRows,
  instructorDisplayName,
  mergeInstructorNameLookups,
} from '@/lib/portalInstructors'
import { courseIdFromRow, formatCoursePickerLabel, isCourseCompleted } from '@/lib/coursePortalDisplay'
import ExpenseReceiptViewerDialog from '@/components/portal/ExpenseReceiptViewerDialog'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminLegacyTabs, { type LegacyTabSpec } from '@/components/portal/AdminLegacyTabs'

const LEGACY_TABS: LegacyTabSpec[] = [
  {
    id: 'pend',
    label: 'Legacy pending (CRM docs)',
    endpoint: '/api/v1/admin/crm/instructor-expense-docs?status=pending',
  },
  {
    id: 'ok',
    label: 'Legacy approved (CRM docs)',
    endpoint: '/api/v1/admin/crm/instructor-expense-docs?status=approved',
  },
  {
    id: 'no',
    label: 'Legacy rejected (CRM docs)',
    endpoint: '/api/v1/admin/crm/instructor-expense-docs?status=rejected',
  },
]

type Exp = Record<string, unknown>
type CourseListTab = 'active' | 'past'

export default function AdminAccountsHubPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [courseListTab, setCourseListTab] = useState<CourseListTab>('active')
  const [courseId, setCourseId] = useState('')
  const [expenses, setExpenses] = useState<Exp[]>([])
  const [adminUsers, setAdminUsers] = useState<Record<string, unknown>[]>([])
  const [crmInstructors, setCrmInstructors] = useState<Record<string, unknown>[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [receiptViewUrl, setReceiptViewUrl] = useState('')
  const [receiptViewOpen, setReceiptViewOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/accounts')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
    fetchAdminCourses()
      .then((raw) => setCourses(Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []))
      .catch(() => setCourses([]))
    fetchAdminUsers()
      .then((rows) => setAdminUsers(Array.isArray(rows) ? rows : []))
      .catch(() => setAdminUsers([]))
    fetchAdminCompletedInstructors(false)
      .then((rows) => setCrmInstructors(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []))
      .catch(() => setCrmInstructors([]))
  }, [router])

  const instructorNameLookup = useMemo(
    () =>
      mergeInstructorNameLookups(
        buildInstructorNameLookupFromAdminUsers(adminUsers),
        buildInstructorNameLookupFromCrmRows(crmInstructors),
      ),
    [adminUsers, crmInstructors],
  )

  const activeCourses = useMemo(() => courses.filter((c) => !isCourseCompleted(c)), [courses])
  const pastCourses = useMemo(() => courses.filter((c) => isCourseCompleted(c)), [courses])
  const coursesForPicker = courseListTab === 'past' ? pastCourses : activeCourses

  useEffect(() => {
    if (!courseId) return
    const stillVisible = coursesForPicker.some((c, i) => courseIdFromRow(c, i) === courseId)
    if (!stillVisible) setCourseId('')
  }, [courseId, coursesForPicker])

  async function loadCourseExpenses(id: string) {
    const rows = await fetchAdminCourseExpenses(id)
    setExpenses(Array.isArray(rows) ? (rows as Exp[]) : [])
  }

  useEffect(() => {
    if (!courseId) {
      setExpenses([])
      return
    }
    void loadCourseExpenses(courseId)
  }, [courseId])

  const instructorIds = useMemo(() => {
    const out: string[] = []
    const add = (v: unknown) => {
      const s = String(v ?? '').trim()
      if (s && !out.includes(s)) out.push(s)
    }
    expenses.forEach((e) => add(e.instructorUserId))
    return out
  }, [expenses])

  const expenseSummary = useMemo(() => {
    const byType = new Map<string, { expenseType: string; total: number; byInstructor: Map<string, number> }>()
    for (const e of expenses) {
      const t = String(e.expenseType || 'General').trim() || 'General'
      const inst = String(e.instructorUserId || '').trim()
      const amt = Number(e.amount || 0)
      if (!byType.has(t)) byType.set(t, { expenseType: t, total: 0, byInstructor: new Map() })
      const row = byType.get(t)!
      row.total += Number.isFinite(amt) ? amt : 0
      if (inst) row.byInstructor.set(inst, (row.byInstructor.get(inst) ?? 0) + amt)
    }
    return Array.from(byType.values()).sort((a, b) => a.expenseType.localeCompare(b.expenseType))
  }, [expenses])

  const expenseSections = useMemo(() => groupExpensesForAdminSections(expenses), [expenses])

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
            : await markExpensePaid(id, amount, 'Paid from class expenses hub')
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
      if (courseId) await loadCourseExpenses(courseId)
    } finally {
      setBusy(null)
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Class expenses"
        subtitle="Review instructor-submitted class expenses by course. Approve, reject, or mark paid by status (legacy admin parity)."
      />

      {msg ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Portal expenses by course</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select an active or past course to review expenses grouped as pending, approved, rejected, and paid.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { id: 'active' as const, label: 'Active courses' },
              { id: 'past' as const, label: 'Past courses' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCourseListTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                courseListTab === t.id
                  ? 'bg-[#0f172a] text-white'
                  : 'border border-slate-200 bg-white text-slate-800 hover:border-[#00d4aa]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Course
          <select
            className="mt-1 w-full max-w-xl rounded-xl border border-slate-200 px-4 py-3"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">
              {courseListTab === 'past' ? 'Select past course…' : 'Select active course…'}
            </option>
            {coursesForPicker.map((c, i) => {
              const id = courseIdFromRow(c, i)
              return (
                <option key={id} value={id}>
                  {formatCoursePickerLabel(c)}
                </option>
              )
            })}
          </select>
        </label>
        {coursesForPicker.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            {courseListTab === 'past' ? 'No completed courses yet.' : 'No active courses found.'}
          </p>
        ) : null}
        {courseId ? (
          <p className="mt-2 text-sm">
            <Link
              href={`/portal/admin/courses/${encodeURIComponent(courseId)}?tab=expenses`}
              className="font-semibold text-[#0d9488] hover:underline"
            >
              Open full course workspace →
            </Link>
          </p>
        ) : null}

        {courseId && expenseSummary.length === 0 && expenses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No portal expenses for this course yet.</p>
        ) : null}

        {expenseSummary.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-semibold text-slate-700">Expense</th>
                  <th className="p-3 font-semibold text-slate-700">Total ($)</th>
                  {instructorIds.map((iid) => (
                    <th key={iid} className="p-3 font-semibold text-slate-700">
                      {instructorDisplayName(instructorNameLookup, iid)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenseSummary.map((r) => (
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
              </tbody>
            </table>
          </div>
        ) : null}

        {courseId
          ? expenseSections.map((section) => (
              <div key={section.id} className="mt-8">
                <h3 className="text-base font-bold text-slate-900">{section.label}</h3>
                <p className="mt-0.5 text-sm text-slate-600">{section.description}</p>
                {section.rows.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">None in this section.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 font-semibold text-slate-700">Submitted</th>
                          <th className="p-3 font-semibold text-slate-700">Instructor</th>
                          <th className="p-3 font-semibold text-slate-700">Type</th>
                          <th className="p-3 font-semibold text-slate-700">Amount</th>
                          <th className="p-3 font-semibold text-slate-700">Status</th>
                          <th className="p-3 font-semibold text-slate-700">Description</th>
                          <th className="p-3 font-semibold text-slate-700">Receipt</th>
                          <th className="p-3 font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((e, i) => {
                          const id = expenseRowId(e, i)
                          const receipt = String(e.receiptUrl || '').trim()
                          const canApprove = adminCanApproveExpense(e)
                          const canReject = adminCanRejectExpense(e)
                          const canPay = adminCanMarkPaid(e)
                          return (
                            <tr key={id} className="border-t border-slate-100">
                              <td className="p-3 text-slate-700">{formatExpenseSubmittedAt(e.submittedAt)}</td>
                              <td className="p-3 text-slate-800">
                                {instructorDisplayName(instructorNameLookup, e.instructorUserId)}
                              </td>
                              <td className="p-3 text-slate-700">{String(e.expenseType || 'General')}</td>
                              <td className="p-3 font-semibold text-slate-900">
                                ${Number(e.amount || 0).toFixed(2)}
                              </td>
                              <td className="p-3 text-slate-700">{String(e.status || '—')}</td>
                              <td className="p-3 text-slate-600">{String(e.description || '—')}</td>
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
                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  {canApprove ? (
                                    <button
                                      type="button"
                                      disabled={busy === id + 'approve'}
                                      onClick={() => expenseAct(id, 'approve')}
                                      className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                  ) : null}
                                  {canReject ? (
                                    <button
                                      type="button"
                                      disabled={busy === id + 'reject'}
                                      onClick={() => expenseAct(id, 'reject')}
                                      className="rounded border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  ) : null}
                                  {canPay ? (
                                    <button
                                      type="button"
                                      disabled={busy === id + 'pay'}
                                      onClick={() => expenseAct(id, 'pay', Number(e.amount || 0))}
                                      className="rounded border border-indigo-300 px-3 py-1.5 text-xs font-bold text-indigo-700 disabled:opacity-50"
                                    >
                                      Mark paid
                                    </button>
                                  ) : null}
                                  {!canApprove && !canReject && !canPay ? (
                                    <span className="text-xs text-slate-500">—</span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          : null}
      </section>

      <AdminLegacyTabs tabs={LEGACY_TABS} meReady maxRows={100} />

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
