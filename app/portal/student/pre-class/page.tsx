'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function StudentPreClassPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/pre-class')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
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
        title="Pre-class instructions"
        subtitle="Prepare for class — legacy pre-class-instructions."
      />
      <div className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p>
          Complete your{' '}
          <Link href="/portal/student/documents" className="font-semibold text-[#0d9488] hover:underline">
            forms & prep documents
          </Link>{' '}
          before attending. Arrive on time with comfortable clothing and any items your instructor listed in
          course communications.
        </p>
        <p className="mt-4">
          <Link href="/portal/student/courses" className="font-semibold text-[#0d9488] hover:underline">
            My classes
          </Link>
        </p>
      </div>
    </>
  )
}
