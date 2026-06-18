'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchInstructorCrmView, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import PortalJsonTable from '@/components/portal/PortalJsonTable'

function applyCourseFilter(
  rows: Record<string, unknown>[],
  mode: 'completed' | 'cancelled' | 'upcoming' | 'none'
) {
  if (mode === 'none') return rows
  return rows.filter((r) => {
    const s = String(r.status || '').toLowerCase()
    if (mode === 'completed') return s.includes('complet') || s === 'past'
    if (mode === 'cancelled') return s.includes('cancel')
    if (mode === 'upcoming')
      return !s.includes('complet') && !s.includes('cancel') && !s.includes('past')
    return true
  })
}

/** CRM view keys → `/api/v1/instructor/crm/views/{view}` */
export default function InstructorLegacyView({
  title,
  subtitle,
  view,
  courseFilterMode = 'none',
  rowFilter = 'none',
  maxRows = 60,
}: {
  title: string
  subtitle?: string
  view: string
  courseFilterMode?: 'completed' | 'cancelled' | 'upcoming' | 'none'
  rowFilter?: 'none' | 'userId'
  maxRows?: number
}) {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor')
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

  useEffect(() => {
    if (!me) return
    setErr('')
    fetchInstructorCrmView(view)
      .then((d) => {
        let r = legacyAsObjectArray(d)
        if (view === 'trainer-assigned-courses') r = applyCourseFilter(r, courseFilterMode)
        if (rowFilter === 'userId') r = r.filter((x) => String(x.userId || '') === me.id)
        setRows(r)
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me, view, courseFilterMode, rowFilter])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader title={title} subtitle={subtitle ?? ''} />
      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
      <PortalJsonTable rows={rows} maxRows={maxRows} />
    </>
  )
}
