'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  fetchInstructorDocumentLists,
  fetchInstructorPortalDocuments,
  fetchMe,
  getToken,
  type MeUser,
  type PortalDocumentRow,
  type PortalDocumentSection,
} from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import PortalDocumentsTable from '@/components/portal/PortalDocumentsTable'
import InstructorLiabilityHealthPanel from '@/components/portal/InstructorLiabilityHealthPanel'

const TABS: { id: string; label: string; section?: PortalDocumentSection }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training', section: 'training' },
  { id: 'general', label: 'General', section: 'general' },
  { id: 'application', label: 'Application', section: 'application' },
  { id: 'library', label: 'Library', section: 'library' },
  { id: 'presentation', label: 'Presentations', section: 'presentation' },
  { id: 'marketing', label: 'Marketing', section: 'marketing' },
  { id: 'liability', label: 'Liability & health', section: 'health' },
]

export default function InstructorDocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'
  const safeTab = TABS.some((t) => t.id === tab) ? tab : 'overview'
  const tabMeta = TABS.find((t) => t.id === safeTab) ?? TABS[0]

  const [me, setMe] = useState<MeUser | null>(null)
  const instructorName =
    me != null ? `${me.firstName || ''} ${me.lastName || ''}`.trim() || me.email || '' : ''
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<PortalDocumentRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/documents')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchInstructorDocumentLists()
      .then((bundle) => {
        setCounts({
          training: bundle.training?.length ?? 0,
          general: bundle.general?.length ?? 0,
          application: bundle.application?.length ?? 0,
          library: bundle.library?.length ?? 0,
          presentation: bundle.presentations?.length ?? 0,
          marketing: bundle.marketing?.length ?? 0,
          liability: bundle.liability?.length ?? 0,
        })
      })
      .catch(() => setCounts({}))
  }, [me])

  const loadSection = useCallback(async (section: PortalDocumentSection) => {
    setLoading(true)
    try {
      const data = await fetchInstructorPortalDocuments(section)
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!me || !tabMeta.section) {
      setRows([])
      return
    }
    void loadSection(tabMeta.section)
  }, [me, tabMeta.section, loadSection])

  const linked = useMemo(
    () =>
      rows.filter((r) =>
        Boolean(r.hasAttachment || r.downloadUrl || r.link || r.videoName)
      ).length,
    [rows]
  )

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Documents & library"
        subtitle="Training, library, presentations, and other materials shared with you or uploaded by admin."
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Document workspace</p>
            <p className="text-sm text-slate-600">Choose a section to view and download materials.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {tabMeta.label}
          </div>
        </div>
        {tabMeta.section ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Documents</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Downloadable</p>
              <p className="mt-1 text-2xl font-bold text-teal-900">{linked}</p>
              {loading ? <p className="text-xs text-teal-700">Loading…</p> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">Collection</label>
        <select
          value={safeTab}
          onChange={(e) => router.replace(`/portal/instructor/documents?tab=${e.target.value}`)}
          className="mt-1 block w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </section>

      {safeTab === 'overview' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {TABS.filter((x) => x.id !== 'overview').map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => router.replace(`/portal/instructor/documents?tab=${t.id}`)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#00d4aa]/50"
            >
              <p className="font-bold text-slate-900">{t.label}</p>
              <p className="mt-1 text-sm text-slate-500">
                {counts[t.id] ?? 0} record{counts[t.id] === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>
      ) : safeTab === 'liability' ? (
        <InstructorLiabilityHealthPanel
          meReady={Boolean(me)}
          me={me}
          instructorName={instructorName}
        />
      ) : tabMeta.section ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PortalDocumentsTable rows={rows} scope="instructor" section={tabMeta.section} />
        </div>
      ) : null}
    </>
  )
}
