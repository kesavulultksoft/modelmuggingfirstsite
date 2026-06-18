'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Search, Shield, UserCheck, X } from 'lucide-react'
import {
  fetchAdminBgAgentUsers,
  fetchMe,
  getToken,
  postAdminEmailSend,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type AgentRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function displayName(row: AgentRow): string {
  const full = `${str(row.firstName)} ${str(row.lastName)}`.trim()
  return full || str(row.email) || '—'
}

function displayEmail(row: AgentRow): string {
  return str(row.email) || '—'
}

function emailForSend(row: AgentRow): string {
  return str(row.email)
}

function displayPhone(row: AgentRow): string {
  return formatUsPhoneDisplay(row.phone) || '—'
}

function initials(row: AgentRow): string {
  const name = displayName(row)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'BG'
}

function emailVerifiedLabel(row: AgentRow): { text: string; tone: string } {
  const v = row.emailVerified
  if (v === true) {
    return { text: 'Verified', tone: 'bg-emerald-100 text-emerald-800' }
  }
  if (v === false) {
    return { text: 'Not verified', tone: 'bg-amber-100 text-amber-900' }
  }
  return { text: 'Legacy', tone: 'bg-slate-100 text-slate-700' }
}

export default function AdminContractorsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<AgentRow[]>([])
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailModal, setEmailModal] = useState<{
    name: string
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
  } | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/contractors')
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
    let cancelled = false
    setLoading(true)
    setErr('')
    fetchAdminBgAgentUsers()
      .then((d) => {
        if (!cancelled) setRows(legacyAsObjectArray(d))
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([])
          setErr(String((e as Error).message || e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [me])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [displayName(r), displayEmail(r), displayPhone(r), str(r.role), str(r.userType)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [rows, search])

  const verifiedCount = useMemo(
    () => filteredRows.filter((r) => r.emailVerified === true).length,
    [filteredRows]
  )

  function openEmailModal(row: AgentRow) {
    const name = displayName(row)
    const to = emailForSend(row)
    if (!to) {
      setErr('No email on file for this investigator.')
      return
    }
    setEmailMsg('')
    setEmailModal({
      name,
      to,
      cc: '',
      bcc: '',
      subject: 'Model Mugging Self Defense',
      body: name,
    })
  }

  async function sendEmail() {
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
        category: 'contractor-bg-agent',
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

  return (
    <>
      <PortalPageHeader
        title="Contractors & investigators"
        subtitle="Background investigators (portal role BGAGENT). They review applicant background checks in the BG agent queue."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Investigators</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredRows.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Email verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">Role</p>
          <p className="mt-1 text-sm font-semibold text-indigo-900">BG agent</p>
        </div>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="block text-xs font-semibold text-slate-600">
          Search investigators
          <div className="relative mt-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
              placeholder="Name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> of {rows.length}{' '}
          investigator{rows.length === 1 ? '' : 's'}
        </p>
      </section>

      {err && (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>
      )}
      {loading && <p className="mb-4 text-sm text-slate-500">Loading investigators…</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3.5">Investigator</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Email status</th>
                <th className="px-4 py-3.5">Account created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((r, i) => {
                const name = displayName(r)
                const email = displayEmail(r)
                const phone = displayPhone(r)
                const verified = emailVerifiedLabel(r)
                return (
                  <tr key={str(r.id) || i} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
                          {initials(r)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{name}</span>
                            <button
                              type="button"
                              title="Send email"
                              disabled={!emailForSend(r)}
                              onClick={() => openEmailModal(r)}
                              className="shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Mail className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Email investigator</span>
                            </button>
                          </div>
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                            {str(r.role) || 'BGAGENT'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3.5 text-slate-700" title={email}>
                      {email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{phone}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${verified.tone}`}
                      >
                        <UserCheck className="h-3 w-3 opacity-70" aria-hidden />
                        {verified.text}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {formatWhen(r.createdAt ?? r.createdDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filteredRows.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
            <p className="text-base font-semibold text-slate-800">No background investigators</p>
            <p className="mt-2 text-sm text-slate-600">
              BG agent portal users appear here when an account is created with role BGAGENT.
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
              aria-labelledby="contractor-send-email-title"
              className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="contractor-send-email-title" className="text-lg font-bold text-slate-900">
                    Send email
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.name}</p>
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
                  onClick={() => void sendEmail()}
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
