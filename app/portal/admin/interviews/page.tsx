'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getToken } from '@/lib/portalApi'

export default function AdminInterviewsPage() {
  const router = useRouter()

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/interviews')
      return
    }
    router.replace('/portal/admin/trainer-pipeline?stage=interview')
  }, [router])

  return <div className="py-20 text-center text-slate-500">Redirecting to trainer pipeline…</div>
}
