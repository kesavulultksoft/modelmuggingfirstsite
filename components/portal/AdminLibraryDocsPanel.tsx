'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Upload, X } from 'lucide-react'
import {
  createAdminPortalDocument,
  deleteAdminPortalDocument,
  fetchAdminPortalDocuments,
  uploadAdminPortalDocument,
  type PortalDocumentRow,
  type PortalDocumentSection,
} from '@/lib/portalApi'
import PortalDocumentsTable from '@/components/portal/PortalDocumentsTable'

const SECTIONS: { id: PortalDocumentSection; label: string; hint: string }[] = [
  { id: 'library', label: 'Library', hint: 'Shared library documents and videos for all instructors.' },
  {
    id: 'training',
    label: 'Training documents',
    hint: 'Visible to instructors (admin uploads are marked for all).',
  },
  { id: 'general', label: 'General documents', hint: 'Course/general materials for instructors.' },
  { id: 'application', label: 'Application documents', hint: 'Onboarding application references.' },
  { id: 'health', label: 'Health / liability', hint: 'Admin liability templates (byAdmin).' },
  { id: 'marketing', label: 'Marketing materials', hint: 'Approved marketing assets.' },
  { id: 'presentation', label: 'Presentation downloads', hint: 'Presentation files or external links.' },
]

const fieldClass =
  'mt-1 box-border block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

export default function AdminLibraryDocsPanel({ meReady }: { meReady: boolean }) {
  const [section, setSection] = useState<PortalDocumentSection>('library')
  const [rows, setRows] = useState<PortalDocumentRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [libraryType, setLibraryType] = useState<'document' | 'video'>('document')
  const [videoUrl, setVideoUrl] = useState('')
  const [link, setLink] = useState('')
  const [subTitle, setSubTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setMsg('')
    try {
      const data = await fetchAdminPortalDocuments(section)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setMsg(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }, [section])

  useEffect(() => {
    if (!meReady) return
    void load()
  }, [meReady, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  }, [rows, search])

  const sectionMeta = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return
    setBusyId(id)
    setMsg('')
    const res = await deleteAdminPortalDocument(section, id)
    setBusyId(null)
    if (!res.ok) {
      setMsg('Could not delete — only portal-uploaded documents can be removed.')
      return
    }
    await load()
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (section === 'library' && libraryType === 'video') {
      if (!title.trim() || !videoUrl.trim()) {
        setMsg('Name and YouTube/video URL are required.')
        return
      }
      setUploading(true)
      const res = await createAdminPortalDocument(section, {
        name: title.trim(),
        type: 'video',
        videoName: videoUrl.trim(),
      })
      setUploading(false)
      if (!res.ok) {
        setMsg((await res.text()) || 'Upload failed.')
        return
      }
    } else if (section === 'presentation' && !file && link.trim()) {
      if (!title.trim()) {
        setMsg('Title is required.')
        return
      }
      setUploading(true)
      const res = await createAdminPortalDocument(section, {
        presentationName: title.trim(),
        presentationSubName: subTitle.trim() || undefined,
        link: link.trim(),
        approved: 'Yes',
      })
      setUploading(false)
      if (!res.ok) {
        setMsg((await res.text()) || 'Save failed.')
        return
      }
    } else {
      if (!file) {
        setMsg('Choose a file to upload.')
        return
      }
      if (!title.trim()) {
        setMsg('Title is required.')
        return
      }
      setUploading(true)
      const fields: Record<string, string> = { title: title.trim(), name: title.trim() }
      if (section === 'library') fields.type = 'document'
      if (section === 'presentation') {
        fields.presentationName = title.trim()
        if (subTitle.trim()) fields.presentationSubName = subTitle.trim()
        if (link.trim()) fields.link = link.trim()
      }
      const res = await uploadAdminPortalDocument(section, file, fields)
      setUploading(false)
      if (!res.ok) {
        setMsg((await res.text()) || 'Upload failed.')
        return
      }
    }
    setUploadOpen(false)
    setTitle('')
    setVideoUrl('')
    setLink('')
    setSubTitle('')
    setFile(null)
    await load()
  }

  return (
    <>
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as PortalDocumentSection)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d9488] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f766e]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Upload
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {sectionMeta.hint} · Showing {filtered.length} of {rows.length}
          {loading ? ' · Loading…' : ''}
        </p>
        {msg ? <p className="mt-2 text-sm text-red-600">{msg}</p> : null}
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <PortalDocumentsTable
          rows={filtered}
          scope="admin"
          section={section}
          onDelete={handleDelete}
          busyId={busyId}
        />
      </div>

      {uploadOpen ? (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close"
            onClick={() => setUploadOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <form
              onSubmit={(e) => void handleUpload(e)}
              className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Upload — {sectionMeta.label}</h2>
                  <p className="text-sm text-slate-600">Instructors will see this in their matching section.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="rounded-lg border border-slate-200 p-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="block text-xs font-semibold text-slate-600">
                Title / name
                <input
                  className={fieldClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={section !== 'presentation' || !link.trim()}
                />
              </label>

              {section === 'library' ? (
                <label className="mt-3 block text-xs font-semibold text-slate-600">
                  Library type
                  <select
                    className={fieldClass}
                    value={libraryType}
                    onChange={(e) => setLibraryType(e.target.value as 'document' | 'video')}
                  >
                    <option value="document">Document (file upload)</option>
                    <option value="video">Video (YouTube URL)</option>
                  </select>
                </label>
              ) : null}

              {section === 'library' && libraryType === 'video' ? (
                <label className="mt-3 block text-xs font-semibold text-slate-600">
                  YouTube / video URL
                  <input
                    className={fieldClass}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </label>
              ) : section === 'presentation' ? (
                <>
                  <label className="mt-3 block text-xs font-semibold text-slate-600">
                    Subtitle (optional)
                    <input className={fieldClass} value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-slate-600">
                    External link (optional if uploading file)
                    <input className={fieldClass} value={link} onChange={(e) => setLink(e.target.value)} />
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-slate-600">
                    File (optional)
                    <input
                      type="file"
                      className="mt-1 block w-full text-sm"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </>
              ) : (
                <label className="mt-3 block text-xs font-semibold text-slate-600">
                  File
                  <input
                    type="file"
                    required
                    className="mt-1 block w-full text-sm"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {uploading ? 'Uploading…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
