'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addStudentLiabilityDocument,
  deleteStudentLiabilityDocument,
  downloadStudentLiabilityFile,
  fetchMe,
  fetchStudentLiabilityDocuments,
  getToken,
  type MeUser,
  uploadStudentLiabilityFile,
} from '@/lib/portalApi'
import { fetchUpcomingCourses } from '@/lib/api'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { formatUsDate } from '@/lib/usDate'
import type { CourseDTO } from '@/lib/types'

function courseDisplayName(c: CourseDTO): string {
  return c.title || c.venueName || c.locationLabel || 'Class'
}

function dateRange(c: CourseDTO): string {
  const parsed = (c.sessionStarts || [])
    .map((s) => new Date(s))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
  if (parsed.length === 0) return ''
  const fmt = (d: Date) => formatUsDate(d)
  const first = parsed[0]
  const last = parsed[parsed.length - 1]
  return parsed.length === 1 ? fmt(first) : `${fmt(first)} - ${fmt(last)}`
}

export default function StudentLiabilityPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [courses, setCourses] = useState<CourseDTO[]>([])
  const [courseId, setCourseId] = useState('')
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileErr, setFileErr] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/liability')
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
    fetchStudentLiabilityDocuments()
      .then((d) => {
        const all = legacyAsObjectArray(d)
        setRows(all.filter((r) => String(r.userId || r.userID || '') === me.id))
      })
      .catch(() => setRows([]))
    fetchUpcomingCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [me])

  async function reload() {
    const d = await fetchStudentLiabilityDocuments()
    const all = legacyAsObjectArray(d)
    setRows(all.filter((r) => String(r.userId || r.userID || '') === me?.id))
  }

  async function addDoc() {
    if (!docName.trim() || !courseId.trim()) return
    const res = await addStudentLiabilityDocument({
      documentName: docName,
      fileUrl: docUrl,
      type: 'Liability',
      courseId,
    })
    if (res.ok) {
      setDocName('')
      setDocUrl('')
      setCourseId('')
      reload()
    }
  }

  async function delDoc(id: string) {
    const res = await deleteStudentLiabilityDocument(id)
    if (res.ok) reload()
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileErr(null)
    setUploading(true)
    try {
      await uploadStudentLiabilityFile(file)
      await reload()
    } catch (err) {
      setFileErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onDownloadFile(id: string) {
    setFileErr(null)
    try {
      await downloadStudentLiabilityFile(id)
    } catch (err) {
      setFileErr(err instanceof Error ? err.message : 'Download failed')
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Liability & health"
        subtitle="Your submitted health/liability documents (legacy studentliabilityhealth)."
      />
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">Liability & health workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600">
          <li>Select your class and add a liability/health document entry.</li>
          <li>Upload filled forms or supporting files (PDF / image, max 10MB).</li>
          <li>Use Download to verify stored files before class day.</li>
        </ol>
      </div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-bold text-slate-700">Upload file (stored on your account)</p>
        <p className="mb-2 text-xs text-slate-500">Up to 10MB. Same library as Forms &amp; pre-class prep.</p>
        <label className="inline-flex cursor-pointer items-center rounded border border-[#0d9488] bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#0f766e] hover:bg-teal-100">
          <input type="file" className="hidden" disabled={uploading} onChange={onUploadFile} />
          {uploading ? 'Uploading…' : 'Choose file'}
        </label>
        {fileErr && <p className="mt-2 text-xs text-red-600">{fileErr}</p>}
      </div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-bold text-slate-700">Add document entry</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Select class</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {courseDisplayName(c)} - {c.locationLabel}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Document name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="File URL (optional)"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={addDoc}
          className="mt-2 rounded bg-[#0d9488] px-3 py-1.5 text-xs font-bold text-white"
        >
          Add
        </button>
      </div>
      {rows.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Class name</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
            const id = String(
              r._id && typeof r._id === 'object' && '$oid' in r._id ? (r._id as { $oid: string }).$oid : r._id || i
            )
            const hasFile = Boolean(r.hasAttachment)
            const rowCourseId = String(r.courseId || '')
            const rowCourse = courses.find((c) => c.id === rowCourseId)
            const className =
              String(r.courseName || r.className || '').trim() ||
              (rowCourse ? courseDisplayName(rowCourse) : 'N/A')
            const dates =
              String(r.courseStartDate || '').trim() && String(r.courseEndDate || '').trim()
                ? `${String(r.courseStartDate)} - ${String(r.courseEndDate)}`
                : rowCourse
                  ? dateRange(rowCourse)
                  : '—'
            return (
              <tr key={id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{className}</td>
                <td className="px-4 py-3 text-slate-600">{dates || '—'}</td>
                <td className="px-4 py-3 text-slate-700">
                  {String(r.documentName || r.fileName || r.name || id)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {hasFile && (
                      <button
                        type="button"
                        onClick={() => onDownloadFile(id)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700"
                      >
                        Download
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => delDoc(id)}
                      className="rounded border border-red-300 px-2 py-1 text-xs font-bold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
