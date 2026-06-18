'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchMe,
  fetchInstructorCourses,
  fetchInstructorExpenses,
  fetchInstructorCourseExpenses,
  fetchInstructorExpenseTypes,
  type ExpenseCatalogItem,
  instructorApproveExpense,
  instructorRejectExpense,
  fetchInstructorPortalInstructors,
  submitInstructorExpense,
  uploadInstructorExpenseReceipt,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import {
  courseIdFromRow,
  formatCoursePickerLabel,
  isInstructorUpcomingCourse,
} from '@/lib/coursePortalDisplay'
import { formatExpenseSubmittedAt } from '@/lib/expenseDisplay'
import {
  buildInstructorNameLookupFromPortal,
  instructorDisplayName,
  mapPortalInstructors,
} from '@/lib/portalInstructors'
import type { InstructorOption } from '@/lib/adminCourseFormModel'

type Exp = {
  id?: string
  amount?: number
  description?: string
  status?: string
  courseId?: string
  expenseType?: string
  instructorUserId?: string
  instructorApprovals?: string[]
  rejectionReason?: string
  submittedAt?: string
  receiptUrl?: string
}

export default function InstructorExpensesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [ok, setOk] = useState(false)
  const [list, setList] = useState<Exp[]>([])
  const [courses, setCourses] = useState<{ id: string; label: string }[]>([])
  const [courseId, setCourseId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseCatalogId, setExpenseCatalogId] = useState('')
  const [expenseTypes, setExpenseTypes] = useState<ExpenseCatalogItem[]>([])
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFileName, setReceiptFileName] = useState('')
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [courseFeed, setCourseFeed] = useState<Exp[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'open' | 'approved' | 'paid' | 'rejected'>('all')
  const [portalInstructors, setPortalInstructors] = useState<InstructorOption[]>([])
  const instructorNameLookup = useMemo(
    () => buildInstructorNameLookupFromPortal(portalInstructors),
    [portalInstructors],
  )

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/expenses')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
        setOk(true)
      })
      .catch(() => router.replace('/portal'))
    fetchInstructorExpenses()
      .then((r) => setList(Array.isArray(r) ? r : []))
      .catch(() => setList([]))
    fetchInstructorExpenseTypes()
      .then((rows) => setExpenseTypes(Array.isArray(rows) ? rows : []))
      .catch(() => setExpenseTypes([]))
    fetchInstructorCourses()
      .then((raw) => {
        const arr = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
        setCourses(
          arr
            .filter((c) => isInstructorUpcomingCourse(c))
            .map((c, i) => {
              const id = courseIdFromRow(c, i)
              return { id, label: formatCoursePickerLabel(c) }
            }),
        )
      })
      .catch(() => setCourses([]))
    fetchInstructorPortalInstructors()
      .then((rows) => setPortalInstructors(mapPortalInstructors(Array.isArray(rows) ? rows : [])))
      .catch(() => setPortalInstructors([]))
  }, [router])

  useEffect(() => {
    if (courseId && !courses.some((c) => c.id === courseId)) {
      setCourseId('')
    }
  }, [courseId, courses])

  useEffect(() => {
    if (!courseId) {
      setCourseFeed([])
      return
    }
    fetchInstructorCourseExpenses(courseId)
      .then((r) => setCourseFeed(Array.isArray(r) ? (r as Exp[]) : []))
      .catch(() => setCourseFeed([]))
  }, [courseId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const n = parseFloat(amount)
    if (!courseId || !description || !(n > 0)) {
      setMsg('Course, amount, and description required.')
      return
    }
    const selected = expenseTypes.find(
      (t) =>
        String(t._id || t.dumId || '') === expenseCatalogId ||
        String(t.dumId || '') === expenseCatalogId
    )
    if (!expenseCatalogId || !selected) {
      setMsg('Please select an expense type.')
      return
    }
    const res = await submitInstructorExpense({
      courseId,
      amount: n,
      description,
      expenseCatalogId,
      expenseType: String(selected.label || `${selected.type} — ${selected.name}`).trim(),
      receiptUrl,
    })
    const j = await res.json().catch(() => ({}))
    if (res.ok) {
      setAmount('')
      setDescription('')
      setExpenseCatalogId('')
      setReceiptUrl('')
      setReceiptFileName('')
      setMsg('Submitted for review.')
      fetchInstructorExpenses().then((r) => setList(Array.isArray(r) ? r : []))
      fetchInstructorCourseExpenses(courseId).then((r) => setCourseFeed(Array.isArray(r) ? (r as Exp[]) : []))
    } else {
      setMsg((j as { error?: string }).error || 'Failed')
    }
  }

  async function actPeer(expenseId: string, approve: boolean) {
    setBusy(expenseId)
    const res = approve
      ? await instructorApproveExpense(expenseId)
      : await instructorRejectExpense(expenseId, 'Needs correction')
    setBusy(null)
    if (res.ok && courseId) {
      fetchInstructorCourseExpenses(courseId).then((r) => setCourseFeed(Array.isArray(r) ? (r as Exp[]) : []))
      fetchInstructorExpenses().then((r) => setList(Array.isArray(r) ? r : []))
    }
  }

  const approvedCount = list.filter((e) => /approved/i.test(String(e.status || ''))).length
  const paidCount = list.filter((e) => /paid/i.test(String(e.status || ''))).length
  const openCount = list.filter((e) => !/paid|rejected/i.test(String(e.status || ''))).length

  const expenseTypesByCategory = useMemo(() => {
    const map = new Map<string, ExpenseCatalogItem[]>()
    for (const item of expenseTypes) {
      const cat = String(item.type || 'Other').trim() || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [expenseTypes])

  const courseLabelById = useMemo(() => {
    const m = new Map<string, string>()
    courses.forEach((c) => m.set(c.id, c.label))
    return m
  }, [courses])

  const filteredHistory = useMemo(() => {
    return list.filter((e) => {
      const s = String(e.status || '').toLowerCase()
      if (historyFilter === 'open') return !s.includes('paid') && !s.includes('rejected')
      if (historyFilter === 'approved') return s.includes('approved')
      if (historyFilter === 'paid') return s.includes('paid')
      if (historyFilter === 'rejected') return s.includes('rejected')
      return true
    })
  }, [list, historyFilter])

  if (!ok) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Expenses"
        subtitle="Submit, track, and collaborate on course expense approvals."
      />
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total requests</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{list.length}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Open review</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{openCount}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Approved</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{approvedCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Paid</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{paidCount}</p>
          </div>
        </div>
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="font-bold text-slate-900">New request</h2>
          {msg && <p className="mt-3 text-sm text-amber-800">{msg}</p>}
          <label className="mt-4 block text-sm font-medium text-slate-700">Course</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-sm font-medium text-slate-700">Amount (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <label className="mt-4 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="mt-4 block text-sm font-medium text-slate-700">Expense type</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={expenseCatalogId}
            onChange={(e) => setExpenseCatalogId(e.target.value)}
            required
          >
            <option value="">Select expense type…</option>
            {expenseTypesByCategory.map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((item) => {
                  const id = String(item._id || item.dumId || '')
                  const label = String(item.name || item.label || id)
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
          <label className="mt-4 block text-sm font-medium text-slate-700">Receipt (optional)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.tif,.tiff,.doc,.docx,.txt,.rtf,image/*,application/pdf"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setReceiptUploading(true)
              setMsg('')
              const res = await uploadInstructorExpenseReceipt(f)
              setReceiptUploading(false)
              if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                setMsg((j as { error?: string }).error || 'Receipt upload failed')
                setReceiptUrl('')
                setReceiptFileName('')
                return
              }
              const j = (await res.json()) as { receiptUrl?: string }
              setReceiptUrl(String(j.receiptUrl || ''))
              setReceiptFileName(f.name)
              setMsg('Receipt attached.')
            }}
          />
          {receiptFileName ? (
            <p className="mt-1 text-xs text-emerald-800">Attached: {receiptFileName}</p>
          ) : null}
          {receiptUploading ? <p className="mt-1 text-xs text-slate-500">Uploading…</p> : null}
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-[#0f172a] py-3 font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
          >
            Submit
          </button>
        </form>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">History</h2>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'open' | 'approved' | 'paid' | 'rejected')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {filteredHistory.length === 0 ? (
              <li className="text-slate-500">No submissions yet.</li>
            ) : (
              filteredHistory.map((e) => (
                <li key={e.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">${e.amount}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase">
                      {e.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">{e.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {e.courseId ? courseLabelById.get(String(e.courseId)) || e.courseId : '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Submitted: {formatExpenseSubmittedAt(e.submittedAt)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      {courseId && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Course expense approvals</h2>
          <p className="mt-1 text-sm text-slate-600">
            All assigned instructors can review and approve/reject each expense before admin final processing.
          </p>
          <ul className="mt-4 space-y-3">
            {courseFeed.length === 0 ? (
              <li className="text-sm text-slate-500">No expense rows yet for this course.</li>
            ) : (
              courseFeed.map((e) => (
                <li key={e.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      ${e.amount} · {e.expenseType || 'General'}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase">
                      {e.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{e.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted by: {instructorDisplayName(instructorNameLookup, e.instructorUserId)} ·{' '}
                    {formatExpenseSubmittedAt(e.submittedAt)} · approvals: {(e.instructorApprovals || []).length}
                  </p>
                  {e.rejectionReason && <p className="mt-1 text-xs text-red-700">Reason: {e.rejectionReason}</p>}
                  {(() => {
                    const myLink = me?.primaryInstructorId || me?.id
                    const uid = String(e.instructorUserId || '')
                    const isPeer = Boolean(myLink && uid && uid !== myLink)
                    const approvals = Array.isArray(e.instructorApprovals) ? e.instructorApprovals.map(String) : []
                    const already = myLink ? approvals.includes(String(myLink)) : false
                    const st = String(e.status || '')
                    const canPeer =
                      isPeer &&
                      !already &&
                      !st.startsWith('ADMIN_') &&
                      st !== 'PAID' &&
                      st !== 'INSTRUCTOR_REJECTED' &&
                      st !== 'ADMIN_REJECTED'
                    return canPeer
                  })() && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy === e.id}
                        onClick={() => actPeer(String(e.id || ''), true)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === e.id}
                        onClick={() => actPeer(String(e.id || ''), false)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </>
  )
}
