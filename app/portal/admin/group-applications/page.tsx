'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import {
  adminDeletePreGroup,
  adminMarkPreGroupNotQualified,
  adminMarkPreGroupQualified,
  adminResendGroupApplicationLink,
  fetchAdminFullGroupApplicationDetail,
  fetchAdminFullGroupApplications,
  fetchAdminPreGroupApplications,
  type GroupAppRow,
} from '@/lib/portalGroupApplicationsApi'
import { fetchMe, getToken } from '@/lib/portalApi'
import { buildGroupCourseGeoLabelMap } from '@/lib/groupCourseGeoDisplay'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import {
  FullGroupApplicationDetailDialog,
  PreGroupApplicationDetailDialog,
} from '@/components/portal/GroupApplicationDetailDialogs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type Tab = 'pre' | 'full'

type ConfirmDialogConfig = {
  title: string
  description: string
  confirmLabel: string
  variant?: 'destructive'
  action: () => Promise<void>
}

function rowId(row: GroupAppRow): string {
  const raw = row.dumId ?? row.id ?? row._id
  if (typeof raw === 'string') return raw.trim()
  if (raw && typeof raw === 'object' && raw !== null) {
    if ('$oid' in raw) return String((raw as { $oid: string }).$oid).trim()
    if ('oid' in raw) return String((raw as { oid: string }).oid).trim()
    if ('hexString' in raw) return String((raw as { hexString: string }).hexString).trim()
  }
  return String(raw ?? '').trim()
}

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-US')
}

function preGroupDisplayName(row: GroupAppRow): string {
  return String(row.organizationName || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'this request')
}

