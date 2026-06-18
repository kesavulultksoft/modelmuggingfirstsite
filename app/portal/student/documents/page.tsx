'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  deleteStudentLiabilityDocument,
  downloadStudentLiabilityFile,
  fetchMe,
  fetchStudentLiabilityDocuments,
  getToken,
  type MeUser,
  uploadStudentLiabilityFile,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

function docRowId(r: Record<string, unknown>, fallback: number): string {
  const raw = r._id
  if (raw && typeof raw === 'object' && '$oid' in raw) {
    return String((raw as { $oid: string }).$oid)
  }
  return String(raw ?? fallback)
}

export default function StudentDocumentsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [docs, setDocs] = useState<Record<string, unknown>[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const d = await fetchStudentLiabilityDocuments()
    setDocs(legacyAsObjectArray(d))
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/documents')
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

  useEffect(() => {
    if (!me) return
    reload().catch(() => setDocs([]))
  }, [me, reload])

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadErr(null)
    setUploading(true)
    try {
      await uploadStudentLiabilityFile(file)
      await reload()
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onDownload(id: string) {
    setUploadErr(null)
    try {
      await downloadStudentLiabilityFile(id)
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Download failed')
    }
  }

  async function onDelete(id: string) {
    setUploadErr(null)
    const res = await deleteStudentLiabilityDocument(id)
    if (res.ok) await reload()
    else setUploadErr('Could not delete document')
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Forms & pre-class prep"
        subtitle="Aligned with legacy pre-class instructions, liability/health — complete any forms your instructor assigns."
      />
      <div className="prose prose-sm mb-8 max-w-none text-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Arrive rested; wear comfortable clothes you can move in.</li>
          <li>Bring water and any paperwork your course email requested.</li>
          <li>
            Questions? Use{' '}
            <Link href="/portal/student/inbox" className="text-[#0d9488] hover:underline">
              Inbox
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-[#0d9488] hover:underline">
              contact
            </Link>
            .
          </li>
        </ul>
      </div>
      <h2 className="mb-3 font-bold text-slate-900">Document library</h2>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-800">Upload a file</p>
        <p className="mb-3 text-xs text-slate-500">PDF or images, up to 10MB. Stored securely with your account.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0d9488] bg-teal-50 px-4 py-2 text-sm font-semibold text-[#0f766e] hover:bg-teal-100">
          <input type="file" className="hidden" disabled={uploading} onChange={onPickFile} />
          {uploading ? 'Uploading…' : 'Choose file'}
        </label>
        {uploadErr && <p className="mt-2 text-sm text-red-600">{uploadErr}</p>}
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">No liability/health documents yet. Upload a file above or add an entry on Liability &amp; health.</p>
      ) : (
        <ul className="space-y-2">
          {docs.slice(0, 40).map((d, i) => {
            const id = docRowId(d, i)
            const name = String(d.documentName || d.fileName || d.name || 'Document')
            const hasFile = Boolean(d.hasAttachment)
            return (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="text-slate-800">{name}</span>
                <span className="flex flex-wrap gap-2">
                  {hasFile && (
                    <button
                      type="button"
                      onClick={() => onDownload(id)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
