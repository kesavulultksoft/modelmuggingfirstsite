'use client'

import { useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken } from '@/lib/portalApi'

export default function PortalHubPage() {
  const router = useRouter()

  useLayoutEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal')
      return
    }
    fetchMe().then((me) => {
      if (!me) {
        router.replace('/login?next=/portal')
        return
      }
      const r = me.role
      if (r === 'SUPERADMIN' || r === 'ADMIN') router.replace('/portal/admin')
      else if (r === 'INSTRUCTOR') router.replace('/portal/instructor')
      else if (r === 'STUDENT' || r === 'PARENT') router.replace('/portal/student')
      else if (r === 'BGAGENT') router.replace('/portal/bgagent')
      else if (r === 'EQUIPSPECIALIST') router.replace('/portal/equip')
      else router.replace('/portal/home')
    })
  }, [router])

  return <div className="min-h-[40vh]" aria-hidden />
}
