'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAdminCrmStudents, fetchAdminCrmSubscriptions, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function AdminSuperSearchPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [q, setQ] = useState('')
  const [students, setStudents] = useState<Record<string, unknown>[]>([])
  const [subs, setSubs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/super-search')
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

  useEffect(() => {
    if (!me) return
    setLoading(true)
    Promise.all([fetchAdminCrmStudents(), fetchAdminCrmSubscriptions()])
      .then(([s, sub]) => {
        setStudents(legacyAsObjectArray(s))
        setSubs(legacyAsObjectArray(sub))
      })
      .finally(() => setLoading(false))
  }, [me])

  const needle = q.trim().toLowerCase()
  const results = useMemo(() => {
    if (!needle) return { students: [] as typeof students, subs: [] as typeof subs }
    const match = (o: Record<string, unknown>) =>
      JSON.stringify(o).toLowerCase().includes(needle)
    return {
      students: students.filter(match).slice(0, 40),
      subs: subs.filter(match).slice(0, 40),
    }
  }, [needle, students, subs])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Super search"
        subtitle="Client search across students and subscriptions (CRM collections)."
      />
      <input
        type="search"
        placeholder="Search name, email, phone…"
        className="mb-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <p className="text-sm text-slate-500">Loading indexes…</p>}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-bold text-slate-900">Students ({results.students.length})</h2>
          <ul className="space-y-2 text-sm">
            {results.students.map((r, i) => (
              <li key={i} className="rounded-xl border border-slate-100 bg-white p-3">
                <span className="font-medium">
                  {String(r.firstName || '')} {String(r.lastName || '')}
                </span>
                <span className="text-slate-500"> · {String(r.email || '—')}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 font-bold text-slate-900">Subscriptions ({results.subs.length})</h2>
          <ul className="space-y-2 text-sm">
            {results.subs.map((r, i) => (
              <li key={i} className="rounded-xl border border-slate-100 bg-white p-3">
                <span className="font-medium">{String(r.email || '—')}</span>
                <span className="text-slate-500"> · {String(r.type || '')}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
