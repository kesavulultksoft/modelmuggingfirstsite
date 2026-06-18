'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  Mail,
  RefreshCw,
  Search,
  Send,
  UserCircle2,
  Users,
  XCircle,
} from 'lucide-react'
import type { EmailHistoryRow } from '@/lib/portalApi'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import { formatUsDateTime } from '@/lib/usDate'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { cn } from '@/lib/utils'

function rowId(row: EmailHistoryRow): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function parseWhen(v: unknown): Date | null {
  if (v == null || v === '') return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatWhen(v: unknown): string {
  const d = parseWhen(v)
  if (!d) return '—'
  return formatUsDateTime(d)
}

function formatRelative(v: unknown): string {
  const d = parseWhen(v)
  if (!d) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return formatUsDateTime(d)
}

function rowStatus(row: EmailHistoryRow): string {
  if (row.status) return String(row.status)
  return row.transportOk === false ? 'Failed' : 'Sent'
}

function isFailedStatus(status: string): boolean {
  return status.toLowerCase().includes('fail')
}

function statusTone(status: string): string {
  if (isFailedStatus(status)) return 'bg-red-50 text-red-800 ring-red-200/80'
  if (status.toLowerCase().includes('sent')) return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  return 'bg-slate-100 text-slate-700 ring-slate-200/80'
}

function typeLabel(raw: unknown): string {
  const t = String(raw || '').trim()
  if (!t) return 'Email'
  if (t === 'instructor-send') return 'Instructor send'
  if (t === 'admin-send') return 'Admin send'
  if (t === 'Enrolled Students Email') return 'Class roster'
  return t
}

function firstRecipient(to: unknown): string {
  const s = String(to || '').trim()
  if (!s) return '—'
  const first = s.split(/[,;]/)[0]?.trim()
  return first || s
}

function recipientCountDisplay(row: EmailHistoryRow): string {
  if (row.recipientCount != null) {
    return String(row.recipientCount)
  }
  const to = String(row.toEmails || '')
  const cc = String(row.ccEmails || '')
  const bcc = String(row.bccEmails || '')
  const parts = [...to.split(/[,;]/), ...cc.split(/[,;]/), ...bcc.split(/[,;]/)]
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? String(parts.length) : '—'
}

function senderDisplay(row: EmailHistoryRow): string {
  const name = String(row.sentByName || '').trim()
  const role = String(row.sentByRole || '').trim()
  if (name && role) return `${name} (${role})`
  return name || role || '—'
}

type StatusFilter = 'all' | 'sent' | 'failed'

export type PortalEmailHistoryViewProps = {
  title: string
  subtitle: string
  emptyHint: string
  searchPlaceholder?: string
  showSenderColumn?: boolean
  fourthStatLabel?: string
  onLoad: () => Promise<EmailHistoryRow[]>
  onLoadDetail: (id: string) => Promise<EmailHistoryRow>
}

export default function PortalEmailHistoryView({
  title,
  subtitle,
  emptyHint,
  searchPlaceholder = 'Search subject, recipient, type, or status…',
  showSenderColumn = false,
  fourthStatLabel = 'Class roster',
  onLoad,
  onLoadDetail,
}: PortalEmailHistoryViewProps) {
  const [rows, setRows] = useState<EmailHistoryRow[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<EmailHistoryRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  async function loadHistory() {
    setLoading(true)
    try {
      const d = await onLoad()
      setRows(Array.isArray(d) ? d : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter === 'sent') {
      list = list.filter((r) => !isFailedStatus(rowStatus(r)))
    } else if (statusFilter === 'failed') {
      list = list.filter((r) => isFailedStatus(rowStatus(r)))
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [rows, search, statusFilter])

  useEffect(() => {
    // Reset paging when filters change so the user doesn't land on an empty page.
    setPage(1)
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stats = useMemo(() => {
    let sent = 0
    let failed = 0
    let roster = 0
    for (const r of rows) {
      const st = rowStatus(r)
      if (isFailedStatus(st)) failed++
      else sent++
      if (String(r.emailType || '').toLowerCase().includes('enrolled')) roster++
    }
    return { total: rows.length, sent, failed, roster, shown: filtered.length }
  }, [rows, filtered.length])

  async function openDetail(row: EmailHistoryRow) {
    const id = rowId(row)
    setDetail(row)
    if (!id) return
    setDetailLoading(true)
    try {
      const full = await onLoadDetail(id)
      setDetail(full)
    } catch {
      setDetail(row)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
      <PortalPageHeader title={title} subtitle={subtitle} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Mail className="h-4 w-4 text-[#0d9488]" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Total messages</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Delivered</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-900">{stats.sent}</p>
        </div>
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50/50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">Failed</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-red-900">{stats.failed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4 text-indigo-600" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wide">{fourthStatLabel}</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{stats.roster}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative max-w-xl flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'sent' as const, label: 'Sent' },
              { id: 'failed' as const, label: 'Failed' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                statusFilter === f.id
                  ? 'bg-[#0f172a] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadHistory()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{stats.shown}</span> of{' '}
        <span className="font-semibold text-slate-700">{stats.total}</span> messages
        {loading ? ' · Loading…' : ''}
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4 px-4 py-4 sm:px-5">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Send className="h-7 w-7" aria-hidden />
            </span>
            <p className="text-base font-semibold text-slate-800">No emails found</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {rows.length === 0 ? emptyHint : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-5">
                    Message
                  </th>
                  <th className="hidden px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 md:table-cell">
                    Recipient
                  </th>
                  {showSenderColumn ? (
                    <th className="hidden px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 lg:table-cell">
                      Sent by
                    </th>
                  ) : null}
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    When
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    To
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="w-12 px-4 py-3.5 sm:px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r) => {
                  const id = rowId(r)
                  const status = rowStatus(r)
                  const failed = isFailedStatus(status)
                  const subject = String(r.subject || '(No subject)')
                  return (
                    <tr
                      key={id}
                      className="group cursor-pointer transition hover:bg-slate-50/90"
                      onClick={() => void openDetail(r)}
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                              failed
                                ? 'bg-red-50 text-red-600 ring-red-100'
                                : 'bg-teal-50 text-[#0d9488] ring-teal-100',
                            )}
                          >
                            <Mail className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 group-hover:text-[#0d9488]">
                              {subject}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">{typeLabel(r.emailType)}</p>
                            <p className="mt-1 truncate text-xs text-slate-400 md:hidden">
                              {firstRecipient(r.toEmails)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden max-w-[200px] px-4 py-4 md:table-cell">
                        <p className="truncate font-medium text-slate-800" title={String(r.toEmails || '')}>
                          {firstRecipient(r.toEmails)}
                        </p>
                        {r.ccEmails ? (
                          <p className="mt-0.5 truncate text-xs text-slate-500" title={String(r.ccEmails)}>
                            Cc: {String(r.ccEmails).split(/[,;]/)[0]?.trim()}
                          </p>
                        ) : null}
                      </td>
                      {showSenderColumn ? (
                        <td className="hidden max-w-[160px] px-4 py-4 lg:table-cell">
                          <p className="truncate text-sm text-slate-700" title={senderDisplay(r)}>
                            {senderDisplay(r)}
                          </p>
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-medium text-slate-800" title={formatWhen(r.sentDate ?? r.sentOn)}>
                          {formatRelative(r.sentDate ?? r.sentOn)}
                        </p>
                        <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                          {formatWhen(r.sentDate ?? r.sentOn)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold tabular-nums text-slate-700">
                          {recipientCountDisplay(r)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
                            statusTone(status),
                          )}
                        >
                          {failed ? (
                            <XCircle className="h-3 w-3 shrink-0" aria-hidden />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-5">
                        <span className="inline-flex rounded-lg p-2 text-slate-400 opacity-0 transition group-hover:bg-white group-hover:text-[#0d9488] group-hover:opacity-100 group-hover:shadow-sm">
                          <Eye className="h-4 w-4" aria-hidden />
                          <span className="sr-only">View</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span>
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

      {detail && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close email details"
            onClick={() => setDetail(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-detail-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,640px)] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email details</p>
                <h2 id="email-detail-title" className="mt-0.5 truncate text-lg font-bold text-slate-900">
                  {String(detail.subject || '(No subject)')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{formatWhen(detail.sentDate ?? detail.sentOn)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <p className="text-sm text-slate-500">Loading full message…</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                        statusTone(rowStatus(detail)),
                      )}
                    >
                      {rowStatus(detail)}
                    </span>
                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {typeLabel(detail.emailType)}
                    </span>
                  </div>

                  {showSenderColumn && (detail.sentByName || detail.sentByRole) ? (
                    <section className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-4">
                      <div className="flex items-center gap-2 text-indigo-900">
                        <UserCircle2 className="h-4 w-4" aria-hidden />
                        <h3 className="text-xs font-bold uppercase tracking-wide">Sent by</h3>
                      </div>
                      <p className="mt-2 text-sm font-medium text-indigo-950">{senderDisplay(detail)}</p>
                    </section>
                  ) : null}

                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Recipients</h3>
                    <dl className="mt-3 grid gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-slate-500">From</dt>
                        <dd className="mt-0.5 break-all text-slate-900">{String(detail.fromEmail || '—')}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-slate-500">To</dt>
                        <dd className="mt-0.5 break-all text-slate-900">{String(detail.toEmails || '—')}</dd>
                      </div>
                      {detail.ccEmails ? (
                        <div>
                          <dt className="text-xs font-medium text-slate-500">Cc</dt>
                          <dd className="mt-0.5 break-all text-slate-800">{String(detail.ccEmails)}</dd>
                        </div>
                      ) : null}
                      {detail.bccEmails ? (
                        <div>
                          <dt className="text-xs font-medium text-slate-500">Bcc</dt>
                          <dd className="mt-0.5 break-all text-slate-800">{String(detail.bccEmails)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Message</h3>
                    <div className="mt-3 max-h-[min(50vh,420px)] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 p-4">
                      {String(detail.emailBody || '').includes('<') ? (
                        <div
                          className="prose prose-sm max-w-none text-slate-800 prose-a:text-[#0d9488]"
                          dangerouslySetInnerHTML={{ __html: String(detail.emailBody) }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
                          {String(detail.emailBody || '—')}
                        </pre>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
