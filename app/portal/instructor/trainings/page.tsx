'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  buildAdminCourseWritePayload,
  collectCourseFormErrors,
  courseFormFromRecord,
  emptyCourseForm,
  type CourseFormState,
  type InstructorOption,
} from '@/lib/adminCourseFormModel'
import {
  cancelInstructorCourse,
  createInstructorCourse,
  deleteInstructorCourse,
  fetchInstructorCourseDetail,
  fetchInstructorCourseRegistrationCounts,
  fetchInstructorCourses,
  fetchInstructorPortalInstructors,
  fetchInstructorRoster,
  fetchMe,
  downloadInstructorCourseExport,
  getToken,
  updateInstructorCourse,
  type MeUser,
} from '@/lib/portalApi'
import {
  courseDisplayName,
  formatCourseSessionsCell,
  instructorNamesCell,
} from '@/lib/courseTableDisplay'
import PortalCourseEditorForm from '@/components/portal/PortalCourseEditorForm'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import CourseEnrolledStudentsEmailDialog from '@/components/portal/CourseEnrolledStudentsEmailDialog'
import { registeredEmailsFromEnrollmentRows } from '@/lib/courseRosterEmail'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Ban, ClipboardList, FileSpreadsheet, Mail, Pencil, Plus, Trash2, Users, X } from 'lucide-react'

/** Mongo ObjectId hex when present (matches admin roster / registration count keys). */
function courseIdHex(c: Record<string, unknown>): string {
  const raw = c.id ?? c._id
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String((raw as { $oid: string }).$oid)
  }
  return ''
}

function courseSlug(c: Record<string, unknown>): string {
  const hex = courseIdHex(c)
  if (hex) return hex
  const tid = c.templateId as string | undefined
  if (tid) return tid
  const cid = c.courseId as string | undefined
  if (cid) return cid
  return ''
}

function mapPortalInstructors(rows: Record<string, unknown>[]): InstructorOption[] {
  return rows.map((r) => {
    const id = String(r.id || '')
    const fn = String(r.firstName || '')
    const ln = String(r.lastName || '')
    const name = `${fn} ${ln}`.trim() || String(r.email || id)
    const linkId = String(r.primaryInstructorId || id)
    return { id, name, linkId }
  })
}

type ConfirmDialogConfig = {
  title: string
  description: string
  confirmLabel: string
  variant: 'destructive' | 'primary'
  action: () => Promise<void>
}

function isCreator(raw: Record<string, unknown>, portalUserId: string) {
  const id = String(raw.createdBy ?? raw.createdByPortalUserId ?? '')
  return id === portalUserId
}

