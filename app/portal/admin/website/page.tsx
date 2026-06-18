'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminLegacyTabs, { type LegacyTabSpec } from '@/components/portal/AdminLegacyTabs'

const TABS: LegacyTabSpec[] = [
  { id: 'cms', label: 'CMS pages', endpoint: '/api/v1/admin/crm/tables/cms-pages' },
  { id: 'forms', label: 'Form templates', endpoint: '/api/v1/admin/crm/tables/form-templates' },
  { id: 'shipping', label: 'Shipping charges', endpoint: '/api/v1/admin/crm/tables/shipping-charges' },
  { id: 'links', label: 'Special links', endpoint: '/api/v1/admin/crm/tables/special-links' },
]

export default function AdminWebsitePage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/website')
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
        title="Website & forms"
        subtitle="CMS pages, form templates, shipping, special links — canonical mm_* collections."
      />
      <AdminLegacyTabs tabs={TABS} meReady maxRows={80} />
    </>
  )
}
