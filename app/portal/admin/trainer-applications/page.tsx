'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, X } from 'lucide-react'
import {
  fetchAdminTrainerPortalApplication,
  fetchAdminTrainerPortalApplications,
  fetchMe,
  getToken,
  postAdminEmailSend,
  type MeUser,
} from '@/lib/portalApi'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { mongoIdToString } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type AppRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function applicantEmailForSend(row: AppRow): string {
  const q = asRecord(row.questionnaire)
  const lead = q ? asRecord(q.lead) : null
  return str(row.portalEmail) || str(lead?.email) || ''
}

function applicantPhone(row: AppRow): string {
  const q = asRecord(row.questionnaire)
  const lead = q ? asRecord(q.lead) : null
  const raw = row.portalPhone ?? lead?.phone
  return formatUsPhoneDisplay(raw) || '—'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-US')
}

function VerifiedPill({ verified }: { verified: unknown }) {
  if (verified == null) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">—</span>
  }
  const ok = Boolean(verified) === true
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
      }`}
    >
      {ok ? 'Verified' : 'Not verified'}
    </span>
  )
}

function StatusPill({ status }: { status: unknown }) {
  const s = str(status) || 'draft'
  const lower = s.toLowerCase()
  const done = /complete|submit|approved/i.test(lower)
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
        done ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {s.length > 18 ? s.slice(0, 17) + '…' : s}
    </span>
  )
}

function LeadSection({ lead }: { lead: Record<string, unknown> | null }) {
  if (!lead || Object.keys(lead).length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No linked public lead on this record. The applicant may have registered without the short{' '}
        <Link href="/apply/trainer" className="font-semibold underline">
          /apply/trainer
        </Link>{' '}
        form, or used a different email.
      </p>
    )
  }
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">From public interest form</h3>
      <p className="mt-1 text-xs text-slate-500">Same block instructors see on their trainer application page.</p>
      <dl className="mt-4 space-y-2 text-sm">
        {lead.firstName != null || lead.lastName != null ? (
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-slate-500">Name</dt>
            <dd className="text-slate-900">
              {String(lead.firstName || '')} {String(lead.lastName || '')}
            </dd>
          </div>
        ) : null}
        {lead.email != null ? (
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-slate-500">Email</dt>
            <dd className="text-slate-900">{String(lead.email)}</dd>
          </div>
        ) : null}
        {lead.phone != null && formatUsPhoneDisplay(lead.phone) ? (
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-slate-500">Phone</dt>
            <dd className="text-slate-900">{formatUsPhoneDisplay(lead.phone)}</dd>
          </div>
        ) : null}
        {lead.locationIntent != null ? (
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 text-slate-500">Location intent</dt>
            <dd className="text-slate-900">{String(lead.locationIntent)}</dd>
          </div>
        ) : null}
        {lead.notes != null ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <dt className="w-32 shrink-0 text-slate-500">Notes</dt>
            <dd className="whitespace-pre-wrap text-slate-900">{String(lead.notes)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

function QuestionnaireExtras({ questionnaire }: { questionnaire: Record<string, unknown> | null }) {
  if (!questionnaire) return null
  const entries = Object.entries(questionnaire).filter(([k]) => k !== 'lead')
  if (entries.length === 0) return null
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Questionnaire (portal draft)</h3>
      <dl className="mt-4 space-y-3 text-sm">
        {entries.map(([key, val]) => {
          if (val == null || val === '') return null
          const label = labelForFormField(key)
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            return (
              <div key={key} className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
                <dd className="whitespace-pre-wrap text-slate-900">{String(val)}</dd>
              </div>
            )
          }
          if (Array.isArray(val)) {
            return (
              <div key={key} className="flex flex-col gap-1">
                <dt className="text-slate-500">{label}</dt>
                <dd>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-800">
                    {JSON.stringify(val, null, 2)}
                  </pre>
                </dd>
              </div>
            )
          }
          const rec = asRecord(val)
          if (rec) {
            return (
              <div key={key} className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-600">{label}</dt>
                <dd>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-800">
                    {JSON.stringify(rec, null, 2)}
                  </pre>
                </dd>
              </div>
            )
          }
          return null
        })}
      </dl>
    </section>
  )
}

export default function AdminTrainerApplicationsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<AppRow[]>([])
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AppRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailErr, setDetailErr] = useState('')
  const [notice, setNotice] = useState('')
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
      router.replace('/login?next=/portal/admin/trainer-applications')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
          router.replace('/portal')
          return
        }
        setMe(u)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchAdminTrainerPortalApplications()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'))
  }, [me])

  useEffect(() => {
    // Reset paging when search/filter changes.
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (!openUserId) {
      setDetail(null)
      setDetailErr('')
      return
    }
    setDetailLoading(true)
    setDetailErr('')
    fetchAdminTrainerPortalApplication(openUserId)
      .then((data) => {
        if (data && typeof data === 'object') {
          setDetail(data as AppRow)
        }
      })
      .catch((e) => setDetailErr(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setDetailLoading(false))
  }, [openUserId])

  function openApplicantDetail(row: AppRow) {
    const id = mongoIdToString(row.userId)
    if (!id) {
      setNotice('This row has no user id; cannot load details.')
      return
    }
    setNotice('')
    setDetailErr('')
    setDetail({ ...row })
    setOpenUserId(id)
  }

  function closeApplicantDetail() {
    setOpenUserId(null)
  }

  function openApplicantEmailModal(row: AppRow, displayName: string) {
    const to = applicantEmailForSend(row)
    if (!to) {
      setNotice('No email on file for this applicant.')
      return
    }
    setEmailMsg('')
    setEmailModal({
      applicantName: displayName,
      to,
      cc: '',
      bcc: '',
      subject: 'Model Mugging Self Defense',
      body: displayName,
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
        category: 'trainer-applications-applicant',
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

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      const s = str(r.status).trim()
      if (s) set.add(s)
    })
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b))]
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && str(r.status).toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }
      if (!q) return true
      return JSON.stringify(r).toLowerCase().includes(q)
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const summary = useMemo(() => {
    const total = rows.length
    let verified = 0
    let unverified = 0
    let withLead = 0
    rows.forEach((r) => {
      const v = r.portalEmailVerified
      if (v == null) {
        /* skip */
      } else if (Boolean(v)) verified += 1
      else unverified += 1
      const q = asRecord(r.questionnaire)
      const lead = q ? asRecord(q.lead) : null
      if (lead && Object.keys(lead).length > 0) withLead += 1
    })
    return { total, verified, unverified, withLead }
  }, [rows])

  if (!me) {
    return <div className="py-20 text-center text-slate-500">Loading…</div>
  }

  const questionnaire = asRecord(detail?.questionnaire)
  const lead = questionnaire ? asRecord(questionnaire.lead) : null
  const portalUser = asRecord(detail?.portalUser)

  return (
    <>
      <PortalPageHeader
        title="Portal trainer applications"
        subtitle={
          <>
            Intake and questionnaire drafts in <code className="rounded bg-slate-100 px-1 text-xs">mm_trainer_applications</code>
            . For contact/address verification, interview stages, assignments, and convert-to-instructor, use the{' '}
            <Link href="/portal/admin/trainer-pipeline" className="font-semibold text-[#0d9488] underline">
              applicant pipeline
            </Link>{' '}
            (<code className="rounded bg-slate-100 px-1 text-xs">mm_instructors</code> +{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">mm_contact_information</code>).
          </>
        }
        subtitleFullWidth
      />

      {err ? <p className="mb-4 text-sm text-red-600">{err}</p> : null}
      {notice ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{notice}</p>
      ) : null}

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Application intake</p>
            <p className="text-sm text-slate-600">
              Review signup data and draft questionnaire content. Open a row to see the same structured view as the
              instructor portal.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total records</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Email verified</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{summary.verified}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Not verified</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{summary.unverified}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">With public form lead</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{summary.withLead}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="Search name, email, user id, source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Applicant</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Portal email</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Status</th>
              <th className="p-3">Source</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Manage</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const userId = mongoIdToString(r.userId)
              const q = asRecord(r.questionnaire)
              const leadSnap = q ? asRecord(q.lead) : null
              const nameFromLead =
                leadSnap &&
                `${String(leadSnap.firstName || '')} ${String(leadSnap.lastName || '')}`.trim()
              const nameFromPortal =
                `${str(r.portalFirstName)} ${str(r.portalLastName)}`.trim() || ''
              const displayName = nameFromPortal || nameFromLead || str(r.portalEmail) || '—'
              const email = str(r.portalEmail) || str(leadSnap?.email) || '—'
              const phone = applicantPhone(r)
              return (
                <tr
                  key={userId ? `${userId}-${i}` : `row-${i}`}
                  className="border-b border-slate-50 hover:bg-slate-50/80"
                >
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!userId}
                          onClick={() => openApplicantDetail(r)}
                          className={`text-left font-medium text-slate-900 underline decoration-transparent decoration-2 underline-offset-2 hover:decoration-[#0d9488] ${userId ? '' : 'cursor-not-allowed opacity-50'}`}
                        >
                          {displayName}
                        </button>
                        <button
                          type="button"
                          title="Send email to applicant"
                          disabled={!applicantEmailForSend(r)}
                          onClick={() => openApplicantEmailModal(r, displayName)}
                          className="shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Mail className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Email applicant</span>
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-slate-700">{phone}</td>
                    <td className="p-3 text-slate-800">{email}</td>
                    <td className="p-3">
                      <VerifiedPill verified={r.portalEmailVerified} />
                    </td>
                    <td className="p-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="max-w-[200px] truncate p-3 text-slate-600" title={str(r.source)}>
                      {str(r.source) || '—'}
                    </td>
                    <td className="p-3 text-slate-600">{formatWhen(r.updatedAt || r.createdAt)}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={!userId}
                        onClick={() => (openUserId === userId ? closeApplicantDetail() : openApplicantDetail(r))}
                        className="text-xs font-bold text-[#0d9488] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {openUserId === userId ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
              )
            })}
          </tbody>
        </table>
        {filteredRows.length > PAGE_SIZE ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-600">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{' '}
              <span className="font-semibold text-slate-900">{filteredRows.length}</span>
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
        ) : null}
        {filteredRows.length === 0 && !err ? (
          <div className="p-10 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-800">No applications for this view</p>
              <p className="mt-2 text-sm text-slate-600">Try clearing search or choosing another status.</p>
            </div>
          </div>
        ) : null}
      </div>

      {openUserId ? (
        <div className="fixed inset-0 z-[230]">
          <div className="absolute inset-0 bg-slate-900/40" onClick={closeApplicantDetail} aria-hidden />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portal application</p>
                <h2 className="truncate text-lg font-bold text-slate-900">
                  {str(portalUser?.firstName) || str(lead?.firstName)}{' '}
                  {str(portalUser?.lastName) || str(lead?.lastName)}
                </h2>
                <p className="truncate text-xs text-slate-500">{str(portalUser?.email) || str(lead?.email) || openUserId}</p>
              </div>
              <button
                type="button"
                onClick={closeApplicantDetail}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {!detail && detailLoading ? (
                <p className="text-sm text-slate-600">Loading…</p>
              ) : detail ? (
                <div className="space-y-4">
                  {detailLoading ? (
                    <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      Refreshing from server…
                    </p>
                  ) : null}
                  {detailErr ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {detailErr}
                      <span className="mt-1 block text-xs font-normal text-red-700">
                        Showing list data below; fix the error or retry by closing and opening again.
                      </span>
                    </p>
                  ) : null}
                  <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-teal-800">Portal account</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <dt className="w-36 shrink-0 text-teal-900/80">Email verified</dt>
                        <dd>
                          <VerifiedPill verified={portalUser?.emailVerified ?? detail.portalEmailVerified} />
                        </dd>
                      </div>
                      {portalUser?.phone != null && str(portalUser.phone) ? (
                        <div className="flex gap-2">
                          <dt className="w-36 shrink-0 text-teal-900/80">Phone</dt>
                          <dd className="text-slate-900">{formatUsPhoneDisplay(portalUser.phone) || str(portalUser.phone)}</dd>
                        </div>
                      ) : null}
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 text-teal-900/80">Status</dt>
                        <dd>
                          <StatusPill status={detail.status} />
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 text-teal-900/80">Source</dt>
                        <dd className="text-slate-900">{str(detail.source) || '—'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 text-teal-900/80">Updated</dt>
                        <dd className="text-slate-900">{formatWhen(detail.updatedAt)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-36 shrink-0 text-teal-900/80">User id</dt>
                        <dd className="break-all font-mono text-xs text-slate-800">{str(detail.userId)}</dd>
                      </div>
                    </dl>
                  </section>

                  <LeadSection lead={lead} />
                  <QuestionnaireExtras questionnaire={questionnaire} />

                  <details className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-slate-700">Technical: raw document</summary>
                    <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-800">
                      {JSON.stringify(detail, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : detailErr ? (
                <p className="text-sm text-red-600">{detailErr}</p>
              ) : (
                <p className="text-sm text-slate-600">No data for this applicant.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

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
              aria-labelledby="trainer-app-send-email-title"
              className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="trainer-app-send-email-title" className="text-lg font-bold text-slate-900">
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
