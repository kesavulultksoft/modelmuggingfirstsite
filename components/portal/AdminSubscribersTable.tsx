'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Mail,
  X,
} from 'lucide-react'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay, telHref } from '@/lib/phoneUs'
import { extractSubscriberGeo } from '@/lib/subscriberGeo'
import { crmDateFieldToUs } from '@/lib/usDate'
import { postAdminEmailSend } from '@/lib/portalApi'

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function pickBool(row: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const v = row[key]
    if (v === true || v === 'true' || v === 'Yes' || v === 'yes') return true
  }
  return false
}

export type SubscriberTableVariant = 'subscription' | 'parents'

export type NormalizedSubscriberRow = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  subscribedOn: string
  addressLine: string
  city: string
  stateRegion: string
  country: string
  type: string
  groupSubscription: string
  unsubscribed: boolean
  studentName: string
  raw: Record<string, unknown>
}

function normalizeSubscriptionRow(
  r: Record<string, unknown>,
  labelsById: Record<string, string>,
): NormalizedSubscriberRow {
  const firstName = pickString(r, ['firstName'])
  const lastName = pickString(r, ['lastName'])
  const geo = extractSubscriberGeo(r, labelsById)
  return {
    id: coerceMongoIdFromRow(r),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ') || '—',
    email: pickString(r, ['email', 'emailId', 'emailAddress']),
    phone: formatUsPhoneDisplay(pickString(r, ['phoneNumber', 'phone', 'mobile', 'mobileNo'])),
    subscribedOn: crmDateFieldToUs(r.createdDate ?? r.subscribedOn ?? r.createdOn),
    addressLine: geo.addressLine,
    city: geo.city,
    stateRegion: geo.stateRegion,
    country: geo.country,
    type: pickString(r, ['type']),
    groupSubscription: pickString(r, ['groupSubscription']),
    unsubscribed: pickBool(r, ['isUnSubscribe', 'unsubscribed', 'isUnsubscribed']),
    studentName: '',
    raw: r,
  }
}

function normalizeParentRow(
  r: Record<string, unknown>,
  labelsById: Record<string, string>,
): NormalizedSubscriberRow {
  const firstName = pickString(r, ['parentFirstName', 'firstName'])
  const lastName = pickString(r, ['parentlastName', 'parentLastName', 'lastName'])
  const geo = extractSubscriberGeo(r, labelsById)
  return {
    id: coerceMongoIdFromRow(r),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ') || '—',
    email: pickString(r, ['parentEmailAddress', 'email', 'emailId']),
    phone: formatUsPhoneDisplay(pickString(r, ['parentPhoneNumber', 'phoneNumber', 'phone'])),
    subscribedOn: crmDateFieldToUs(r.createdDate ?? r.subscribedOn),
    addressLine: geo.addressLine,
    city: geo.city,
    stateRegion: geo.stateRegion,
    country: geo.country,
    type: 'Parent',
    groupSubscription: '',
    unsubscribed: false,
    studentName: pickString(r, ['studentName']),
    raw: r,
  }
}

type SortKey =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'subscribedOn'
  | 'city'
  | 'stateRegion'
  | 'country'
  | 'type'
  | 'phone'
  | 'studentName'

type ColDef = {
  key: string
  sortKey?: SortKey
  label: string
  sortable: boolean
  className?: string
  cell: (row: NormalizedSubscriberRow) => ReactNode
}

const PAGE_SIZE = 25

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronDown className="ml-1 inline h-3.5 w-3.5 opacity-30" aria-hidden />
  return dir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-[#0d9488]" aria-hidden />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-[#0d9488]" aria-hidden />
  )
}

function statusBadge(row: NormalizedSubscriberRow) {
  if (row.unsubscribed) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
        Unsubscribed
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
      Active
    </span>
  )
}

function typeBadge(type: string) {
  if (!type) return <span className="text-slate-400">—</span>
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      {type}
    </span>
  )
}

