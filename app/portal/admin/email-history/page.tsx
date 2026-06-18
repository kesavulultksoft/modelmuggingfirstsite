'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchAdminEmailHistory,
  fetchAdminEmailHistoryDetail,
  fetchMe,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import PortalEmailHistoryView from '@/components/portal/PortalEmailHistoryView'

export default function AdminEmailHistoryPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/email-history')
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

  if (!me) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <PortalEmailHistoryView
      title="Email history"
      subtitle="Audit log of outbound email — legacy history plus portal sends (to, from, subject, type, sent by, status)."
      emptyHint="Emails sent from the admin email center, course roster tools, and legacy imports appear here."
      searchPlaceholder="Search subject, recipient, sender, type, or status…"
      showSenderColumn
      fourthStatLabel="Class roster"
      onLoad={fetchAdminEmailHistory}
      onLoadDetail={fetchAdminEmailHistoryDetail}
    />
  )
}
