'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminInstructorsRoster from '@/components/portal/AdminInstructorsRoster'

export default function AdminInstructorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [me, setMe] = useState<MeUser | null>(null)
  const tabParam = searchParams.get('tab')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/instructors')
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
        title="Instructors"
        subtitle={
          <>
            Converted instructors only (legacy Instructor Management —{' '}
            <code className="text-xs">status</code> Completed). After convert, applicants leave the
            active pipeline and appear here. For applicants still onboarding, use{' '}
            <Link href="/portal/admin/trainer-pipeline" className="font-semibold text-[#0d9488] underline">
              Applicant pipeline
            </Link>
            ; manual archive there is for incomplete applications only.
          </>
        }
      />
      <AdminInstructorsRoster meReady defaultTab={tabParam === 'payments' ? 'payments' : undefined} />
    </>
  )
}
