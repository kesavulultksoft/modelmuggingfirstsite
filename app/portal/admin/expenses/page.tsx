'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Portal expense admin workflow lives on Class expenses (accounts). */
export default function AdminExpensesRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/portal/admin/accounts')
  }, [router])
  return <div className="py-20 text-center text-slate-500">Redirecting to class expenses…</div>
}
