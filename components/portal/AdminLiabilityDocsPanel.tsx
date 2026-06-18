'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Search, Trash2 } from 'lucide-react'
import {
  deleteAdminLiabilityHealth,
  downloadAdminLiabilityHealthFile,
  fetchAdminLiabilityCourses,
  fetchAdminLiabilityHealth,
  type LiabilityHealthRow,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import { formatUsDate } from '@/lib/usDate'

function rowId(row: LiabilityHealthRow): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatUsDateValue(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return formatUsDate(d)
}

export default function AdminLiabilityDocsPanel({ meReady }: { meReady: boolean }) {
  const [courses, setCourses] = useState<LiabilityHealthRow[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<LiabilityHealthRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadCourses = useCallback(async () => {
    const data = await fetchAdminLiabilityCourses()
    setCourses(Array.isArray(data) ? data : [])
  }, [])

  const loadSubmissions = useCallback(async (courseId: string) => {
    setLoading(true)
    try {
      const data = await fetchAdminLiabilityHealth(courseId)
      setSubmissions(Array.isArray(data) ? data : [])
    } catch {
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!meReady) return
    loadCourses().catch(() => setCourses([]))
  }, [meReady, loadCourses])

  useEffect(() => {
    if (!selectedCourseId) {
      setSubmissions([])
      return
    }
    void loadSubmissions(selectedCourseId)
  }, [selectedCourseId, loadSubmissions])

  const filteredCourses = courses.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return JSON.stringify(c).toLowerCase().includes(q)
  })

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this liability submission?')) return
    const res = await deleteAdminLiabilityHealth(id)
    if (!res.ok) {
      setMsg('Could not delete this record.')
      return
    }
    if (selectedCourseId) await loadSubmissions(selectedCourseId)
    await loadCourses()
  }

  const selectedCourse = courses.find(
    (c) => String(c.courseId || '') === selectedCourseId
  )

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-slate-600">
          Legacy admin view: courses with instructor liability submissions. Click a course to see who
          submitted and download their waiver PDF.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          To upload admin templates for all instructors, use{' '}
          <a href="/portal/admin/library-docs" className="font-semibold text-[#0d9488] hover:underline">
            Library &amp; documents → Health / liability
          </a>
          .
        </p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {msg ? <p className="mt-2 text-sm text-red-600">{msg}</p> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Courses</h2>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2 text-center">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => {
                  const cid = String(c.courseId || '')
                  const active = selectedCourseId === cid
                  return (
                    <tr
                      key={cid || String(c.courseName)}
                      className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${active ? 'bg-teal-50' : ''}`}
                      onClick={() => setSelectedCourseId(cid || null)}
                    >
                      <td className="px-4 py-3 font-medium">{String(c.courseName || '—')}</td>
                      <td className="px-4 py-3 text-slate-600">{String(c.locationName || '—')}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {String(c.submissionCount ?? '—')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!filteredCourses.length && (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No course submissions yet.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">
              {selectedCourse
                ? `Submissions — ${String(selectedCourse.courseName || 'Course')}`
                : 'Select a course'}
            </h2>
            {selectedCourse ? (
              <p className="text-xs text-slate-500">
                {formatUsDateValue(selectedCourse.courseStartDate)} –{' '}
                {formatUsDateValue(selectedCourse.courseEndDate)}
                {loading ? ' · Loading…' : ''}
              </p>
            ) : null}
          </div>
          {!selectedCourseId ? (
            <p className="px-6 py-14 text-center text-sm text-slate-500">
              Choose a course on the left to view instructor waivers.
            </p>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                    <th className="px-4 py-2">Instructor</th>
                    <th className="px-4 py-2">Submitted</th>
                    <th className="px-4 py-2">Signed</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((r) => {
                    const id = rowId(r)
                    return (
                      <tr key={id} className="border-b border-slate-50">
                        <td className="px-4 py-3">
                          {String(r.instructorName || r.trainerName || '—')}
                        </td>
                        <td className="px-4 py-3">{formatWhen(r.createdDate)}</td>
                        <td className="px-4 py-3">{String(r.signature || '—')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {r.hasAttachment && id ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void downloadAdminLiabilityHealthFile(id).catch(() =>
                                    setMsg('Download failed.')
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-2 py-1 text-xs font-bold text-teal-800"
                              >
                                <Download className="h-3.5 w-3.5" /> PDF
                              </button>
                            ) : null}
                            {id ? (
                              <button
                                type="button"
                                onClick={() => void handleDelete(id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!loading && !submissions.length && (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  No submissions for this course.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
