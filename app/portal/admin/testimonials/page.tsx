'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminLegacyTabs, { type LegacyTabSpec } from '@/components/portal/AdminLegacyTabs'

const TABS: LegacyTabSpec[] = [
  {
    id: 'student',
    label: 'Student',
    endpoint: '/api/v1/admin/crm/operations/testimonials?type=Student',
  },
  {
    id: 'instructor',
    label: 'Instructor',
    endpoint: '/api/v1/admin/crm/operations/testimonials?type=Instructor',
  },
  {
    id: 'graduate',
    label: 'Graduate',
    endpoint: '/api/v1/admin/crm/operations/testimonials?type=Graduate',
  },
]

export default function AdminTestimonialsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/testimonials')
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
        title="Testimonials"
        subtitle="mm_testimonials filtered by type (legacy testimonial admin)."
      />
      <AdminLegacyTabs tabs={TABS} meReady maxRows={80} />
    </>
  )
}
