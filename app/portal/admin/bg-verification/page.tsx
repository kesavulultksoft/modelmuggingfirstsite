'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Mail, Search, ShieldCheck, X } from 'lucide-react'
import {
  fetchAdminBackgroundVerifications,
  fetchAdminTrainerApplicants,
  fetchMe,
  getToken,
  postAdminEmailSend,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Tab = 'pending' | 'approved' | 'rejected'
type BgRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function statusTone(status: string): string {
  const s = status.toLowerCase()
  if (/successful|approved|verified|paid/.test(s) && !/unsuccessful|unpaid|not paid|due/.test(s)) {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (/unsuccessful|rejected|fail|paymentfail/.test(s)) return 'bg-red-100 text-red-800'
  if (/submitted|pending|progress/.test(s)) return 'bg-amber-100 text-amber-900'
  return 'bg-slate-100 text-slate-800'
}

function paymentTone(row: BgRow): string {
  if (row.standardFeePaid === true) return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
  if (row.standardFeeInCart === true) return 'bg-sky-50 text-sky-900 ring-sky-200'
  if (row.additionalFeeDue === true) return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-50 text-slate-700 ring-slate-200'
}

function applicantName(row: BgRow): string {
  return str(row.applicantName) || `${str(row.firstName)} ${str(row.lastName)}`.trim() || '—'
}

function applicantEmail(row: BgRow): string {
  const e = str(row.applicantEmail) || str(row.emailId) || str(row.email)
  return e || '—'
}

function applicantEmailForSend(row: BgRow): string {
  const e = str(row.applicantEmail) || str(row.emailId) || str(row.email)
  return e
}

function applicantPhone(row: BgRow): string {
  const raw =
    row.contactPhoneSnapshot ??
    row.contactNumber ??
    row.phone ??
    row.alternatePhoneNumber ??
    row.portalUserPhone
  return formatUsPhoneDisplay(raw) || '—'
}

function bgStatus(row: BgRow): string {
  return str(row.status) || '—'
}

function paymentLabel(row: BgRow): string {
  return str(row.paymentSummary) || '—'
}

export default function AdminBgVerificationPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  const [pending, setPending] = useState<BgRow[]>([])
  const [approved, setApproved] = useState<BgRow[]>([])
  const [rejected, setRejected] = useState<BgRow[]>([])
  const [pipelineByEmail, setPipelineByEmail] = useState<Map<string, string>>(new Map())
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailModal, setEmailModal] = useState<{
    applicantName: string
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
  } | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/bg-verification')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchAdminTrainerApplicants(false)
      .then((list) => {
        const map = new Map<string, string>()
        for (const r of legacyAsObjectArray(list)) {
          const email = str(r.emailId).toLowerCase()
          const dum = str(r.dumId)
          if (email && dum) map.set(email, dum)
        }
        setPipelineByEmail(map)
      })
      .catch(() => setPipelineByEmail(new Map()))
  }, [me])

  async function reloadAll() {
    setLoading(true)
    setErr('')
    try {
      const [p, a, r] = await Promise.all([
        fetchAdminBackgroundVerifications('pending'),
        fetchAdminBackgroundVerifications('approved'),
        fetchAdminBackgroundVerifications('rejected'),
      ])
      setPending(legacyAsObjectArray(p))
      setApproved(legacyAsObjectArray(a))
      setRejected(legacyAsObjectArray(r))
    } catch (e) {
      setPending([])
      setApproved([])
      setRejected([])
      setErr(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!me) return
    void reloadAll()
  }, [me])

  const rows = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const blob = [
        applicantName(r),
        applicantEmail(r),
        applicantPhone(r),
        bgStatus(r),
        paymentLabel(r),
        str(r.contactNumber),
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search])

  useEffect(() => {
    // Reset paging when switching queue or changing search.
    setPage(1)
  }, [tab, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const paidCount = useMemo(
    () => filteredRows.filter((r) => r.standardFeePaid === true).length,
    [filteredRows]
  )

  function openApplicantEmailModal(row: BgRow, name: string) {
    const to = applicantEmailForSend(row)
    if (!to) {
      setErr('No email on file for this applicant.')
      return
    }
    setEmailMsg('')
    setEmailModal({
      applicantName: name,
      to,
      cc: '',
      bcc: '',
      subject: 'Model Mugging Self Defense',
      body: name,
    })
  }

  async function sendApplicantEmail() {
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
        html: bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
        category: 'bg-verification-applicant',
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

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const tabs: { id: Tab; label: string; count: number; hint: string }[] = [
    { id: 'pending', label: 'Pending', count: pending.length, hint: 'Submitted, paid, awaiting BG agent' },
    { id: 'approved', label: 'Approved', count: approved.length, hint: 'Successful / approved' },
    { id: 'rejected', label: 'Rejected', count: rejected.length, hint: 'Unsuccessful / rejected' },
  ]

  return (
    <>
      <PortalPageHeader
        title="Background verification"
        subtitle={
          <>
            Review applicant background checks and payment status. BG agents finalize approval in their queue;{' '}
            <Link href="/portal/admin/trainer-pipeline" className="font-semibold text-[#0d9488] hover:underline">
              trainer pipeline
            </Link>{' '}
            shows overall onboarding progress.
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">In view</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredRows.length}</p>
        </div>
        {tab === 'pending' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Standard fee paid</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{paidCount}</p>
          </div>
        )}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">Queue</p>
          <p className="mt-1 text-sm font-semibold text-indigo-900 capitalize">{tab}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            title={t.hint}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-[#0f172a] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="block text-xs font-semibold text-slate-600">
          Search
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
              placeholder="Name, email, status, payment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> of {rows.length}{' '}
          {tab} record{rows.length === 1 ? '' : 's'}
        </p>
      </section>

      {err && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>
      )}
      {loading && <p className="mb-4 text-sm text-slate-500">Loading…</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3.5">Applicant</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">BG status</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Submitted</th>
                {tab !== 'pending' && <th className="px-4 py-3.5">Completed</th>}
                <th className="px-4 py-3.5">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((r, i) => {
                const name = applicantName(r)
                const email = applicantEmail(r)
                const phone = applicantPhone(r)
                const status = bgStatus(r)
                const payment = paymentLabel(r)
                const submitted = r.createdDate ?? r.createdAt ?? r.updatedAt
                const completed = r.completionDate ?? r.orderCompletionDate
                const emailKey = applicantEmailForSend(r).toLowerCase()
                const pipelineId = emailKey ? pipelineByEmail.get(emailKey) : undefined
                return (
                  <tr key={str(r.recordId) || i} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{name}</span>
                        <button
                          type="button"
                          title="Send email to applicant"
                          disabled={!applicantEmailForSend(r)}
                          onClick={() => openApplicantEmailModal(r, name)}
                          className="shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Mail className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Email applicant</span>
                        </button>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3.5 text-slate-700" title={email}>
                      {email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{phone}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone(status)}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex max-w-[240px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${paymentTone(r)}`}
                        title={payment}
                      >
                        <CreditCard className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        <span className="truncate">{payment}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatWhen(submitted)}</td>
                    {tab !== 'pending' && (
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatWhen(completed)}</td>
                    )}
                    <td className="px-4 py-3.5">
                      {pipelineId ? (
                        <Link
                          href="/portal/admin/trainer-pipeline"
                          className="font-semibold text-teal-800 hover:underline"
                        >
                          Trainer pipeline
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredRows.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{' '}
              <span className="font-semibold text-slate-900">{filteredRows.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
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
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {!loading && filteredRows.length === 0 && (
          <div className="px-6 py-14 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
            <p className="text-base font-semibold text-slate-800">No records in this queue</p>
            <p className="mt-2 text-sm text-slate-600">
              {tab === 'pending'
                ? 'Pending includes submitted forms and paid applicants awaiting BG agent review.'
                : 'Try another tab or clear your search.'}
            </p>
          </div>
        )}
      </div>

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
              aria-labelledby="bg-send-email-title"
              className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="bg-send-email-title" className="text-lg font-bold text-slate-900">
                    Send email
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.applicantName}</p>
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
                  onClick={() => void sendApplicantEmail()}
                  className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {emailSending ? 'Sending…' : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
