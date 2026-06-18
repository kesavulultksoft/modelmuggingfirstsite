'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InstructorProfilePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/portal/instructor/account-workspace')
  }, [router])

  return <div className="py-20 text-center text-slate-500">Redirecting to account workspace…</div>
}
