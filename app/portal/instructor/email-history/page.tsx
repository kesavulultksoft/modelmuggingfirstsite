'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorEmailHistory,
  fetchInstructorEmailHistoryDetail,
  fetchMe,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import PortalEmailHistoryView from '@/components/portal/PortalEmailHistoryView'

export default function InstructorEmailHistoryPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/email-history')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
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
      subtitle="Outbound messages you sent from the instructor portal, including class roster and student communications."
      emptyHint="Messages you send from trainings or the email center will appear here."
      searchPlaceholder="Search subject, recipient, type, or status…"
      onLoad={fetchInstructorEmailHistory}
      onLoadDetail={fetchInstructorEmailHistoryDetail}
    />
  )
}
