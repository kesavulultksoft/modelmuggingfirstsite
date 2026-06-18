'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminLiabilityDocsPanel from '@/components/portal/AdminLiabilityDocsPanel'

export default function AdminLiabilityDocsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/liability-docs')
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
        title="Liability & health documents"
        subtitle="Review instructor waiver submissions by course — same workflow as legacy admin Liability & Health."
      />
      <AdminLiabilityDocsPanel meReady={Boolean(me)} />
    </>
  )
}
