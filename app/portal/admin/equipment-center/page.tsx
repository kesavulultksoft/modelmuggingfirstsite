'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList } from 'lucide-react'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminLegacyTabs, { type LegacyTabSpec } from '@/components/portal/AdminLegacyTabs'
import AdminEquipmentCatalogPanel from '@/components/portal/AdminEquipmentCatalogPanel'

type View = 'catalog' | 'requests'

const REQUEST_TABS: LegacyTabSpec[] = [
  {
    id: 'pending',
    label: 'Approval requests',
    endpoint: '/api/v1/admin/crm/tables/equipment-pending',
  },
  {
    id: 'approved',
    label: 'Approved / issued',
    endpoint: '/api/v1/admin/crm/tables/equipment-approved',
  },
  {
    id: 'returned',
    label: 'Returned',
    endpoint: '/api/v1/admin/crm/tables/equipment-returned',
  },
]

export default function AdminEquipmentCenterPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [view, setView] = useState<View>('catalog')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/equipment-center')
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

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Equipment center"
        subtitle={
          <>
            Define the equipment catalog first (legacy <code className="text-xs">InventoryName</code>), then
            review instructor requests. Equip specialists can approve from{' '}
            <Link href="/portal/equip" className="font-semibold text-[#0d9488] underline">
              Equipment queue
            </Link>
            .
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'catalog' as const, label: 'Equipment catalog', icon: Package },
            { id: 'requests' as const, label: 'Approval requests', icon: ClipboardList },
          ] as const
        ).map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
                view === t.id
                  ? 'bg-[#0f172a] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#00d4aa]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
            </button>
          )
        })}
      </div>

      {view === 'catalog' ? (
        <AdminEquipmentCatalogPanel meReady={!!me} />
      ) : (
        <AdminLegacyTabs tabs={REQUEST_TABS} meReady maxRows={100} />
      )}
    </>
  )
}
