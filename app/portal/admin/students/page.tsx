'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, Mail, Search, User, Users } from 'lucide-react'
import { authFetchJson, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { ageFromDob } from '@/lib/ageFromDob'
import { crmDateFieldToUs } from '@/lib/usDate'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminStudentsTable from '@/components/portal/AdminStudentsTable'

type TabId = 'profiles' | 'registrations'

const TABS: { id: TabId; label: string; endpoint: string; description: string }[] = [
  {
    id: 'profiles',
    label: 'Student profiles',
    endpoint: '/api/v1/admin/crm/students',
    description: 'CRM student records from mm_students — contact info, DOB, and portal link.',
  },
  {
    id: 'registrations',
    label: 'Course registrations',
    endpoint: '/api/v1/admin/crm/student-registrations',
    description: 'Enrollment mirror in mm_student_course_registrations — who registered for which class.',
  },
]

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function rowSearchText(row: Record<string, unknown>, tab: TabId): string {
  const parts = [
    pickString(row, ['firstName', 'lastName', 'studentFirstName', 'studentLastName', 'studentName']),
    pickString(row, ['email', 'emailId', 'emailAddress', 'studentEmail']),
    pickString(row, ['contactNumber', 'phoneNumber', 'phone']),
    pickString(row, ['city', 'state', 'locationName', 'courseName']),
    pickString(row, ['courseId', 'userId', 'status', 'paymentStatus']),
    pickString(row, ['dob', 'dateOfBirth']),
  ]
  return parts.join(' ').toLowerCase()
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<TabId>('profiles')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/students')
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
    const selected = TABS.find((t) => t.id === tab) ?? TABS[0]
    setErr('')
    setLoading(true)
    let cancelled = false
    authFetchJson<unknown>(selected.endpoint)
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
  }, [me, tab])

  const q = search.trim().toLowerCase()
  const filteredRows = useMemo(
    () => (q ? rows.filter((r) => rowSearchText(r, tab).includes(q)) : rows),
    [rows, q, tab],
  )

  const stats = useMemo(() => {
    if (tab === 'profiles') {
      let withEmail = 0
      let portalLinked = 0
      let under18 = 0
      for (const r of filteredRows) {
        const email = pickString(r, ['emailAddress', 'email', 'emailId'])
        if (email) withEmail++
        if (pickString(r, ['userId', 'portalUserId'])) portalLinked++
        const dob = crmDateFieldToUs(r.dob ?? r.dateOfBirth)
        const age = dob ? ageFromDob(dob) : null
        if (age != null && age < 18) under18++
      }
      return {
        primary: filteredRows.length,
        secondary: withEmail,
        tertiary: portalLinked,
        quaternary: under18,
      }
    }
    let paid = 0
    const courseIds = new Set<string>()
    for (const r of filteredRows) {
      const st = pickString(r, ['status', 'paymentStatus']).toLowerCase()
      if (/paid|complete|successful/.test(st)) paid++
      const cid = pickString(r, ['courseId'])
      if (cid) courseIds.add(cid)
    }
    return {
      primary: filteredRows.length,
      secondary: paid,
      tertiary: courseIds.size,
      quaternary: filteredRows.length - paid,
    }
  }, [filteredRows, tab])

  const selectedTab = TABS.find((t) => t.id === tab) ?? TABS[0]

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const statCards =
    tab === 'profiles'
      ? [
          { label: 'Profiles in view', value: stats.primary, icon: Users, tone: 'slate' },
          { label: 'With email', value: stats.secondary, icon: Mail, tone: 'teal' },
          { label: 'Portal linked', value: stats.tertiary, icon: User, tone: 'indigo' },
          { label: 'Under 18', value: stats.quaternary, icon: GraduationCap, tone: 'violet' },
        ]
      : [
          { label: 'Registrations in view', value: stats.primary, icon: BookOpen, tone: 'slate' },
          { label: 'Paid / complete', value: stats.secondary, icon: GraduationCap, tone: 'teal' },
          { label: 'Unique courses', value: stats.tertiary, icon: Users, tone: 'indigo' },
          { label: 'Other status', value: stats.quaternary, icon: Mail, tone: 'amber' },
        ]

  const toneClasses: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    teal: 'border-teal-200 bg-teal-50 text-teal-900',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  }

  return (
    <>
      <PortalPageHeader
        title="Student management"
        subtitle="Browse student CRM profiles and course registrations with sortable columns, quick email, and detail views."
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Student workspace</p>
            <p className="text-sm text-slate-600">{selectedTab.description}</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {selectedTab.label}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`rounded-xl border p-3 ${toneClasses[card.tone]}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 opacity-70" aria-hidden />
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{card.value}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold sm:text-sm ${
                  tab === t.id
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#0d9488]/40 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Search</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm transition focus:border-[#0d9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20"
              placeholder={
                tab === 'profiles'
                  ? 'Search name, email, phone, city, user id…'
                  : 'Search student, email, course, status…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> of {rows.length}{' '}
          loaded records.
        </p>
      </section>

      {err ? (
        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>
      ) : null}

      <AdminStudentsTable
        rows={filteredRows}
        variant={tab}
        loading={loading}
        emptyMessage={
          loading
            ? 'Loading…'
            : q
              ? 'No students match your search.'
              : 'No records in this list yet.'
        }
      />
    </>
  )
}
