'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react'
import {
  authFetchJson,
  fetchAdminCompletedInstructorDetail,
  fetchAdminCompletedInstructors,
  postAdminEmailSend,
} from '@/lib/portalApi'
import AdminInstructorDetailModal from '@/components/portal/AdminInstructorDetailModal'
import { coerceMongoIdFromRow, legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatInstructorGenderDisplay } from '@/lib/gender'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalJsonTable from '@/components/portal/PortalJsonTable'

type TabId = 'active' | 'archived' | 'payments'

type InstructorRow = Record<string, unknown>

function instructorName(r: InstructorRow): string {
  const fn = String(r.firstName ?? '').trim()
  const ln = String(r.lastName ?? '').trim()
  const full = `${fn} ${ln}`.trim()
  if (full) return full
  return String(r.fullName ?? r.name ?? 'Instructor').trim() || '—'
}

function instructorEmail(r: InstructorRow): string {
  return String(r.emailId ?? r.email ?? r.portalUserEmail ?? '').trim()
}

function instructorInitials(r: InstructorRow): string {
  const name = instructorName(r)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'IN'
}

function formatDateTime(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function locationLabel(r: InstructorRow): string {
  const loc = String(r.locationName ?? '').trim()
  const city = String(r.city ?? '').trim()
  const state = String(r.state ?? '').trim()
  const parts = [loc, [city, state].filter(Boolean).join(', ')].filter(Boolean)
  return parts.join(' · ') || '—'
}

function phoneForRow(r: InstructorRow): string {
  const raw =
    r.contactPhoneSnapshot ?? r.contactNumber ?? r.phone ?? r.alternatePhoneNumber
  const f = formatUsPhoneDisplay(raw)
  return f || '—'
}

function InstructorRosterTable({
  rows,
  archived,
  onOpenDetail,
  onOpenEmail,
}: {
  rows: InstructorRow[]
  archived: boolean
  onOpenDetail: (row: InstructorRow) => void
  onOpenEmail: (row: InstructorRow, name: string) => void
}) {
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  useEffect(() => {
    // Reset paging when changing archive view or refreshing row data.
    setPage(1)
  }, [rows.length, archived])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" aria-hidden />
        <p className="text-base font-semibold text-slate-800">
          {archived ? 'No archived instructors' : 'No active instructors yet'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {archived
            ? 'Instructors moved to archive from Instructor Management appear here.'
            : 'Convert qualified applicants from the Applicant pipeline to add instructors here.'}
        </p>
        {!archived && (
          <Link
            href="/portal/admin/trainer-pipeline"
            className="mt-4 inline-flex rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Open applicant pipeline
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Instructor
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Location
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Converted
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Gender
              </th>
              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r, i) => {
              const name = instructorName(r)
              const email = instructorEmail(r) || '—'
              const id = coerceMongoIdFromRow(r)
              return (
                <tr key={id || i} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          archived
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {instructorInitials(r)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(r)}
                            className="truncate rounded-sm text-left font-semibold text-teal-800 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80"
                          >
                            {name}
                          </button>
                          <button
                            type="button"
                            title="Send email to instructor"
                            disabled={!instructorEmail(r)}
                            onClick={() => onOpenEmail(r, name)}
                            className="shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Mail className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Email instructor</span>
                          </button>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500" title={email}>
                          {email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1 text-slate-700">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                        <span className="truncate" title={email}>
                          {email}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                        {phoneForRow(r)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      <span className="line-clamp-2">{locationLabel(r)}</span>
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                    {formatDateTime(r.becameInstructorDate ?? r.applicationApprovedDate)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    {formatInstructorGenderDisplay(r.gender)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        archived
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {archived ? 'Archived' : String(r.status ?? 'Completed')}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of{' '}
              <span className="font-semibold text-slate-900">{rows.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-slate-800">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminInstructorsRoster({
  meReady,
  defaultTab,
}: {
  meReady: boolean
  defaultTab?: TabId
}) {
  const [tab, setTab] = useState<TabId>(defaultTab ?? 'active')
  const [activeRows, setActiveRows] = useState<InstructorRow[]>([])
  const [archivedRows, setArchivedRows] = useState<InstructorRow[]>([])
  const [paymentRows, setPaymentRows] = useState<InstructorRow[]>([])
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailRow, setDetailRow] = useState<InstructorRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [emailModal, setEmailModal] = useState<{
    instructorName: string
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
  } | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  useEffect(() => {
    if (defaultTab) setTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    setPaymentsPage(1)
  }, [tab, paymentRows.length])

  useEffect(() => {
    if (!meReady) return
    let cancelled = false
    setLoading(true)
    setErr('')
    const load = async () => {
      try {
        if (tab === 'payments') {
          const d = await authFetchJson<unknown>('/api/v1/admin/crm/instructor-payments')
          if (!cancelled) setPaymentRows(legacyAsObjectArray(d))
        } else {
          const [active, archived] = await Promise.all([
            fetchAdminCompletedInstructors(false),
            fetchAdminCompletedInstructors(true),
          ])
          if (!cancelled) {
            setActiveRows(legacyAsObjectArray(active))
            setArchivedRows(legacyAsObjectArray(archived))
          }
        }
      } catch (e) {
        if (!cancelled) setErr(String((e as Error).message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [meReady, tab])

  const rosterRows = tab === 'archived' ? archivedRows : activeRows
  const q = search.trim().toLowerCase()
  const filteredRoster = useMemo(() => {
    if (!q) return rosterRows
    return rosterRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [rosterRows, q])

  const PAYMENT_PAGE_SIZE = 25
  const paymentTotalPages = Math.max(1, Math.ceil(paymentRows.length / PAYMENT_PAGE_SIZE))
  const paymentSafePage = Math.min(paymentsPage, paymentTotalPages)
  const paymentPageRows = paymentRows.slice(
    (paymentSafePage - 1) * PAYMENT_PAGE_SIZE,
    paymentSafePage * PAYMENT_PAGE_SIZE,
  )

  function openInstructorEmailModal(row: InstructorRow, instructorDisplayName: string) {
    setEmailMsg('')
    setEmailModal({
      instructorName: instructorDisplayName,
      to: instructorEmail(row),
      cc: '',
      bcc: '',
      subject: 'Model Mugging Self Defense',
      body: instructorDisplayName,
    })
  }

  async function sendInstructorEmail() {
    if (!emailModal) return
    if (!emailModal.to.trim()) {
      setEmailMsg('To email is required.')
      return
    }
    if (!emailModal.subject.trim()) {
      setEmailMsg('Subject is required.')
      return
    }
    if (!emailModal.body.trim()) {
      setEmailMsg('Email body is required.')
      return
    }
    setEmailSending(true)
    setEmailMsg('')
    try {
      const bodyText = emailModal.body.trim()
      const res = await postAdminEmailSend({
        to: emailModal.to.trim(),
        cc: emailModal.cc.trim() || undefined,
        bcc: emailModal.bcc.trim() || undefined,
        subject: emailModal.subject.trim(),
        text: bodyText,
        html: bodyText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>'),
        category: 'instructor-roster',
      })
      const data = (await res.json().catch(() => ({}))) as { transportOk?: boolean }
      if (!res.ok) throw new Error('Send failed')
      setEmailMsg(data.transportOk === false ? 'Logged; SMTP may not be configured.' : 'Email sent.')
      setTimeout(() => {
        setEmailModal(null)
        setEmailMsg('')
      }, 1200)
    } catch (e) {
      setEmailMsg(String((e as Error).message || e))
    }
    setEmailSending(false)
  }

  async function openInstructorDetail(row: InstructorRow) {
    const id = coerceMongoIdFromRow(row)
    setDetailRow(row)
    if (!id) return
    setDetailLoading(true)
    try {
      const full = await fetchAdminCompletedInstructorDetail(id)
      setDetailRow(full as InstructorRow)
    } catch {
      setDetailRow(row)
    } finally {
      setDetailLoading(false)
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof Users; count?: number }[] = [
    { id: 'active', label: 'Active instructors', icon: GraduationCap, count: activeRows.length },
    { id: 'archived', label: 'Archived instructors', icon: Archive, count: archivedRows.length },
    { id: 'payments', label: 'Payments', icon: Users },
  ]

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">Active</p>
          <p className="mt-1 text-2xl font-bold text-teal-900">{activeRows.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Archived</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{archivedRows.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Legacy rule
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
            Convert sets status Completed — removed from applicant pipeline, listed here.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
                tab === t.id
                  ? 'bg-[#0f172a] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#00d4aa]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
              {t.count != null && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    tab === t.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab !== 'payments' && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <label className="block text-xs font-semibold text-slate-600">
            Search instructors
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                placeholder="Name, email, location, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
        </div>
      )}

      {err && <p className="mb-4 text-sm text-red-700">{err}</p>}
      {loading && <p className="mb-4 text-sm text-slate-500">Loading…</p>}

      {tab === 'payments' ? (
        <div>
          <PortalJsonTable
            rows={paymentPageRows}
            maxRows={PAYMENT_PAGE_SIZE}
            emptyMessage="No instructor payments recorded."
          />
          {paymentRows.length > PAYMENT_PAGE_SIZE ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-600">
              <p>
                Showing {(paymentSafePage - 1) * PAYMENT_PAGE_SIZE + 1}–
                {Math.min(paymentSafePage * PAYMENT_PAGE_SIZE, paymentRows.length)} of{' '}
                <span className="font-semibold text-slate-900">{paymentRows.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paymentSafePage <= 1}
                  onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-800">
                  {paymentSafePage} / {paymentTotalPages}
                </span>
                <button
                  type="button"
                  disabled={paymentSafePage >= paymentTotalPages}
                  onClick={() => setPaymentsPage((p) => Math.min(paymentTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <InstructorRosterTable
          rows={filteredRoster}
          archived={tab === 'archived'}
          onOpenDetail={openInstructorDetail}
          onOpenEmail={openInstructorEmailModal}
        />
      )}

      {(detailRow || detailLoading) && (
        <AdminInstructorDetailModal
          row={detailRow}
          loading={detailLoading}
          onClose={() => {
            setDetailRow(null)
            setDetailLoading(false)
          }}
        />
      )}

      {emailModal && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close send email"
            onClick={() => setEmailModal(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="instructor-send-email-title"
              className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="instructor-send-email-title" className="text-lg font-bold text-slate-900">
                    Send email
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.instructorName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid gap-3 text-sm">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">To</span>
                    <input
                      type="email"
                      value={emailModal.to}
                      onChange={(e) => setEmailModal({ ...emailModal, to: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Cc</span>
                    <input
                      type="text"
                      value={emailModal.cc}
                      onChange={(e) => setEmailModal({ ...emailModal, cc: e.target.value })}
                      placeholder="Optional, comma-separated"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Bcc</span>
                    <input
                      type="text"
                      value={emailModal.bcc}
                      onChange={(e) => setEmailModal({ ...emailModal, bcc: e.target.value })}
                      placeholder="Optional, comma-separated"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Subject</span>
                    <input
                      type="text"
                      value={emailModal.subject}
                      onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Body</span>
                    <textarea
                      rows={10}
                      value={emailModal.body}
                      onChange={(e) => setEmailModal({ ...emailModal, body: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  {emailMsg && (
                    <p
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        emailMsg.includes('sent')
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      {emailMsg}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={emailSending}
                  onClick={() => void sendInstructorEmail()}
                  className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {emailSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
