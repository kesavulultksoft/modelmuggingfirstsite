'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchAdminCrmOperations, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import PortalJsonTable from '@/components/portal/PortalJsonTable'

type Tab = 'locations' | 'donations'

const DATASET: Record<Tab, 'locations' | 'donations'> = {
  locations: 'locations',
  donations: 'donations',
}

const TAB_HELP: Record<Tab, string> = {
  locations:
    'Legacy market regions from mm_locations (e.g. states and metro areas). Used for subscriber geography and public class browsing—not the venue address on a course. Course “City webpage” values are set under Course management.',
  donations:
    'Card donations submitted on the public website (mm_donations). For donor mailing-list contacts, use Subscribers → Donation—the legacy donation-subscriber screen.',
}

export default function AdminOperationsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<Tab>('donations')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/operations')
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
    fetchAdminCrmOperations(DATASET[tab])
      .then((d) => setRows(legacyAsObjectArray(d)))
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me, tab])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const tabs: { id: Tab; label: string }[] = [
    { id: 'donations', label: 'Website donations' },
    { id: 'locations', label: 'Market regions' },
  ]

  return (
    <>
      <PortalPageHeader
        title="Regions & donations"
        subtitle="Read-only views of legacy Mongo data. This is not course scheduling or equipment."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
              tab === t.id
                ? 'bg-[#0f172a] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-[#00d4aa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-600">{TAB_HELP[tab]}</p>
      {tab === 'donations' ? (
        <p className="mb-4 text-sm text-slate-600">
          Donor contacts:{' '}
          <Link href="/portal/admin/subscribers" className="font-semibold text-[#0d9488] underline">
            Subscribers
          </Link>{' '}
          → Donation tab (legacy donation-subscriber).
        </p>
      ) : null}
      {err && <p className="mb-4 text-sm text-red-700">{err}</p>}
      <PortalJsonTable rows={rows} maxRows={80} />
    </>
  )
}
