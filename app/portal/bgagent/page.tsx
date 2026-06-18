'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Search } from 'lucide-react'
import BgAgentVerificationDetail from '@/components/portal/BgAgentVerificationDetail'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import {
  applicantDisplayName,
  bgStatusBadgeClass,
  bgStatusTone,
  initialsForName,
  resolveApplicantEmail,
  type BgRow,
} from '@/lib/bgAgentDisplay'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import { formatUsDateTime } from '@/lib/usDate'
import {
  fetchBgAgentAdditional,
  fetchBgAgentApproved,
  fetchBgAgentPending,
  fetchBgAgentRejected,
  fetchBgAgentVerificationByUserId,
  fetchMe,
  createBgAgentAdditionalVerification,
  sendBgAgentEmail,
  getToken,
} from '@/lib/portalApi'

type Tab = 'pending' | 'approved' | 'rejected' | 'additional'
type EmailMode = 'candidate' | 'superadmin'

function buildEmailTemplate(tab: Tab, mode: EmailMode, name: string, row: BgRow) {
  const isCandidate = mode === 'candidate'
  const greeting = isCandidate ? `Hello ${name},` : 'Hello Superadmin,'
  const signoff = '\n\nRegards,\nModel Mugging BG Verification Team'
  const amount = String(row.additionalAmount || '').trim()
  const addFee = amount ? `\nAdditional verification fee: $${amount}` : ''

  if (tab === 'approved') {
    return {
      subject: `Background verification completed - ${name}`,
      text:
        `${greeting}\n\nBackground verification has been completed successfully.` +
        (isCandidate ? '\nYou are clear to proceed with the next onboarding step.' : '\nCandidate is approved.') +
        signoff,
    }
  }
  if (tab === 'rejected') {
    return {
      subject: `Background verification update - ${name}`,
      text:
        `${greeting}\n\nBackground verification has been marked unsuccessful.` +
        (isCandidate
          ? '\nPlease reply if you need clarification on next steps.'
          : '\nCandidate is marked unsuccessful. Please advise if escalation is needed.') +
        signoff,
    }
  }
  if (tab === 'additional') {
    return {
      subject: `Additional background verification required - ${name}`,
      text:
        `${greeting}\n\nAdditional verification has been requested for this case.` +
        `${addFee}\nStatus: ${String(row.additionalVerificationStatus || 'Submitted')}` +
        (isCandidate
          ? '\nPlease sign in to your instructor portal and pay the additional fee from your cart.'
          : '\nPlease review and process the additional verification request.') +
        signoff,
    }
  }
  return {
    subject: `Background verification in progress - ${name}`,
    text:
      `${greeting}\n\nYour background verification request is currently in progress.` +
      (isCandidate
        ? '\nWe will notify you once the review is complete.'
        : '\nCandidate record is currently pending review.') +
      signoff,
  }
}

function formatRowDate(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return formatUsDateTime(d)
}

