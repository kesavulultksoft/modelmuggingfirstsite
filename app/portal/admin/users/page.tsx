'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAdminUsers, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type UserRow = Record<string, unknown>

/** Filter tab id — matches API displayRole where applicable */
const ROLE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All users' },
  { id: 'STUDENT', label: 'Student' },
  { id: 'PARENT', label: 'Parent' },
  { id: 'APPLICANT', label: 'Applicant (onboarding)' },
  { id: 'INSTRUCTOR', label: 'Instructor (active)' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'SUPERADMIN', label: 'Superadmin' },
  { id: 'BGAGENT', label: 'BG agent' },
  { id: 'EQUIPSPECIALIST', label: 'Equipment specialist' },
]

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function roleOf(row: UserRow): string {
  return str(row.role).toUpperCase()
}

/** Admin list API: displayRole separates instructor applicants from active instructors */
function displayRoleOf(row: UserRow): string {
  const d = str(row.displayRole).toUpperCase()
  if (d) return d
  return roleOf(row)
}

function matchesRoleFilter(row: UserRow, tab: string): boolean {
  if (tab === 'all') return true
  const t = tab.toUpperCase()
  if (t === 'APPLICANT') return displayRoleOf(row) === 'APPLICANT'
  if (t === 'INSTRUCTOR') return displayRoleOf(row) === 'INSTRUCTOR'
  return displayRoleOf(row) === t
}

function RolePill({ row }: { row: UserRow }) {
  const d = displayRoleOf(row)
  const stored = roleOf(row)
  const isApplicant = d === 'APPLICANT'
  const isInstructor = d === 'INSTRUCTOR'
  const cls = isApplicant
    ? 'bg-amber-100 text-amber-950'
    : isInstructor
      ? 'bg-[#00d4aa]/20 text-[#0f766e]'
      : 'bg-slate-100 text-slate-800'
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{d || '—'}</span>
      {isApplicant && stored === 'INSTRUCTOR' ? (
        <span className="text-[10px] text-slate-500">Portal account: instructor path until CRM conversion</span>
      ) : null}
    </div>
  )
}

function VerifiedBadge({ row }: { row: UserRow }) {
  if (roleOf(row) !== 'INSTRUCTOR') return <span className="text-xs text-slate-400">—</span>
  const ev = row.emailVerified
  if (ev == null) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">Legacy</span>
    )
  }
  if (Boolean(ev)) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Verified</span>
    )
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Pending</span>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<UserRow[]>([])
  const [roleTab, setRoleTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/users')
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
    setErr('')
    let cancelled = false
    fetchAdminUsers()
      .then((d) => {
        if (!cancelled) setRows(legacyAsObjectArray(d))
      })
      .catch((e) => {
        if (!cancelled) {
          setRows([])
          setErr(String((e as Error).message || e))
        }
      })
    return () => {
      cancelled = true
    }
  }, [me])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (!matchesRoleFilter(r, roleTab)) return false
      if (!q) return true
      return JSON.stringify(r).toLowerCase().includes(q)
    })
  }, [rows, roleTab, search])

  useEffect(() => {
    // Reset to first page when changing filters/search.
    setPage(1)
  }, [roleTab, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const selectedLabel = ROLE_FILTERS.find((t) => t.id === roleTab)?.label ?? 'All users'

  /** Org-wide counts from the loaded user list (not narrowed by search/table filter). */
  const roleStats = useMemo(() => {
    let students = 0
    let instructors = 0
    let applicants = 0
    let bgAgents = 0
    for (const r of rows) {
      const d = displayRoleOf(r)
      if (d === 'STUDENT') students += 1
      else if (d === 'INSTRUCTOR') instructors += 1
      else if (d === 'APPLICANT') applicants += 1
      else if (d === 'BGAGENT') bgAgents += 1
    }
    return { students, instructors, applicants, bgAgents }
  }, [rows])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Portal users"
        subtitle={
          <>
            JWT accounts in <code className="rounded bg-slate-100 px-1 text-xs">mm_users</code>.{' '}
            <strong>Applicant</strong> means instructor-path signups still in CRM onboarding; they become{' '}
            <strong>Instructor</strong> only after conversion in the applicant pipeline. Stored portal{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">role</code> may still be INSTRUCTOR until then.
          </>
        }
        subtitleFullWidth
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role overview</p>
            <p className="text-sm text-slate-600">
              Counts use CRM-backed <span className="font-medium">display role</span> (same idea as active instructor
              checks elsewhere in the portal).
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selectedLabel}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Students</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{roleStats.students}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Instructor (active)</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{roleStats.instructors}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Applicant (onboarding)</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{roleStats.applicants}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">BG agent</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{roleStats.bgAgents}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="Search name, email, display role, user type, phone, id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={roleTab}
            onChange={(e) => setRoleTab(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {ROLE_FILTERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{pageRows.length}</span> of {filteredRows.length} matched
          users (page {safePage} of {totalPages}).
        </p>
      </section>

      {err ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Display role</th>
              <th className="p-3">User type</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Instructor verify</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u, i) => {
              const id = str(u.id) || str((u as { _id?: unknown })._id)
              const phone = str(u.phone)
              const phoneDisp = phone ? formatUsPhoneDisplay(phone) || phone : '—'
              const created = u.createdAt != null ? str(u.createdAt) : '—'
              const createdFmt =
                created !== '—' && !Number.isNaN(Date.parse(created))
                  ? new Date(created).toLocaleString('en-US')
                  : created
              return (
                <tr key={id || `row-${i}`} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="p-3 font-medium text-slate-900">{str(u.email) || '—'}</td>
                  <td className="p-3 text-slate-700">
                    {str(u.firstName)} {str(u.lastName)}
                  </td>
                  <td className="p-3">
                    <RolePill row={u} />
                  </td>
                  <td className="p-3 text-slate-600">{str(u.userType) || '—'}</td>
                  <td className="p-3 text-slate-600">{phoneDisp}</td>
                  <td className="p-3">
                    <VerifiedBadge row={u} />
                  </td>
                  <td className="p-3 text-xs text-slate-500">{createdFmt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredRows.length > 0 && !err ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
              <p className="text-base font-semibold text-slate-800">No users for this view</p>
              <p className="mt-2 text-sm text-slate-600">Try another role filter or clear the search box.</p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
