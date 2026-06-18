'use client'

import { Download, ExternalLink, Trash2 } from 'lucide-react'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import { downloadPortalDocumentFile, type PortalDocumentRow } from '@/lib/portalApi'

function rowId(row: PortalDocumentRow): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function PortalDocumentsTable({
  rows,
  scope,
  section,
  onDelete,
  busyId,
}: {
  rows: PortalDocumentRow[]
  scope: 'admin' | 'instructor'
  section: string
  onDelete?: (id: string) => void
  busyId?: string | null
}) {
  if (!rows.length) {
    return (
      <p className="px-6 py-14 text-center text-sm text-slate-500">No documents in this section yet.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3.5">Title</th>
            <th className="px-4 py-3.5">Type</th>
            <th className="px-4 py-3.5">Added</th>
            <th className="px-4 py-3.5">Source</th>
            <th className="px-4 py-3.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const id = rowId(r)
            const title = String(r.displayTitle || r.applicationName || r.name || '—')
            const type = String(
              r.type || r.emailType || r.materialType || r.documentType || r.docType || '—'
            )
            const when = r.createdDate ?? r.updatedAt
            const byAdmin = String(r.byAdmin || '').toLowerCase() === 'yes'
            const hasFile = Boolean(r.hasAttachment)
            const extLink = String(r.downloadUrl || r.link || r.url || '').trim()
            const busy = busyId === id

            return (
              <tr key={id || title} className="hover:bg-slate-50/80">
                <td className="max-w-[240px] truncate px-4 py-3 font-medium text-slate-900" title={title}>
                  {title}
                </td>
                <td className="px-4 py-3 text-slate-600">{type}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatWhen(when)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {byAdmin ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Admin
                    </span>
                  ) : (
                    <span className="text-slate-500">Legacy / user</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {hasFile && id ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void downloadPortalDocumentFile(scope, section, id, title).catch(() => {})
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Download
                      </button>
                    ) : null}
                    {extLink && (extLink.startsWith('http') || extLink.includes('youtube')) ? (
                      <a
                        href={extLink.startsWith('http') ? extLink : `https://${extLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Open
                      </a>
                    ) : null}
                    {scope === 'admin' && onDelete && id ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDelete(id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