export default function BgAgentPortalPage() {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  const [pending, setPending] = useState<BgRow[]>([])
  const [approved, setApproved] = useState<BgRow[]>([])
  const [rejected, setRejected] = useState<BgRow[]>([])
  const [additional, setAdditional] = useState<BgRow[]>([])
  const [tab, setTab] = useState<Tab>('pending')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<BgRow | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [addUserId, setAddUserId] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [emailDraft, setEmailDraft] = useState<{
    to: string
    cc: string
    bcc: string
    subject: string
    text: string
  } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/bgagent')
      return
    }
    fetchMe().then((u) => {
      if (u?.role !== 'BGAGENT') router.replace('/portal')
      else {
        setOk(true)
        void reloadAll()
      }
    })
  }, [router])

  async function reloadAll() {
    const [p, a, r, x] = await Promise.all([
      fetchBgAgentPending(),
      fetchBgAgentApproved(),
      fetchBgAgentRejected(),
      fetchBgAgentAdditional(),
    ])
    setPending(Array.isArray(p) ? p : [])
    setApproved(Array.isArray(a) ? a : [])
    setRejected(Array.isArray(r) ? r : [])
    setAdditional(Array.isArray(x) ? x : [])
  }

  if (!ok) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading workspace…</p>
      </div>
    )
  }

  const allRows =
    tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : additional
  const q = search.trim().toLowerCase()
  const rows = q
    ? allRows.filter((r) => {
        const blob = [
          applicantDisplayName(r),
          resolveApplicantEmail(r),
          String(r.status ?? ''),
          String(r.userId ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        return blob.includes(q)
      })
    : allRows

  const pendingCandidates = pending.filter((r) => String(r.userId || '').trim().length > 0)
  const detailReadOnly = tab === 'approved' || tab === 'rejected'

  async function openDetails(r: BgRow) {
    setStatusMsg('')
    const uid = String(r.userId || '').trim()
    if (!uid) {
      setDetail(r)
      return
    }
    const d = await fetchBgAgentVerificationByUserId(uid)
    setDetail((d as BgRow | null) ?? r)
  }

  async function openQuickEmail(row: BgRow, mode: EmailMode) {
    setEmailLoading(true)
    let email = resolveApplicantEmail(row)
    const name = applicantDisplayName(row)
    const uid = String(row.userId || '').trim()
    if (mode === 'candidate' && !email && uid) {
      const d = (await fetchBgAgentVerificationByUserId(uid)) as BgRow | null
      email = resolveApplicantEmail(d ?? {})
    }
    setEmailLoading(false)
    const to = mode === 'superadmin' ? 'info@modelmugging.org' : email
    const template = buildEmailTemplate(tab, mode, name, row)
    setEmailDraft({
      to,
      cc: mode === 'superadmin' ? email : 'info@modelmugging.org',
      bcc: '',
      subject: template.subject,
      text: template.text,
    })
    if (mode === 'candidate' && !email) {
      setStatusMsg('No applicant email on file — enter an address in the To field.')
    }
  }

  async function sendQuickEmail() {
    if (!emailDraft?.to.trim()) return
    const res = await sendBgAgentEmail(emailDraft)
    if (res.ok) {
      setStatusMsg('Email sent')
      setEmailDraft(null)
    } else {
      setStatusMsg('Could not send email')
    }
  }

  async function addAdditional() {
    const uid = addUserId.trim()
    if (!uid) return
    const amount = Number(addAmount)
    const res = await createBgAgentAdditionalVerification({
      userId: uid,
      additionalAmount: Number.isFinite(amount) ? amount : undefined,
      additionalVerificationStatus: 'Submitted',
    })
    if (!res.ok) {
      setStatusMsg('Could not create additional verification')
      return
    }
    setAddAmount('')
    setAddUserId('')
    setStatusMsg('Additional verification assigned')
    await reloadAll()
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'approved', label: 'Approved', count: approved.length },
    { id: 'rejected', label: 'Rejected', count: rejected.length },
    { id: 'additional', label: 'Additional', count: additional.length },
  ]

  return (
    <>
      <PortalPageHeader
        title="Background verification"
        subtitle="Review paid and submitted applicants, mark outcomes, assign additional fees, and email candidates — aligned with the legacy BG investigator portal."
      />

      {statusMsg && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          {statusMsg}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-[#0f172a] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === t.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, status…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-[#00d4aa] focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/20"
          />
        </div>
      </div>

      {tab === 'additional' && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Assign additional verification</h3>
          <p className="mt-1 text-xs text-slate-600">
            Sets additional fee and moves the case to the Additional queue until the applicant pays in the portal.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select applicant</option>
              {pendingCandidates.map((r, i) => (
                <option key={`${String(r.userId || i)}`} value={String(r.userId || '')}>
                  {applicantDisplayName(r)}
                </option>
              ))}
            </select>
            <input
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Fee (USD)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void addAdditional()}
              className="rounded-lg bg-[#0f172a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] md:col-span-2"
            >
              Assign fee
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No records in this queue</p>
            <p className="mt-1 text-xs text-slate-500">
              {tab === 'pending'
                ? 'Applicants appear here after they submit the form and pay the investigator fee (status Paid or Submitted).'
                : 'Try another tab or clear your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Additional</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const name = applicantDisplayName(r)
                  const tone = bgStatusTone(r.status)
                  return (
                    <tr key={`${String(r.userId || i)}-${String(r.status || '')}`} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-[#00d4aa]">
                            {initialsForName(name)}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => void openDetails(r)}
                              className="font-semibold text-slate-900 hover:text-[#0d9488] hover:underline"
                            >
                              {name}
                            </button>
                            <p className="text-xs text-slate-500">{resolveApplicantEmail(r) || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={bgStatusBadgeClass(tone)}>{String(r.status ?? '—')}</span>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-xs text-slate-600">
                        {String(r.paymentSummary ?? '—')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {String(r.additionalVerificationStatus ?? 'Not required')}
                        {r.additionalAmount != null && String(r.additionalAmount) !== '' && (
                          <span className="block text-xs text-slate-500">${String(r.additionalAmount)}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatRowDate(r.createdDate ?? r.updatedAt ?? r.paidAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatUsPhoneDisplay(r.contactNumber) || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title="Email candidate"
                            disabled={emailLoading}
                            onClick={() => void openQuickEmail(r, 'candidate')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#00d4aa] hover:bg-teal-50"
                          >
                            <Mail className="size-3" />
                            Applicant
                          </button>
                          <button
                            type="button"
                            title="Email superadmin"
                            disabled={emailLoading}
                            onClick={() => void openQuickEmail(r, 'superadmin')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#00d4aa]"
                          >
                            <Mail className="size-3" />
                            Admin
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openDetails(r)}
                          className="rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
                        >
                          {detailReadOnly ? 'View' : 'Open'}
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

      {detail && (
        <BgAgentVerificationDetail
          detail={detail}
          readOnly={detailReadOnly}
          onClose={() => setDetail(null)}
          onSaved={() => void reloadAll()}
          onMessage={setStatusMsg}
        />
      )}

      {emailDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Quick email</h3>
              <button
                type="button"
                onClick={() => setEmailDraft(null)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-semibold text-slate-700">
                To
                <input
                  value={emailDraft.to}
                  onChange={(e) => setEmailDraft((p) => (p ? { ...p, to: e.target.value } : p))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                CC
                <input
                  value={emailDraft.cc}
                  onChange={(e) => setEmailDraft((p) => (p ? { ...p, cc: e.target.value } : p))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Subject
                <input
                  value={emailDraft.subject}
                  onChange={(e) => setEmailDraft((p) => (p ? { ...p, subject: e.target.value } : p))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Body
                <textarea
                  value={emailDraft.text}
                  onChange={(e) => setEmailDraft((p) => (p ? { ...p, text: e.target.value } : p))}
                  className="mt-1 min-h-[140px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => void sendQuickEmail()}
              className="mt-4 w-full rounded-lg bg-[#0f172a] py-2.5 text-sm font-semibold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
            >
              Send email
            </button>
          </div>
        </div>
      )}
    </>
  )
}
