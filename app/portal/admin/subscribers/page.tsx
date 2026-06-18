'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  authFetchJson,
  fetchAdminCompletedInstructors,
  fetchAdminCrmOperations,
  fetchAdminCrmStudents,
  fetchAdminTrainerApplicants,
  fetchMe,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import {
  buildGeoLabelLookup,
  buildProfileGeoByEmail,
  enrichSubscriberRowsWithProfileGeo,
  pickAddressRaw,
} from '@/lib/subscriberGeo'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminSubscribersTable from '@/components/portal/AdminSubscribersTable'
import { type LegacyTabSpec } from '@/components/portal/AdminLegacyTabs'

const TABS: LegacyTabSpec[] = [
  { id: 'all', label: 'All subscriptions', endpoint: '/api/v1/admin/crm/subscriptions' },
  {
    id: 'subscriber',
    label: 'Subscriber',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Subscriber',
  },
  {
    id: 'graduate',
    label: 'Graduate',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Graduate',
  },
  {
    id: 'instructor',
    label: 'Instructor',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Instructor',
  },
  {
    id: 'groupleader',
    label: 'Group leader',
    endpoint: '/api/v1/admin/crm/subscriptions?type=GroupLeader',
  },
  {
    id: 'groupmember',
    label: 'Group member',
    endpoint: '/api/v1/admin/crm/subscriptions?type=GroupMember',
  },
  {
    id: 'applicant',
    label: 'Applicant',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Applicant',
  },
  {
    id: 'inquiry',
    label: 'Applicant inquiry',
    endpoint: '/api/v1/admin/crm/subscriptions?type=ApplicantInquiry',
  },
  {
    id: 'donation',
    label: 'Donation',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Donation',
  },
  {
    id: 'unsub',
    label: 'Unsubscribed',
    endpoint: '/api/v1/admin/crm/subscriptions?type=Unsubscribe',
  },
  { id: 'parents', label: 'Parents', endpoint: '/api/v1/admin/crm/tables/parents' },
]

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function rowSearchText(row: Record<string, unknown>): string {
  const parts = [
    pickString(row, ['firstName', 'lastName', 'parentFirstName', 'parentlastName', 'parentLastName']),
    pickString(row, ['email', 'emailId', 'parentEmailAddress']),
    pickString(row, ['type', 'city', 'parentCity', 'state', 'parentState', 'locationName', 'stateName']),
    pickString(row, ['country', 'countryName', 'parentCountry']),
    pickString(row, ['phoneNumber', 'parentPhoneNumber', 'studentName']),
    pickAddressRaw(row),
  ]
  return parts.join(' ').toLowerCase()
}

export default function AdminSubscribersPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<string>(TABS[0]?.id ?? 'all')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [rowFilter, setRowFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [geoLabelsById, setGeoLabelsById] = useState<Record<string, string>>({})
  const [studentProfiles, setStudentProfiles] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/subscribers')
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
    fetchAdminCrmOperations('locations')
      .then((d) => setGeoLabelsById(buildGeoLabelLookup(legacyAsObjectArray(d))))
      .catch(() => setGeoLabelsById({}))
    fetchAdminCrmStudents()
      .then((d) => setStudentProfiles(legacyAsObjectArray(d)))
      .catch(() => setStudentProfiles([]))
  }, [me])

  useEffect(() => {
    if (!me) return
    const selected = TABS.find((t) => t.id === tab) ?? TABS[0]
    if (!selected) return
    setErr('')
    setLoading(true)
    let cancelled = false
    Promise.all([
      authFetchJson<unknown>(selected.endpoint),
      fetchAdminCompletedInstructors(false).catch(() => []),
      fetchAdminCompletedInstructors(true).catch(() => []),
      fetchAdminTrainerApplicants(false).catch(() => []),
      fetchAdminTrainerApplicants(true).catch(() => []),
    ])
      .then(([subs, instructorsActive, instructorsArchived, applicantsActive, applicantsArchived]) => {
        if (cancelled) return
        const profileByEmail = buildProfileGeoByEmail([
          ...studentProfiles,
          ...legacyAsObjectArray(instructorsActive),
          ...legacyAsObjectArray(instructorsArchived),
          ...legacyAsObjectArray(applicantsActive),
          ...legacyAsObjectArray(applicantsArchived),
        ])
        const enriched = enrichSubscriberRowsWithProfileGeo(legacyAsObjectArray(subs), profileByEmail)
        setRows(enriched)
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
  }, [me, tab, studentProfiles])

  const q = rowFilter.trim().toLowerCase()
  const filteredRows = useMemo(
    () => (q ? rows.filter((r) => rowSearchText(r).includes(q)) : rows),
    [rows, q],
  )

  const selectedTab = TABS.find((t) => t.id === tab) ?? TABS[0]
  const isParents = tab === 'parents'

  const reachableContacts = filteredRows.filter((r) => {
    const email = pickString(r, ['email', 'emailId', 'emailAddress', 'parentEmailAddress'])
    const phone = pickString(r, ['phone', 'phoneNumber', 'parentPhoneNumber', 'mobile', 'mobileNo'])
    return Boolean(email || phone)
  }).length

  const uniqueEmails = new Set(
    filteredRows
      .map((r) => pickString(r, ['email', 'emailId', 'emailAddress', 'parentEmailAddress']).toLowerCase())
      .filter(Boolean),
  ).size

  const unsubscribedFlags = filteredRows.filter((r) =>
    /unsubscribe|unsubscribed|opt.?out|do.?not.?contact|isUnSubscribe/i.test(JSON.stringify(r)),
  ).length

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Subscribers & parents"
        subtitle="Mailing-list contacts by type—same columns and order as legacy subscription management. Click a column header to sort."
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Subscription workspace</p>
            <p className="text-sm text-slate-600">Filter by list type, then search or sort in the table below.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {selectedTab?.label ?? 'All subscriptions'}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rows in view</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{filteredRows.length}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Reachable contacts</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{reachableContacts}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Unique emails</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{uniqueEmails}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Unsubscribed flags</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{unsubscribedFlags}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[240px] flex-1">
            <span className="sr-only">Search</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm"
              placeholder="Search name, email, city, type…"
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
            />
          </label>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {err && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</p>}

      <AdminSubscribersTable
        rows={filteredRows}
        variant={isParents ? 'parents' : 'subscription'}
        showTypeColumn={tab === 'all'}
        loading={loading}
        geoLabelsById={geoLabelsById}
        emptyMessage={
          loading ? 'Loading…' : q ? 'No contacts match your search.' : 'No contacts in this list.'
        }
      />
    </>
  )
}