export default function AdminSubscribersTable({
  rows,
  variant,
  showTypeColumn = false,
  loading = false,
  emptyMessage = 'No records match this filter.',
  geoLabelsById = {},
}: {
  rows: Record<string, unknown>[]
  variant: SubscriberTableVariant
  showTypeColumn?: boolean
  loading?: boolean
  emptyMessage?: string
  geoLabelsById?: Record<string, string>
}) {
  const [sortKey, setSortKey] = useState<SortKey>('subscribedOn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<NormalizedSubscriberRow | null>(null)
  const [emailModal, setEmailModal] = useState<{
    to: string
    subject: string
    body: string
  } | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  useEffect(() => {
    setPage(1)
    setDetail(null)
    setSortKey(variant === 'parents' ? 'fullName' : 'subscribedOn')
    setSortDir('desc')
  }, [variant, rows.length])

  const normalized = useMemo(() => {
    const fn = variant === 'parents' ? normalizeParentRow : normalizeSubscriptionRow
    return rows.map((r) => fn(r, geoLabelsById))
  }, [rows, variant, geoLabelsById])

  const sorted = useMemo(() => {
    const list = [...normalized]
    list.sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase()
      const bv = String(b[sortKey] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [normalized, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'subscribedOn' ? 'desc' : 'asc')
    }
  }

  function openSubscriberEmail(row: NormalizedSubscriberRow) {
    setEmailMsg('')
    setEmailModal({
      to: row.email,
      subject: 'Model Mugging Self Defense',
      body: `Hello ${row.firstName || row.fullName || 'there'},\n\n`,
    })
  }

  async function sendSubscriberEmail() {
    if (!emailModal) return
    const to = emailModal.to.trim()
    const subject = emailModal.subject.trim()
    const bodyText = emailModal.body.trim()
    if (!to) {
      setEmailMsg('Recipient email is required.')
      return
    }
    if (!subject) {
      setEmailMsg('Subject is required.')
      return
    }
    if (!bodyText) {
      setEmailMsg('Email body is required.')
      return
    }
    setEmailSending(true)
    setEmailMsg('')
    try {
      const res = await postAdminEmailSend({
        to,
        cc: undefined,
        bcc: undefined,
        subject,
        text: bodyText,
        html: bodyText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>'),
        category: 'subscriber-management',
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
    } finally {
      setEmailSending(false)
    }
  }

  const subscriptionCols: ColDef[] = [
    {
      key: 'firstName',
      sortKey: 'firstName',
      label: 'First name',
      sortable: true,
      cell: (r) => <span className="font-medium text-slate-900">{r.firstName || '—'}</span>,
    },
    {
      key: 'lastName',
      sortKey: 'lastName',
      label: 'Last name',
      sortable: true,
      cell: (r) => <span className="text-slate-800">{r.lastName || '—'}</span>,
    },
    {
      key: 'email',
      sortKey: 'email',
      label: 'Email',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (r) =>
        r.email ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openSubscriberEmail(r)
            }}
            className="inline-flex max-w-[220px] items-center gap-1.5 truncate font-medium text-[#0d9488] hover:underline"
            title={`Send email to ${r.email}`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {r.email}
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'subscribedOn',
      sortKey: 'subscribedOn',
      label: 'Subscribed on',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-slate-700">{r.subscribedOn || '—'}</span>,
    },
    {
      key: 'city',
      sortKey: 'city',
      label: 'City',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.city || '—'}</span>,
    },
    {
      key: 'stateRegion',
      sortKey: 'stateRegion',
      label: 'State / region',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.stateRegion || '—'}</span>,
    },
    {
      key: 'country',
      sortKey: 'country',
      label: 'Country',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.country || '—'}</span>,
    },
  ]

  if (showTypeColumn) {
    subscriptionCols.push({
      key: 'type',
      sortKey: 'type',
      label: 'Type',
      sortable: true,
      cell: (r) => typeBadge(r.type),
    })
  }

  subscriptionCols.push(
    {
      key: 'phone',
      sortKey: 'phone',
      label: 'Phone',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) =>
        r.phone ? (
          <a
            href={telHref(r.phone)}
            className="text-slate-700 hover:text-[#0d9488]"
            onClick={(e) => e.stopPropagation()}
          >
            {r.phone}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      cell: (r) => statusBadge(r),
    },
  )

  const parentCols: ColDef[] = [
    {
      key: 'parentName',
      sortKey: 'fullName',
      label: 'Parent name',
      sortable: true,
      cell: (r) => <span className="font-medium text-slate-900">{r.fullName}</span>,
    },
    {
      key: 'studentName',
      sortKey: 'studentName',
      label: 'Student name',
      sortable: true,
      cell: (r) => <span className="text-slate-800">{r.studentName || '—'}</span>,
    },
    {
      key: 'subscribedOn',
      sortKey: 'subscribedOn',
      label: 'Subscribed on',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-slate-700">{r.subscribedOn || '—'}</span>,
    },
    {
      key: 'city',
      sortKey: 'city',
      label: 'City',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.city || '—'}</span>,
    },
    {
      key: 'stateRegion',
      sortKey: 'stateRegion',
      label: 'State',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.stateRegion || '—'}</span>,
    },
    {
      key: 'country',
      sortKey: 'country',
      label: 'Country',
      sortable: true,
      cell: (r) => <span className="text-slate-700">{r.country || '—'}</span>,
    },
    {
      key: 'email',
      sortKey: 'email',
      label: 'Email',
      sortable: true,
      className: 'min-w-[180px]',
      cell: (r) =>
        r.email ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openSubscriberEmail(r)
            }}
            className="inline-flex w-full items-center gap-1.5 truncate text-[#0d9488] hover:underline"
            title={`Send email to ${r.email}`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{r.email}</span>
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'phone',
      sortKey: 'phone',
      label: 'Phone',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) =>
        r.phone ? (
          <a
            href={telHref(r.phone)}
            className="text-slate-700 hover:text-[#0d9488]"
            onClick={(e) => e.stopPropagation()}
          >
            {r.phone}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ]

  const columns = variant === 'parents' ? parentCols : subscriptionCols

  const detailEntries = detail
    ? Object.entries(detail.raw)
        .filter(([k]) => !k.startsWith('_') && k !== 'password')
        .sort(([a], [b]) => a.localeCompare(b))
    : []

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                    {col.sortable && col.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey!)}
                        className="inline-flex items-center hover:text-slate-800"
                      >
                        {col.label}
                        <SortIcon active={sortKey === col.sortKey} dir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="animate-pulse">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          <div className="h-4 rounded bg-slate-100" />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="ml-auto h-8 w-16 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : pageRows.map((r) => (
                    <tr
                      key={r.id || `${r.email}-${r.fullName}`}
                      className="cursor-pointer hover:bg-slate-50/80"
                      onClick={() => setDetail(r)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                          {col.cell(r)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetail(r)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && !sorted.length && (
          <p className="px-6 py-14 text-center text-sm text-slate-500">{emptyMessage}</p>
        )}

        {sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of{' '}
              <span className="font-semibold text-slate-900">{sorted.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Prev
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close"
            onClick={() => setDetail(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{detail.fullName}</h2>
                  <p className="text-sm text-slate-600">
                    {detail.type}
                    {detail.subscribedOn ? ` · Subscribed ${detail.subscribedOn}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    ...(detail.addressLine ? [['Address', detail.addressLine] as const] : []),
                    ['Email', detail.email],
                    ['Phone', detail.phone],
                    ['City', detail.city],
                    ['State / region', detail.stateRegion],
                    ['Country', detail.country],
                    ...(detail.studentName ? [['Student', detail.studentName] as const] : []),
                    ...(detail.groupSubscription ? [['Group', detail.groupSubscription] as const] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500">All stored fields</summary>
                  <dl className="mt-2 grid gap-2 text-xs">
                    {detailEntries.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[minmax(0,140px)_1fr] gap-2 border-b border-slate-50 pb-2">
                        <dt className="font-mono text-slate-500">{k}</dt>
                        <dd className="break-all text-slate-800">
                          {v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
      {emailModal && (
        <div className="fixed inset-0 z-[290]">
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
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">Send email</h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.to || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
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

                  {emailMsg ? (
                    <p
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        emailMsg.toLowerCase().includes('sent') || emailMsg.toLowerCase().includes('email')
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      {emailMsg}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                  disabled={emailSending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void sendSubscriberEmail()}
                  className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  disabled={emailSending}
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