export default function InstructorTrainingsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'open' | 'completed' | 'cancelled'>('open')
  const [showEditor, setShowEditor] = useState(false)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState<CourseFormState>(() => emptyCourseForm())
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [regCounts, setRegCounts] = useState<Record<string, number>>({})
  const [rosterOpen, setRosterOpen] = useState(false)
  const [rosterTitle, setRosterTitle] = useState('')
  const [rosterRows, setRosterRows] = useState<Record<string, unknown>[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStudentEmails, setEmailStudentEmails] = useState<string[]>([])
  const [emailCourseId, setEmailCourseId] = useState('')
  const [emailCourseTitle, setEmailCourseTitle] = useState('')
  const [emailRosterError, setEmailRosterError] = useState('')
  const [dlBusy, setDlBusy] = useState<string | null>(null)
  const [dlErr, setDlErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/trainings')
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
    refreshCourses()
    fetchInstructorPortalInstructors()
      .then((rows) => setInstructors(mapPortalInstructors(Array.isArray(rows) ? rows : [])))
      .catch(() => setInstructors([]))
  }, [router])

  async function refreshCourses() {
    try {
      const list = await fetchInstructorCourses()
      setCourses((list as Record<string, unknown>[]) || [])
      const counts = await fetchInstructorCourseRegistrationCounts()
      setRegCounts(counts)
    } catch {
      setCourses([])
      setRegCounts({})
    }
  }

  async function openRosterDialog(courseId: string, title: string) {
    setRosterTitle(title)
    setRosterOpen(true)
    setRosterLoading(true)
    setRosterRows([])
    try {
      const { rows, error } = await fetchInstructorRoster(courseId)
      setRosterRows(rows)
      if (error) setMsg(error)
    } catch {
      setRosterRows([])
    } finally {
      setRosterLoading(false)
    }
  }

  async function openEmailStudents(courseId: string, title: string) {
    setEmailCourseId(courseId)
    setEmailCourseTitle(title)
    setEmailRosterError('')
    setEmailOpen(true)
    setEmailLoading(true)
    setEmailStudentEmails([])
    try {
      const { rows, error } = await fetchInstructorRoster(courseId)
      if (error) {
        setEmailRosterError(error)
        setEmailStudentEmails([])
        return
      }
      setEmailStudentEmails(registeredEmailsFromEnrollmentRows(rows))
    } catch {
      setEmailRosterError('Failed to load roster.')
      setEmailStudentEmails([])
    } finally {
      setEmailLoading(false)
    }
  }

  async function downloadExport(kind: 'roster' | 'attendance', courseId: string) {
    setDlErr('')
    setDlBusy(kind + courseId)
    try {
      await downloadInstructorCourseExport(courseId, kind)
    } catch (e) {
      setDlErr(String((e as Error).message || e))
    }
    setDlBusy(null)
  }

  async function runConfirmDialogAction() {
    if (!confirmDialog) return
    setConfirmBusy(true)
    try {
      await confirmDialog.action()
    } finally {
      setConfirmBusy(false)
      setConfirmDialog(null)
    }
  }

  const normalized = courses.map((c, i) => {
    const status = String(c.status || 'Pending')
    const s = status.toLowerCase()
    const bucket = s.includes('cancel') ? 'cancelled' : s.includes('complet') || s === 'past' ? 'completed' : 'upcoming'
    const slug = courseSlug(c)
    const idHex = courseIdHex(c)
    return {
      i,
      raw: c,
      slug,
      idHex,
      displayTitle: courseDisplayName(c),
      city: String(c.locationName || '—'),
      addressLine: String(c.address || c.classLocation || '—'),
      scheduleCell: formatCourseSessionsCell(c),
      minN: c.minStudentCount != null ? String(c.minStudentCount) : '—',
      tuition: String(c.feeDisplay || c.courseFees || '—'),
      instructorsCell: instructorNamesCell(c, instructors),
      status,
      bucket,
      text: JSON.stringify(c).toLowerCase(),
    }
  })
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return normalized.filter((c) => {
      if (tab === 'open' && c.bucket !== 'upcoming') return false
      if (tab === 'completed' && c.bucket !== 'completed') return false
      if (tab === 'cancelled' && c.bucket !== 'cancelled') return false
      if (!q) return true
      return c.text.includes(q)
    })
  }, [normalized, search, tab])
  const completedCount = normalized.filter((c) => c.bucket === 'completed').length
  const cancelledCount = normalized.filter((c) => c.bucket === 'cancelled').length
  const upcomingCount = normalized.filter((c) => c.bucket === 'upcoming').length

  async function openEditorForEdit(slug: string) {
    setMsg('')
    let ins = instructors
    if (ins.length === 0) {
      const rows = await fetchInstructorPortalInstructors().catch(() => [])
      ins = mapPortalInstructors(Array.isArray(rows) ? rows : [])
      setInstructors(ins)
    }
    const detail = await fetchInstructorCourseDetail(slug).catch(() => null)
    if (!detail?.course) {
      setMsg('Could not load course for editing.')
      return
    }
    setForm(courseFormFromRecord(detail.course, ins))
    setEditId(slug)
    setShowEditor(true)
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const errs = collectCourseFormErrors(form)
    if (errs.length) {
      setMsg(errs.join(' '))
      return
    }
    const payload = buildAdminCourseWritePayload(form)
    setSaving(true)
    try {
      const res = editId ? await updateInstructorCourse(editId, payload) : await createInstructorCourse(payload)
      if (!res.ok) {
        setMsg((await res.text()) || 'Could not save course.')
        return
      }
      setMsg(editId ? 'Course updated.' : 'Course created.')
      setEditId('')
      setShowEditor(false)
      setForm(emptyCourseForm())
      await refreshCourses()
    } finally {
      setSaving(false)
    }
  }

  function requestCancelCourse(slug: string) {
    setConfirmDialog({
      title: 'Cancel this class?',
      description:
        'Mark this course as cancelled? Students and the schedule will reflect a cancelled class.',
      confirmLabel: 'Cancel class',
      variant: 'destructive',
      action: async () => {
        const res = await cancelInstructorCourse(slug)
        if (!res.ok) throw new Error((await res.text()) || 'Cancel failed')
        await refreshCourses()
      },
    })
  }

  function requestDeleteCourse(slug: string) {
    setConfirmDialog({
      title: 'Delete this course?',
      description: 'Permanently delete this course? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      action: async () => {
        const res = await deleteInstructorCourse(slug)
        if (!res.ok && res.status !== 204) throw new Error((await res.text()) || 'Delete failed')
        await refreshCourses()
      },
    })
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Course management"
        subtitle="Manage your upcoming/completed/cancelled courses in one workspace."
      />
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'open', label: `Courses (${upcomingCount})` },
              { id: 'completed', label: `Past Courses (${completedCount})` },
              { id: 'cancelled', label: `Cancelled Classes (${cancelledCount})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as 'open' | 'completed' | 'cancelled')}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  tab === t.id ? 'bg-[#0f172a] text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (showEditor) {
                setShowEditor(false)
                setEditId('')
                setForm(emptyCourseForm())
                setMsg('')
              } else {
                setForm({ ...emptyCourseForm(), primaryInstructorUserId: me.id })
                setEditId('')
                setShowEditor(true)
                setMsg('')
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            New course
          </button>
        </div>
      </section>

      {showEditor && (
        <form onSubmit={saveCourse} className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">{editId ? `Editing course ${editId}` : 'Create course'}</p>
            <button
              type="button"
              onClick={() => {
                setShowEditor(false)
                setEditId('')
                setForm(emptyCourseForm())
                setMsg('')
              }}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Close editor
            </button>
          </div>
          <PortalCourseEditorForm
            form={form}
            setForm={setForm}
            instructors={instructors}
            lockPrimaryToUserId={me.id}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={saving}
              type="submit"
              className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : editId ? 'Update course' : 'Create course'}
            </button>
            {msg && <p className="text-sm text-slate-600">{msg}</p>}
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">All courses</p>
          <input
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Search city, course, instructor, dates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Edit, delete, and cancel appear only for upcoming courses you created in the portal. Past (completed)
          courses are read-only here.
        </p>
        {dlErr ? <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">{dlErr}</p> : null}
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No courses match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="p-3 font-semibold text-slate-700">City</th>
                  <th className="min-w-[240px] p-3 font-semibold text-slate-700">Course</th>
                  <th className="min-w-[264px] p-3 font-semibold text-slate-700">Schedule</th>
                  <th className="p-3 font-semibold text-slate-700">Min #</th>
                  <th className="p-3 font-semibold text-slate-700">Registered</th>
                  <th className="p-3 font-semibold text-slate-700">Tuition</th>
                  <th className="p-3 font-semibold text-slate-700">Instructors</th>
                  <th className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const creator = isCreator(c.raw, me.id)
                  const canManage = creator && c.bucket !== 'completed'
                  const regKey = c.idHex || c.slug
                  const reg = regKey ? regCounts[regKey] ?? 0 : 0
                  const courseNavId = c.idHex || c.slug
                  const busyRoster = dlBusy === 'roster' + courseNavId
                  const busyAttendance = dlBusy === 'attendance' + courseNavId
                  return (
                    <tr key={c.slug || c.i} className="border-b border-slate-50">
                      <td className="p-3 font-medium text-slate-900">{c.city}</td>
                      <td className="min-w-[240px] max-w-[288px] p-3 text-slate-700">
                        {courseNavId ? (
                          <Link
                            href={`/portal/instructor/courses/${encodeURIComponent(courseNavId)}`}
                            className="font-semibold text-[#0d9488] hover:underline"
                          >
                            {c.displayTitle}
                          </Link>
                        ) : (
                          <span className="font-semibold">{c.displayTitle}</span>
                        )}
                        <p className="text-xs text-slate-500">{c.addressLine}</p>
                      </td>
                      <td className="min-w-[264px] max-w-[264px] whitespace-pre-line p-3 text-xs leading-relaxed text-slate-700">
                        {c.scheduleCell}
                      </td>
                      <td className="p-3 text-slate-600">{c.minN}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {courseNavId ? (
                            <button
                              type="button"
                              onClick={() => void openRosterDialog(courseNavId, c.displayTitle)}
                              className="font-semibold text-[#0f172a] hover:underline"
                            >
                              {reg}
                            </button>
                          ) : (
                            <span>{reg}</span>
                          )}
                          {courseNavId ? (
                            <button
                              type="button"
                              title="Email registered students"
                              disabled={emailLoading && emailOpen}
                              onClick={() => void openEmailStudents(courseNavId, c.displayTitle)}
                              className="inline-flex rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-[#0d9488] disabled:opacity-50"
                            >
                              <Mail className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{c.tuition}</td>
                      <td className="max-w-[180px] p-3 text-xs text-slate-600">{c.instructorsCell}</td>
                      <td className="w-40 min-w-[10rem] whitespace-nowrap p-3 text-right align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-0.5">
                          {canManage ? (
                            <>
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => void openEditorForEdit(c.slug)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                              >
                                <Pencil className="size-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                onClick={() => requestDeleteCourse(c.slug)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                title="Cancel class"
                                onClick={() => requestCancelCourse(c.slug)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-amber-700 hover:bg-amber-50"
                              >
                                <Ban className="size-4" aria-hidden />
                              </button>
                            </>
                          ) : null}
                          {courseNavId ? (
                            <>
                              <button
                                type="button"
                                title="Download roster XLSX"
                                disabled={!!dlBusy}
                                onClick={() => downloadExport('roster', courseNavId)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                              >
                                <FileSpreadsheet className="size-4" aria-hidden />
                                <span className="sr-only">{busyRoster ? 'Loading roster' : 'Download roster'}</span>
                              </button>
                              <button
                                type="button"
                                title="Download attendance XLSX"
                                disabled={!!dlBusy}
                                onClick={() => downloadExport('attendance', courseNavId)}
                                className="inline-flex shrink-0 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                              >
                                <ClipboardList className="size-4" aria-hidden />
                                <span className="sr-only">
                                  {busyAttendance ? 'Loading attendance' : 'Download attendance'}
                                </span>
                              </button>
                            </>
                          ) : !canManage ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CourseEnrolledStudentsEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        courseId={emailCourseId}
        courseTitle={emailCourseTitle}
        studentEmails={emailStudentEmails}
        audience="instructor"
        loading={emailLoading}
        rosterError={emailRosterError}
      />

      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-100 px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-base text-slate-900">
              <Users className="size-5 text-[#0d9488]" aria-hidden />
              Registered students · {rosterTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3">
            {rosterLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : rosterRows.length === 0 ? (
              <p className="text-sm text-slate-500">No enrollment records for this course.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rosterRows.map((r, idx) => (
                  <li key={String(r.id || idx)} className="py-2.5 text-sm">
                    <p className="font-medium text-slate-900">
                      {String(r.studentFirstName || '').trim()} {String(r.studentLastName || '').trim()}
                    </p>
                    <p className="text-xs text-slate-500">{String(r.studentEmail || '—')}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{String(r.status || '—')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDialog != null}
        onOpenChange={(open) => {
          if (!open && !confirmBusy) setConfirmDialog(null)
        }}
      >
        <AlertDialogContent className="relative border border-slate-200 bg-white p-6 pt-7 shadow-lg sm:max-w-md">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
            onClick={() => !confirmBusy && setConfirmDialog(null)}
            aria-label="Close dialog"
            disabled={confirmBusy}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <AlertDialogHeader className="pr-8 text-left">
            <AlertDialogTitle className="text-slate-900">{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel disabled={confirmBusy} className="mt-0 border-slate-300 sm:min-w-[6.5rem]">
              Close
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={confirmBusy}
              className={cn(
                'min-w-[7.5rem] font-semibold shadow-sm sm:min-w-[8rem]',
                confirmDialog?.variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[#0f172a] text-white hover:bg-[#0d9488]'
              )}
              onClick={() => void runConfirmDialogAction()}
            >
              {confirmBusy ? 'Working…' : (confirmDialog?.confirmLabel ?? 'Confirm')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
