'use client'

import { formatUsPhoneDisplay } from '@/lib/phoneUs'

export type PortalUserRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function RolePill({ role }: { role: string }) {
  const r = role.toUpperCase()
  const cls =
    r === 'INSTRUCTOR'
      ? 'bg-teal-100 text-teal-800'
      : r === 'APPLICANT'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-slate-100 text-slate-800'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{role || '—'}</span>
  )
}

export default function AdminPortalUserDetailDrawer({
  user,
  loading,
  onClose,
}: {
  user: PortalUserRow | null
  loading?: boolean
  onClose: () => void
}) {
  if (!user && !loading) return null

  const title =
    `${str(user?.firstName)} ${str(user?.lastName)}`.trim() ||
    str(user?.portalUserDisplayName) ||
    str(user?.email) ||
    'Portal user'

  return (
    <div className="fixed inset-0 z-[230]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portal user</p>
            <h2 className="truncate text-lg font-bold text-slate-900">{title}</h2>
            <p className="truncate text-xs text-slate-500">{str(user?.email) || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="text-sm text-slate-600">Loading user…</p>
          ) : user ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <dl className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">Display role</dt>
                  <dd>
                    <RolePill role={str(user.displayRole) || str(user.role)} />
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">Stored role</dt>
                  <dd className="text-slate-900">{str(user.role) || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">User type</dt>
                  <dd className="text-slate-900">{str(user.userType) || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">Phone</dt>
                  <dd className="text-slate-900">
                    {formatUsPhoneDisplay(user.phone) || str(user.phone) || '—'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">Email verified</dt>
                  <dd className="text-slate-900">
                    {user.emailVerified == null
                      ? 'Legacy / unknown'
                      : Boolean(user.emailVerified)
                        ? 'Yes'
                        : 'No'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">Created</dt>
                  <dd className="text-slate-900">{formatWhen(user.createdAt)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-500">User ID</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{str(user.id) || '—'}</dd>
                </div>
                {str(user.primaryInstructorId) ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Instructor link</dt>
                    <dd className="break-all font-mono text-xs text-slate-700">{str(user.primaryInstructorId)}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : (
            <p className="text-sm text-slate-600">User not found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