export default function AdminGroupApplicationsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pre')
  const [preRows, setPreRows] = useState<GroupAppRow[]>([])
  const [fullRows, setFullRows] = useState<GroupAppRow[]>([])
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [detailPre, setDetailPre] = useState<GroupAppRow | null>(null)
  const [detailFull, setDetailFull] = useState<{ application: GroupAppRow; students: GroupAppRow[] } | null>(null)
  const [geoLabels, setGeoLabels] = useState<Record<string, string>>({})
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const load = useCallback(async () => {
    const [pre, full] = await Promise.all([fetchAdminPreGroupApplications(), fetchAdminFullGroupApplications()])
    setPreRows(pre)
    setFullRows(full)
  }, [])

  useEffect(() => {
    void buildGroupCourseGeoLabelMap().then(setGeoLabels)
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/group-applications')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      void load()
    })
  }, [router, load])

  const filteredPre = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return preRows
    return preRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [preRows, search])

  const filteredFull = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return fullRows
    return fullRows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [fullRows, search])

  async function runConfirmDialogAction() {
    if (!confirmDialog) return
    setConfirmBusy(true)
    try {
      await confirmDialog.action()
    } finally {
      setConfirmBusy(false)
      setConfirmDialog(null)
    }
  }

  function confirmDeletePreGroup(id: string, name: string) {
    setConfirmDialog({
      title: 'Delete pre-group request?',
      description: `Remove "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
      action: async () => {
        await act(id, 'delete')
      },
    })
  }

  async function act(id: string, type: 'qualified' | 'not-qualified' | 'delete' | 'resend') {
    setBusy(`${id}-${type}`)
    setMsg('')
    let res: Response
    if (type === 'qualified') res = await adminMarkPreGroupQualified(id)
    else if (type === 'not-qualified') res = await adminMarkPreGroupNotQualified(id)
    else if (type === 'delete') res = await adminDeletePreGroup(id)
    else res = await adminResendGroupApplicationLink(id)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Action failed')
      return
    }
    const payload = (await res.json().catch(() => ({}))) as {
      emailSent?: boolean
      emailError?: string
    }
    if (type === 'qualified') {
      if (payload.emailSent === false) {
        setMsg(
          payload.emailError?.trim() ||
            'Marked qualified, but the application link email was not sent. Check SMTP settings or use Resend link.',
        )
      } else {
        setMsg('Marked qualified and application link sent.')
      }
    } else if (type === 'resend') {
      if (payload.emailSent === false) {
        setMsg(payload.emailError?.trim() || 'Could not send link email. Check SMTP settings.')
      } else {
        setMsg('Link email sent.')
      }
    } else if (type === 'not-qualified') {
      setMsg('Marked not qualified.')
    } else {
      setMsg('Deleted.')
    }
    setDetailPre(null)
    await load()
  }

  function openPreDetail(row: GroupAppRow) {
    setDetailPre(row)
    setDetailFull(null)
  }

  async function openFullDetail(id: string, fallbackRow: GroupAppRow) {
    if (!id) {
      setDetailFull({ application: fallbackRow, students: [] })
      setDetailPre(null)
      return
    }
    const row = await fetchAdminFullGroupApplicationDetail(id)
    if (!row) {
      setMsg('Could not load full application details from server. Showing available row data.')
      setDetailFull({ application: fallbackRow, students: [] })
      setDetailPre(null)
      return
    }
    setDetailFull(row)
    setDetailPre(null)
  }

  return (
    <>
      <PortalPageHeader
        title="Group applications"
        subtitle="Pre-group screening requests and submitted full group course applications (legacy PreGroupCourseApplication / GroupCourse collections)."
      />

      {msg ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'pre' as const, label: `Pre-group requests (${preRows.length})` },
            { id: 'full' as const, label: `Full applications (${fullRows.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === t.id ? 'bg-[#0f172a] text-white' : 'border border-slate-200 bg-white text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          className="ml-auto min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tab === 'pre' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Organization</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied</th>
                <th className="p-3">Head count</th>
                <th className="p-3">City</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPre.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-slate-500">
                    No pre-group requests found.
                  </td>
                </tr>
              ) : (
                filteredPre.map((r, i) => {
                  const id = rowId(r)
                  const rawStatus = String(r.requestStatus || '').trim()
                  const st = rawStatus || 'Pending'
                  const isPending = !rawStatus || rawStatus.toLowerCase() === 'pending'
                  return (
                    <tr key={id || i} className="border-t border-slate-100">
                      <td className="p-3">
                        <button
                          type="button"
                          className="font-semibold text-[#0d9488] hover:underline"
                          onClick={() => openPreDetail(r)}
                        >
                          {String(r.organizationName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—')}
                        </button>
                      </td>
                      <td className="p-3 text-slate-700">{String(r.orgEmail || '—')}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            st === 'Qualified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st === 'NotQualified'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {st || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{formatDate(r.createdDate)}</td>
                      <td className="p-3 text-slate-600">{String(r.headCount ?? '—')}</td>
                      <td className="p-3 text-slate-600">{String(r.city || '—')}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                disabled={busy !== null}
                                className="rounded bg-emerald-700 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                                onClick={() => void act(id, 'qualified')}
                              >
                                Approve (Qualified)
                              </button>
                              <button
                                type="button"
                                disabled={busy !== null}
                                className="rounded border border-red-300 px-2 py-1 text-xs font-bold text-red-700 disabled:opacity-50"
                                onClick={() => void act(id, 'not-qualified')}
                              >
                                Reject (Not qualified)
                              </button>
                            </>
                          ) : st === 'Qualified' ? (
                            <button
                              type="button"
                              disabled={busy !== null}
                              className="rounded border border-indigo-300 px-2 py-1 text-xs font-bold text-indigo-700 disabled:opacity-50"
                              onClick={() => void act(id, 'resend')}
                            >
                              Resend link
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy !== null}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-50"
                            onClick={() => confirmDeletePreGroup(id, preGroupDisplayName(r))}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Organizer</th>
                <th className="p-3">Email</th>
                <th className="p-3">Group</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFull.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-slate-500">
                    No full applications found.
                  </td>
                </tr>
              ) : (
                filteredFull.map((r, i) => {
                  const id = rowId(r)
                  return (
                    <tr key={id || i} className="border-t border-slate-100">
                      <td className="p-3">
                        <button
                          type="button"
                          className="font-semibold text-[#0d9488] hover:underline"
                          onClick={() => void openFullDetail(id, r)}
                        >
                          {String(r.name || '—')}
                        </button>
                      </td>
                      <td className="p-3 text-slate-700">{String(r.email || '—')}</td>
                      <td className="p-3 text-slate-700">{String(r.groupOrAffiliation || '—')}</td>
                      <td className="p-3 text-slate-600">{formatDate(r.createdDate)}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700"
                          onClick={() => void openFullDetail(id, r)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {detailPre ? (
        <PreGroupApplicationDetailDialog
          row={detailPre}
          rowId={rowId(detailPre)}
          busy={busy}
          geoLabels={geoLabels}
          onClose={() => setDetailPre(null)}
          onAct={(id, type) => void act(id, type)}
          onDelete={() => confirmDeletePreGroup(rowId(detailPre), preGroupDisplayName(detailPre))}
        />
      ) : null}

      {detailFull ? (
        <FullGroupApplicationDetailDialog
          application={detailFull.application}
          students={detailFull.students}
          geoLabels={geoLabels}
          onClose={() => setDetailFull(null)}
        />
      ) : null}

      <AlertDialog
        open={confirmDialog != null}
        onOpenChange={(open) => {
          if (!open && !confirmBusy) setConfirmDialog(null)
        }}
      >
        <AlertDialogContent className="relative border border-slate-200 bg-white p-6 pt-7 shadow-lg sm:max-w-md">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:pointer-events-none disabled:opacity-40"
            onClick={() => !confirmBusy && setConfirmDialog(null)}
            aria-label="Close dialog"
            disabled={confirmBusy}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <AlertDialogHeader className="pr-8 text-left">
            <AlertDialogTitle className="text-slate-900">{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel disabled={confirmBusy} className="mt-0 border-slate-300 sm:min-w-[6.5rem]">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={confirmBusy}
              className={cn(
                'min-w-[7.5rem] font-semibold shadow-sm sm:min-w-[8rem]',
                confirmDialog?.variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#0f172a] text-white hover:bg-[#0d9488]',
              )}
              onClick={() => void runConfirmDialogAction()}
            >
              {confirmBusy ? 'Working…' : (confirmDialog?.confirmLabel ?? 'Confirm')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
