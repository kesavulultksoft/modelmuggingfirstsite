'use client'

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  fetchAdminInterviewers,
  fetchAdminTrainerApplicants,
  fetchAdminTrainerInterviewReview,
  fetchMe,
  getToken,
  postAdminEmailSend,
  postAdminTrainerAction,
  type MeUser,
  type TrainerActionKind,
} from '@/lib/portalApi'
import { AlertTriangle, ChevronDown, Mail, MessageSquare, X } from 'lucide-react'
import { coerceMongoIdFromRow, legacyAsObjectArray, mongoIdToString } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import AdminApplicantSubmissionModal from '@/components/portal/AdminApplicantSubmissionModal'
import AdminInterviewQaReadOnly, { type InterviewReviewBundle } from '@/components/portal/AdminInterviewQaReadOnly'

type Applicant = Record<string, unknown>

type SubmissionViewState = {
  /** Portal user id when present; else trainer `dumId` / row id for API resolution. */
  lookupId: string
  name: string
  stage: string
  label: string
}

type TrainerActionBody = {
  kind: TrainerActionKind
  trainerId?: string
  userId?: string
  status?: string
  qualifyNote?: string
  isArchived?: boolean
  interviewerIds?: string[]
  interviewDate?: string
}

type StageKey =
  | 'all'
  | 'contact'
  | 'application'
  | 'interview'
  | 'tracker'
  | 'background'
  | 'physical'
  | 'equipment'
  | 'travel'
  | 'tshirt'
  | 'basic'
  | 'expense'

type PipelineView = 'interviewer-selection' | 'interview-coordination' | 'interview-tracker' | 'archives'

type PipelineConfirmState =
  | { kind: 'convert'; dumId: string; name: string }
  | { kind: 'reject'; dumId: string; userId: string; name: string }
  | { kind: 'archive'; dumId: string; name: string }

function pipelineConfirmCopy(
  confirm: PipelineConfirmState,
  listTab: 'active' | 'archived'
): {
  title: string
  description: string
  confirmLabel: string
  confirmClass: string
  iconWrapClass: string
} {
  switch (confirm.kind) {
    case 'convert':
      return {
        title: 'Convert to instructor',
        description: `Are you sure you want to mark ${confirm.name} as Instructor? This will complete onboarding and send the congratulations email (legacy).`,
        confirmLabel: 'Convert to instructor',
        confirmClass: 'bg-indigo-700 hover:bg-indigo-800 text-white',
        iconWrapClass: 'bg-indigo-50 text-indigo-600',
      }
    case 'reject':
      return {
        title: 'Reject and reset onboarding',
        description: `Are you sure you want to reject ${confirm.name} and reset onboarding? Interview and verification stages will return to Submitted (legacy reject flow).`,
        confirmLabel: 'Reject and reset',
        confirmClass: 'bg-red-700 hover:bg-red-800 text-white',
        iconWrapClass: 'bg-red-50 text-red-600',
      }
    case 'archive': {
      const archiving = listTab === 'active'
      return {
        title: archiving ? 'Move to archive' : 'Restore from archive',
        description: archiving
          ? `Move ${confirm.name} to archive? They will appear under Archives until restored.`
          : `Restore ${confirm.name} from archive? They will return to the active applicant list.`,
        confirmLabel: archiving ? 'Move to archive' : 'Restore',
        confirmClass: 'bg-amber-700 hover:bg-amber-800 text-white',
        iconWrapClass: 'bg-amber-50 text-amber-700',
      }
    }
  }
}

function mapTrainerAction(op: string, params: Record<string, string>): TrainerActionBody {
  switch (op) {
    case 'updateTrainerInterviewStatus':
      return {
        kind: 'INTERVIEW',
        trainerId: params.trainerId,
        status: params.status,
        qualifyNote: params.qualifyNote,
      }
    case 'updateBackGroundVerificationStatus':
      return { kind: 'BG', userId: params.userId, status: params.status }
    case 'updateApplicationStatus':
      return { kind: 'APPLICATION', trainerId: params.trainerId, status: params.status }
    case 'updateInstructorPhysicalVerificationStatus':
      return {
        kind: 'PHYSICAL',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorEquipmentStatus':
      return {
        kind: 'EQUIPMENT',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorTravelStatus':
      return {
        kind: 'TRAVEL',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorTShirtStatus':
      return {
        kind: 'TSHIRT',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorBasicCourseStatus':
      return {
        kind: 'BASIC_COURSE',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorExpensePoolStatus':
      return {
        kind: 'EXPENSE_POOL',
        trainerId: params.trainerId,
        userId: params.userId,
        status: params.status,
      }
    case 'updateInstructorAsArchieve':
      return {
        kind: 'ARCHIVE',
        trainerId: params.instructorId,
        isArchived: params.isArchieved === 'true',
      }
    case 'assignInterviewers':
      return {
        kind: 'ASSIGN_INTERVIEWER',
        trainerId: params.trainerId,
        interviewerIds: (params.interviewerIds || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    case 'scheduleInterview':
      return {
        kind: 'SCHEDULE_INTERVIEW',
        trainerId: params.trainerId,
        interviewDate: params.interviewDate,
      }
    case 'updateInterviewTrackerStatus':
      return { kind: 'INTERVIEW_TRACKER', trainerId: params.trainerId, status: params.status }
    case 'convertToInstructor':
      return {
        kind: 'CONVERT_TO_INSTRUCTOR',
        trainerId: params.trainerId,
        qualifyNote: params.qualifyNote,
      }
    case 'rejectAndResetApplicant':
      return {
        kind: 'REJECT_AND_RESET',
        trainerId: params.trainerId,
        userId: params.userId,
        qualifyNote: params.qualifyNote,
      }
    default:
      throw new Error(`Unknown action ${op}`)
  }
}

function stageText(v: unknown): string {
  if (v == null || v === '') return 'Pending'
  if (typeof v === 'boolean') return v ? 'Approved' : 'Rejected'
  const s = String(v).trim()
  if (s === 'true') return 'Approved'
  if (s === 'false') return 'Rejected'
  return s
}

function interviewStatusForRow(r: Applicant): unknown {
  return r.interviewStatus ?? (r as Record<string, unknown>).interivewStatus
}

function applicationApproved(v: unknown): boolean {
  if (v === true) return true
  return /^(true|approved|yes|complete)$/i.test(String(v ?? '').trim())
}

/** Instructor row Mongo id (legacy {@code dumId} / {@code _id}) for interview & application actions. */
function instructorTrainerId(r: Applicant): string {
  return coerceMongoIdFromRow(r)
}

/** `datetime-local` value from stored `interviewScheduledDate` (local timezone). */
function interviewScheduledLocalValue(r: Applicant): string {
  const raw = (r as { interviewScheduledDate?: unknown }).interviewScheduledDate
  if (!raw) return ''
  const interviewAt = new Date(String(raw))
  if (Number.isNaN(interviewAt.getTime())) return ''
  return new Date(interviewAt.getTime() - interviewAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function formatInterviewScheduledDisplay(r: Applicant): string | null {
  const raw = (r as { interviewScheduledDate?: unknown }).interviewScheduledDate
  if (!raw) return null
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function instructorPortalUserId(r: Applicant): string {
  return mongoIdToString(r.userId)
}

function stageCompact(v: unknown): string {
  return stageText(v).toLowerCase().replace(/[\s_-]/g, '')
}

/** Avoid treating {@code NotQualified} as qualified (substring match bug). */
function stageTone(v: unknown): 'good' | 'bad' | 'neutral' {
  const c = stageCompact(v)
  if (!c || c === 'pending') return 'neutral'
  if (/notqualified|rejected|unsuccessful|fail/.test(c)) return 'bad'
  if (c === 'qualified' || c === 'successful' || c === 'approved' || c === 'completed') return 'good'
  if (c === 'submitted' || c === 'scheduled') return 'neutral'
  return 'neutral'
}

function isGood(v: unknown): boolean {
  return stageTone(v) === 'good'
}

function isBad(v: unknown): boolean {
  return stageTone(v) === 'bad'
}

/**
 * Legacy trainersignuphistory: contact is applicant-pending only when
 * {@code contactInfoSubmittedDate == null}. {@code Submitted} (form on file) is not pending;
 * admin {@code Successful} is optional staff verification (Done / Not Done).
 */
function contactApplicantSubmitted(r: Applicant): boolean {
  if (r.contactInfoSubmittedDate != null) return true
  const st = stageCompact(r.contactVerificationStatus)
  return st === 'submitted' || st === 'successful'
}

function contactStageTone(v: unknown, r: Applicant): 'good' | 'bad' | 'neutral' {
  if (contactApplicantSubmitted(r)) {
    const st = stageCompact(v)
    if (st === 'successful') return 'good'
    if (st === 'submitted') return 'good'
  }
  return stageTone(v)
}

function formatInterviewStatusLabel(v: unknown): string {
  const c = stageCompact(v)
  if (c === 'notqualified') return 'Not Qualified'
  if (c === 'qualified') return 'Qualified'
  return stageText(v)
}

function interviewStageTone(v: unknown): 'good' | 'bad' | 'neutral' {
  const c = stageCompact(v)
  if (c === 'qualified') return 'good'
  if (c === 'notqualified') return 'bad'
  return stageTone(v)
}

function applicantQualifyNote(r: Applicant): string {
  return String((r as { qualifyNote?: unknown }).qualifyNote || '').trim()
}

/** Legacy “Qualified As Instructor” — all verification stages Successful and interview Qualified. */
/** Legacy: {@code status} Completed / {@code becameInstructorDate} — no longer an open applicant. */
function isConvertedApplicant(r: Applicant): boolean {
  const became = (r as { becameInstructorDate?: unknown }).becameInstructorDate
  if (became != null && String(became).trim() !== '') return true
  return /^(completed|complete)$/i.test(String(r.status ?? '').trim())
}

function isManuallyArchivedApplicant(r: Applicant): boolean {
  if (isConvertedApplicant(r)) return false
  if (r.isArchieve === true || r.isArchived === true) return true
  return String(r.isArchieve ?? '').toLowerCase() === 'true' || String(r.isArchived ?? '').toLowerCase() === 'true'
}

function showInPipelineArchives(r: Applicant): boolean {
  return isConvertedApplicant(r) || isManuallyArchivedApplicant(r)
}

function isReadyToConvert(r: Applicant): boolean {
  if (/^completed$/i.test(String(r.status || '').trim())) return false
  if (stageCompact(interviewStatusForRow(r)) !== 'qualified') return false
  const stages = [
    r.instructorInterviewStatus,
    r.bgVerificationStatus,
    r.physicalVerificationStatus,
    r.equipmentStatus,
    r.travelInfoStatus,
    r.tShirtStatus,
    r.basicCourseStatus,
    r.expensePoolStatus,
  ]
  return stages.every((s) => stageCompact(s) === 'successful')
}

/** Legacy: admin marks Done only after applicant submitted the portal form ({@code *SubmittedDate}). */
function pipelineStageSubmitted(r: Applicant, submittedKey: string, statusKey?: string): boolean {
  const d = r[submittedKey]
  if (d != null && String(d).trim() !== '') return true
  if (statusKey) {
    const c = stageCompact(r[statusKey])
    return c === 'submitted' || c === 'successful' || c === 'unsuccessful'
  }
  return false
}

function bgLegacyDoneLabel(v: unknown): string {
  return stageCompact(v) === 'successful' ? 'Done' : 'Not Done'
}

function bgPaymentHint(v: unknown): string | null {
  const c = stageCompact(v)
  if (c === 'successful') return null
  if (c === 'paid') return 'Fee paid — awaiting BG agent approval'
  if (c === 'submitted') return 'Authorization saved — payment required before BG review'
  if (c === 'inprogress') return 'Investigation in progress'
  if (c === 'unsuccessful') return 'Background unsuccessful'
  return null
}

const VERIFICATION_STAGE_META: {
  key: 'physical' | 'equipment' | 'travel' | 'tshirt' | 'basic' | 'expense'
  label: string
  op: string
  submittedKey: string
  statusKey: string
}[] = [
  { key: 'physical', label: 'Physical', op: 'updateInstructorPhysicalVerificationStatus', submittedKey: 'physicalSubmittedDate', statusKey: 'physicalVerificationStatus' },
  { key: 'equipment', label: 'Equipment', op: 'updateInstructorEquipmentStatus', submittedKey: 'equipmentSubmittedDate', statusKey: 'equipmentStatus' },
  { key: 'travel', label: 'Travel', op: 'updateInstructorTravelStatus', submittedKey: 'travelInfoSubmittedDate', statusKey: 'travelInfoStatus' },
  { key: 'tshirt', label: 'T-shirt', op: 'updateInstructorTShirtStatus', submittedKey: 'tShirtSubmittedDate', statusKey: 'tShirtStatus' },
  { key: 'basic', label: 'Basic', op: 'updateInstructorBasicCourseStatus', submittedKey: 'basicCourseSubmittedDate', statusKey: 'basicCourseStatus' },
  { key: 'expense', label: 'Expense', op: 'updateInstructorExpensePoolStatus', submittedKey: 'expensePoolSubmittedDate', statusKey: 'expensePoolStatus' },
]

function StagePill({ v, tone }: { v: unknown; tone?: 'good' | 'bad' | 'neutral' }) {
  const s = stageText(v)
  const t = tone ?? stageTone(v)
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
        t === 'good'
          ? 'bg-emerald-100 text-emerald-700'
          : t === 'bad'
            ? 'bg-red-100 text-red-700'
            : 'bg-slate-100 text-slate-700'
      }`}
    >
      {s.length > 16 ? s.slice(0, 15) + '…' : s}
    </span>
  )
}

function InterviewStagePill({ v }: { v: unknown }) {
  const label = formatInterviewStatusLabel(v)
  const t = interviewStageTone(v)
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
        t === 'good'
          ? 'bg-emerald-100 text-emerald-700'
          : t === 'bad'
            ? 'bg-red-100 text-red-700'
            : 'bg-slate-100 text-slate-700'
      }`}
    >
      {label.length > 18 ? label.slice(0, 17) + '…' : label}
    </span>
  )
}

function StageOpenButton({
  lookupId,
  applicantName,
  stage,
  label,
  value,
  onOpen,
  tone,
  children,
}: {
  lookupId: string
  applicantName: string
  stage: string
  label: string
  value: unknown
  onOpen: (v: SubmissionViewState) => void
  tone?: 'good' | 'bad' | 'neutral'
  children?: ReactNode
}) {
  const disabled = !lookupId.trim()
  return (
    <div className="flex max-w-[140px] flex-col items-start gap-1">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? 'Missing applicant id' : `View submitted form — ${label}`}
        className="max-w-full rounded-lg p-0.5 text-left outline-none ring-teal-500/0 transition hover:bg-slate-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onOpen({ lookupId, name: applicantName, stage, label })}
      >
        <StagePill v={value} tone={tone} />
      </button>
      {children}
    </div>
  )
}

function progressForApplicant(r: Applicant): number {
  const checks = [
    contactApplicantSubmitted(r),
    applicationApproved(r.applicationStatus),
    isGood(interviewStatusForRow(r)),
    isGood(r.instructorInterviewStatus),
    isGood(r.bgVerificationStatus),
    isGood(r.physicalVerificationStatus),
    isGood(r.equipmentStatus),
    isGood(r.travelInfoStatus),
    isGood(r.tShirtStatus),
    isGood(r.basicCourseStatus),
    isGood(r.expensePoolStatus),
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

function stageForFilter(r: Applicant): StageKey {
  if (!contactApplicantSubmitted(r)) return 'contact'
  if (!applicationApproved(r.applicationStatus)) return 'application'
  if (!isGood(interviewStatusForRow(r))) return 'interview'
  if (!isGood(r.instructorInterviewStatus)) return 'tracker'
  if (!isGood(r.bgVerificationStatus)) return 'background'
  if (!isGood(r.physicalVerificationStatus)) return 'physical'
  if (!isGood(r.equipmentStatus)) return 'equipment'
  if (!isGood(r.travelInfoStatus)) return 'travel'
  if (!isGood(r.tShirtStatus)) return 'tshirt'
  if (!isGood(r.basicCourseStatus)) return 'basic'
  if (!isGood(r.expensePoolStatus)) return 'expense'
  return 'all'
}

export default function AdminTrainerPipelinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [rows, setRows] = useState<Applicant[]>([])
  const [interviewers, setInterviewers] = useState<Applicant[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [drawerMsg, setDrawerMsg] = useState('')
  const [drawerOk, setDrawerOk] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [interviewNote, setInterviewNote] = useState('')
  const [finalizeNotes, setFinalizeNotes] = useState<Record<string, string>>({})
  const [notesView, setNotesView] = useState<{ name: string; note: string } | null>(null)
  const [emailModal, setEmailModal] = useState<{
    applicantName: string
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
  } | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [stageFilter, setStageFilter] = useState<StageKey>('all')
  const [search, setSearch] = useState('')
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)
  const [selectedInterviewers, setSelectedInterviewers] = useState<Record<string, string[]>>({})
  const [scheduledAt, setScheduledAt] = useState<Record<string, string>>({})
  const [applicationDraft, setApplicationDraft] = useState<Record<string, string>>({})
  const [interviewDraft, setInterviewDraft] = useState<Record<string, string>>({})
  const [trackerDraft, setTrackerDraft] = useState<Record<string, string>>({})
  const [bgDraft, setBgDraft] = useState<Record<string, string>>({})
  const [stageDraft, setStageDraft] = useState<
    Record<string, { physical: string; equipment: string; travel: string; tshirt: string; basic: string; expense: string }>
  >({})
  const [interviewReviewByTrainer, setInterviewReviewByTrainer] = useState<
    Record<string, Record<string, unknown> | undefined>
  >({})
  const [interviewReviewLoading, setInterviewReviewLoading] = useState<string | null>(null)
  const [interviewQaExpanded, setInterviewQaExpanded] = useState<Record<string, boolean>>({})
  const [pipelineView, setPipelineView] = useState<PipelineView>('interviewer-selection')
  const [submissionView, setSubmissionView] = useState<SubmissionViewState | null>(null)
  const [pipelineConfirm, setPipelineConfirm] = useState<PipelineConfirmState | null>(null)

  const load = useCallback((): Promise<Applicant[]> => {
    return fetchAdminTrainerApplicants(tab === 'archived')
      .then((d) => {
        const next = legacyAsObjectArray(d)
        setRows(next)
        return next
      })
      .catch(() => {
        setRows([])
        return [] as Applicant[]
      })
  }, [tab])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/trainer-pipeline')
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
    load()
    fetchAdminInterviewers()
      .then((d) => setInterviewers(legacyAsObjectArray(d)))
      .catch(() => setInterviewers([]))
  }, [me, load])

  useEffect(() => {
    const stage = (searchParams?.get('stage') || '').toLowerCase()
    if (stage === 'interview') setStageFilter('interview')
  }, [searchParams])

  useEffect(() => {
    if (tab === 'archived') {
      setPipelineView('archives')
    } else if (pipelineView === 'archives') {
      setPipelineView('interviewer-selection')
    }
  }, [tab, pipelineView])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const inArchivesView = tab === 'archived' || pipelineView === 'archives'
      if (inArchivesView) {
        if (!showInPipelineArchives(r)) return false
      } else if (isConvertedApplicant(r)) {
        return false
      }
      if (pipelineView === 'interviewer-selection') {
        const hasAssigned = Array.isArray((r as any).allInterviewersDumId)
          ? ((r as any).allInterviewersDumId as unknown[]).length > 0
          : !!String((r as any).allInterviewersDumId || '').trim()
        // Do not require applicationStatus here: many DB rows are false/null until staff acts; those
        // applicants still need this tab (approve application + assign interviewers). Only exclude once
        // interviewers are already assigned (they belong in Interview Coordination).
        if (hasAssigned) return false
      }
      if (pipelineView === 'interview-coordination') {
        const hasAssigned = Array.isArray((r as any).allInterviewersDumId)
          ? ((r as any).allInterviewersDumId as unknown[]).length > 0
          : !!String((r as any).allInterviewersDumId || '').trim()
        if (!hasAssigned) return false
      }
      if (pipelineView === 'interview-tracker') {
        const hasSchedule = !!(r as any).interviewScheduledDate
        if (!hasSchedule) return false
      }
      if (stageFilter !== 'all' && stageForFilter(r) !== stageFilter) return false
      if (!search.trim()) return true
      return JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    })
  }, [rows, stageFilter, search, pipelineView, tab])

  useEffect(() => {
    setPage(1)
  }, [tab, stageFilter, search, pipelineView])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stageCounts = useMemo(() => {
    const c: Record<StageKey, number> = {
      all: rows.length,
      contact: 0,
      application: 0,
      interview: 0,
      tracker: 0,
      background: 0,
      physical: 0,
      equipment: 0,
      travel: 0,
      tshirt: 0,
      basic: 0,
      expense: 0,
    }
    rows.forEach((r) => {
      const k = stageForFilter(r)
      if (k !== 'all') c[k] += 1
    })
    return c
  }, [rows])

  const summary = useMemo(() => {
    const readyToConvert = rows.filter((r) => isReadyToConvert(r)).length
    const contactPending = rows.filter((r) => !contactApplicantSubmitted(r)).length
    const interviewPending = rows.filter((r) => !isGood(interviewStatusForRow(r))).length
    const trackerPending = rows.filter((r) => !isGood(r.instructorInterviewStatus)).length
    return { total: rows.length, contactPending, interviewPending, trackerPending, readyToConvert }
  }, [rows])

  async function act(op: string, params: Record<string, string>, label: string) {
    setBusy(label)
    setDrawerMsg('')
    setDrawerOk(false)
    setMsg('')
    try {
      const res = await postAdminTrainerAction(mapTrainerAction(op, params))
      let data: { message?: string; ok?: boolean; updated?: boolean; emailSent?: boolean } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        // non-JSON body
      }
      if (!res.ok) throw new Error(data.message || res.statusText)
      setDrawerMsg(data.message || `${label} saved.`)
      setDrawerOk(data.updated !== false)
      const nextRows = await load()
      const openTrainerId = openId
      if (openTrainerId) {
        const refreshed = nextRows.find((row) => instructorTrainerId(row) === openTrainerId)
        if (refreshed && !isConvertedApplicant(refreshed)) {
          initDraftsFromRow(openTrainerId, refreshed)
        } else {
          setOpenId(null)
        }
      }
    } catch (e) {
      setDrawerMsg(String((e as Error).message || e))
      setDrawerOk(false)
    }
    setBusy(null)
  }

  function initDraftsFromRow(dumId: string, r: Applicant) {
    setApplicationDraft((prev) => ({ ...prev, [dumId]: String(r.applicationStatus ? 'Approved' : 'Rejected') }))
    setInterviewDraft((prev) => ({ ...prev, [dumId]: String(interviewStatusForRow(r) || 'Pending') }))
    setTrackerDraft((prev) => ({ ...prev, [dumId]: String(r.instructorInterviewStatus || 'Pending') }))
    setBgDraft((prev) => ({ ...prev, [dumId]: String(r.bgVerificationStatus || 'Pending') }))
    setStageDraft((prev) => ({
      ...prev,
      [dumId]: {
        physical: String(r.physicalVerificationStatus || 'Pending'),
        equipment: String(r.equipmentStatus || 'Pending'),
        travel: String(r.travelInfoStatus || 'Pending'),
        tshirt: String(r.tShirtStatus || 'Pending'),
        basic: String(r.basicCourseStatus || 'Pending'),
        expense: String(r.expensePoolStatus || 'Pending'),
      },
    }))
    const localSchedule = interviewScheduledLocalValue(r)
    if (localSchedule) {
      setScheduledAt((prev) => ({ ...prev, [dumId]: localSchedule }))
    }
    setFinalizeNotes((prev) => ({
      ...prev,
      [dumId]: String((r as { qualifyNote?: unknown }).qualifyNote || '').trim(),
    }))
  }

  function openTrainerDrawer(dumId: string, r: Applicant) {
    initDraftsFromRow(dumId, r)
    const initialIds = Array.isArray((r as any).allInterviewersDumId)
      ? ((r as any).allInterviewersDumId as unknown[]).map(String)
      : String((r as any).allInterviewersDumId || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    setSelectedInterviewers((prev) => ({ ...prev, [dumId]: initialIds }))
    setDrawerMsg('')
    setDrawerOk(false)
    setOpenId(dumId)
    setInterviewQaExpanded((prev) => ({ ...prev, [dumId]: false }))
  }

  function toggleInterviewQa(dumId: string) {
    const willExpand = !interviewQaExpanded[dumId]
    setInterviewQaExpanded((prev) => ({ ...prev, [dumId]: willExpand }))
    if (willExpand && !interviewReviewByTrainer[dumId] && interviewReviewLoading !== dumId) {
      void loadInterviewReview(dumId)
    }
  }

  async function loadInterviewReview(applicantKey: string) {
    if (!applicantKey.trim()) return
    setInterviewReviewLoading(applicantKey)
    try {
      const b = await fetchAdminTrainerInterviewReview(applicantKey)
      setInterviewReviewByTrainer((prev) => ({ ...prev, [applicantKey]: b }))
    } catch {
      setInterviewReviewByTrainer((prev) => ({
        ...prev,
        [applicantKey]: { error: 'Failed to load interview answers' },
      }))
    } finally {
      setInterviewReviewLoading(null)
    }
  }

  function openConvertConfirm(dumId: string, name: string) {
    setPipelineConfirm({ kind: 'convert', dumId, name })
  }

  function openRejectConfirm(dumId: string, userId: string, name: string) {
    setPipelineConfirm({ kind: 'reject', dumId, userId, name })
  }

  function openArchiveConfirm(dumId: string, name: string) {
    setPipelineConfirm({ kind: 'archive', dumId, name })
  }

  function executePipelineConfirm() {
    if (!pipelineConfirm) return
    const { dumId } = pipelineConfirm
    const note = (finalizeNotes[dumId] || '').trim()
    switch (pipelineConfirm.kind) {
      case 'convert':
        void act(
          'convertToInstructor',
          { trainerId: dumId, ...(note ? { qualifyNote: note } : {}) },
          'Converted to instructor'
        )
        break
      case 'reject':
        void act(
          'rejectAndResetApplicant',
          {
            trainerId: dumId,
            userId: pipelineConfirm.userId,
            ...(note ? { qualifyNote: note } : {}),
          },
          'Applicant rejected and reset'
        )
        break
      case 'archive': {
        const archiving = tab === 'active'
        void act(
          'updateInstructorAsArchieve',
          { instructorId: dumId, isArchieved: archiving ? 'true' : 'false' },
          archiving ? 'Moved to archive' : 'Restored from archive'
        )
        break
      }
    }
    setPipelineConfirm(null)
  }

  function openApplicantEmailModal(r: Applicant, applicantName: string) {
    setEmailMsg('')
    setEmailModal({
      applicantName,
      to: String(r.emailId || '').trim(),
      cc: '',
      bcc: '',
      subject: 'Model Mugging Self Defense',
      body: applicantName,
    })
  }

  async function sendApplicantEmail() {
    if (!emailModal) return
    if (!emailModal.to.trim()) {
      setEmailMsg('To email is required.')
      return
    }
    if (!emailModal.subject.trim()) {
      setEmailMsg('Subject is required.')
      return
    }
    if (!emailModal.body.trim()) {
      setEmailMsg('Email body is required.')
      return
    }
    setEmailSending(true)
    setEmailMsg('')
    try {
      const bodyText = emailModal.body.trim()
      const res = await postAdminEmailSend({
        to: emailModal.to.trim(),
        cc: emailModal.cc.trim() || undefined,
        bcc: emailModal.bcc.trim() || undefined,
        subject: emailModal.subject.trim(),
        text: bodyText,
        html: bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
        category: 'trainer-pipeline-applicant',
      })
      const data = (await res.json().catch(() => ({}))) as { transportOk?: boolean }
      if (!res.ok) throw new Error('Send failed')
      setEmailMsg(data.transportOk === false ? 'Logged; SMTP may not be configured.' : 'Email sent.')
      setTimeout(() => {
        setEmailModal(null)
        setEmailMsg('')
      }, 1200)
    } catch (e) {
      setEmailMsg(String((e as Error).message || e))
    }
    setEmailSending(false)
  }

  function saveInterviewSchedule(dumId: string) {
    const raw = (scheduledAt[dumId] || '').trim()
    if (!raw) {
      setDrawerMsg('Choose an interview date and time before saving.')
      setDrawerOk(false)
      return
    }
    const when = new Date(raw)
    if (Number.isNaN(when.getTime())) {
      setDrawerMsg('Invalid date and time.')
      setDrawerOk(false)
      return
    }
    void act('scheduleInterview', { trainerId: dumId, interviewDate: when.toISOString() }, 'Interview scheduled')
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Applicant pipeline"
        subtitle="Legacy trainersignuphistory flow: Contact (mm_contact_information) → Application → Interview → Assign interviewers & schedule (Manage drawer + tabs) → Tracker → Background → Physical → Equipment → Travel → T-shirt → Basic course → Expense pool → Convert. Click a status pill to open read-only submitted CRM data for that step (portal user id when set, otherwise instructor row id). Assign, schedule, and convert are in Manage."
        subtitleFullWidth
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pipeline summary</p>
            <p className="text-sm text-slate-600">Track bottlenecks and move applicants forward quickly.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {tab === 'archived' ? 'Archived view' : 'Active view'}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total applicants</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">Contact pending</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{summary.contactPending}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Interview pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{summary.interviewPending}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Tracker pending</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{summary.trackerPending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Ready to convert</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{summary.readyToConvert}</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="Search applicant, email, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as StageKey)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <option value="all">All stages</option>
            <option value="contact">Contact</option>
            <option value="application">Application</option>
            <option value="interview">Interview</option>
            <option value="tracker">Interview tracker</option>
            <option value="background">Background</option>
            <option value="physical">Physical</option>
            <option value="equipment">Equipment</option>
            <option value="travel">Travel</option>
            <option value="tshirt">T-shirt</option>
            <option value="basic">Basic course</option>
            <option value="expense">Expense pool</option>
          </select>
        </div>
      </section>

      <div className="mb-4">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {(
          [
            ['interviewer-selection', 'Interviewer Selection'],
            ['interview-coordination', 'Interview Coordination'],
            ['interview-tracker', 'Interview Tracker'],
            ['archives', 'Archives'],
          ] as [PipelineView, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPipelineView(id)
              setTab(id === 'archives' ? 'archived' : 'active')
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              pipelineView === id ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        </div>
      </div>

      {msg && <p className="mb-4 rounded-xl border border-slate-200 bg-amber-50 px-4 py-2 text-sm text-slate-800">{msg}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1240px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Applicant</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Application</th>
              <th className="p-3">Interview</th>
              <th className="p-3">Tracker</th>
              <th className="p-3">Background</th>
              <th className="p-3">Physical</th>
              <th className="p-3">Equipment</th>
              <th className="p-3">Travel</th>
              <th className="p-3">T-shirt</th>
              <th className="p-3">Basic</th>
              <th className="p-3">Expense</th>
              <th className="p-3">Manage</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const dumId = instructorTrainerId(r) || `row-${i}`
              const uid = instructorPortalUserId(r)
              const name = `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—'
              const assignedNames = Array.isArray((r as any).allInterviewerNames)
                ? ((r as any).allInterviewerNames as unknown[]).map(String).filter(Boolean).join(', ')
                : ''
              const interviewAt = (r as any).interviewScheduledDate
                ? new Date(String((r as any).interviewScheduledDate))
                : null
              const expanded = openId === dumId
              const note = interviewNote.trim()
              const progress = progressForApplicant(r)
              const workflowLocked = isConvertedApplicant(r)
              return (
                <Fragment key={`${dumId}-${i}`}>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                        type="button"
                        onClick={() => {
                          if (openId === dumId) setOpenId(null)
                          else openTrainerDrawer(dumId, r)
                        }}
                        className="text-left font-medium text-slate-900 hover:text-[#0d9488] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80 rounded-sm"
                      >
                        {name}
                          </button>
                          <button
                            type="button"
                            title="Send email to applicant"
                            onClick={() => openApplicantEmailModal(r, name)}
                            className="shrink-0 rounded-lg bg-amber-100 p-1.5 text-amber-700 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80"
                          >
                            <Mail className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Email applicant</span>
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{String(r.emailId || '—')}</p>
                      <div className="mt-2 w-36">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-teal-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="contact"
                        label="Contact information"
                        value={r.contactVerificationStatus}
                        onOpen={setSubmissionView}
                        tone={contactStageTone(r.contactVerificationStatus, r)}
                      >
                        {r.contactPhoneSnapshot != null && String(r.contactPhoneSnapshot).trim() ? (
                          <p className="text-[10px] text-slate-500">{String(r.contactPhoneSnapshot)}</p>
                        ) : null}
                      </StageOpenButton>
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="application"
                        label="Application"
                        value={r.applicationStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex max-w-[160px] flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!(uid.trim() || dumId.trim())}
                            title="View interview submission"
                            className="rounded-lg p-0.5 outline-none ring-teal-500/0 transition hover:bg-slate-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              setSubmissionView({
                                lookupId: uid.trim() || dumId.trim(),
                                name,
                                stage: 'interview',
                                label: 'Interview',
                              })
                            }
                          >
                            <InterviewStagePill v={interviewStatusForRow(r)} />
                          </button>
                          <button
                            type="button"
                            title="View admin notes"
                            onClick={() =>
                              setNotesView({
                                name,
                                note: applicantQualifyNote(r) || 'No admin notes recorded yet.',
                              })
                            }
                            className={`rounded p-0.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80 ${
                              applicantQualifyNote(r)
                                ? 'text-indigo-600 hover:text-indigo-800'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Admin notes</span>
                          </button>
                        </div>
                        {interviewAt && !Number.isNaN(interviewAt.getTime()) ? (
                          <p className="text-[10px] text-slate-500">{interviewAt.toLocaleString('en-US')}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="tracker"
                        label="Interview tracker"
                        value={r.instructorInterviewStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="background"
                        label="Background verification"
                        value={bgLegacyDoneLabel(r.bgVerificationStatus)}
                        tone={stageCompact(r.bgVerificationStatus) === 'successful' ? 'good' : 'neutral'}
                        onOpen={setSubmissionView}
                      >
                        {bgPaymentHint(r.bgVerificationStatus) && (
                          <p className="mt-1 max-w-[140px] text-[10px] leading-snug text-amber-800">{bgPaymentHint(r.bgVerificationStatus)}</p>
                        )}
                      </StageOpenButton>
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="physical"
                        label="Physical verification"
                        value={r.physicalVerificationStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="equipment"
                        label="Equipment"
                        value={r.equipmentStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="travel"
                        label="Travel"
                        value={r.travelInfoStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="tshirt"
                        label="T-shirt / uniform"
                        value={r.tShirtStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="basic"
                        label="Basic course"
                        value={r.basicCourseStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      <StageOpenButton
                        lookupId={uid.trim() || dumId.trim()}
                        applicantName={name}
                        stage="expense"
                        label="Expense pool"
                        value={r.expensePoolStatus}
                        onOpen={setSubmissionView}
                      />
                    </td>
                    <td className="p-3">
                      {assignedNames && <p className="mb-1 text-[10px] text-slate-500">{assignedNames}</p>}
                      {interviewAt && !Number.isNaN(interviewAt.getTime()) && (
                        <p className="mb-1 text-[10px] text-slate-500">{interviewAt.toLocaleString('en-US')}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (expanded) setOpenId(null)
                          else openTrainerDrawer(dumId, r)
                        }}
                        className="text-xs font-bold text-[#0d9488] hover:underline"
                      >
                        {expanded ? 'Close' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={13} className="p-0">
                        <div className="fixed inset-0 z-[230]">
                          <div className="absolute inset-0 bg-slate-900/40" onClick={() => { setOpenId(null); setDrawerMsg('') }} />
                          <div className="absolute inset-y-0 right-0 w-full max-w-[920px] overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 shadow-2xl sm:p-6">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trainer workflow</p>
                                <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                                <p className="text-xs text-slate-500">{String(r.emailId || '—')}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setOpenId(null); setDrawerMsg('') }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
                              >
                                Close
                              </button>
                            </div>
                            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
                              <div className="mb-1 flex items-center justify-between text-xs text-teal-800">
                                <span className="font-semibold">Onboarding progress</span>
                                <span className="font-bold">{progress}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-teal-100">
                                <div className="h-2 rounded-full bg-teal-600" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                        {workflowLocked && (
                          <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-950">
                            <p className="font-semibold">Converted to instructor (read-only)</p>
                            <p className="mt-1 text-indigo-900/90">
                              Legacy marks this record Completed. Updates are disabled here; view the roster under{' '}
                              <Link href="/portal/admin/instructors" className="font-bold underline">
                                Instructors
                              </Link>
                              . Use the Archives tab to review converted applicants.
                            </p>
                          </div>
                        )}
                        {drawerMsg && (
                          <p
                            className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
                              drawerOk
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                          >
                            {drawerMsg}
                          </p>
                        )}
                        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact (portal / CRM)</p>
                          <dl className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                            <div>
                              <dt className="text-slate-500">Verification</dt>
                              <dd className="font-medium">{stageText(r.contactVerificationStatus)}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Phone</dt>
                              <dd className="font-medium">
                                {String(r.contactPhoneSnapshot || r.contactNumber || '—')}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-slate-500">Address</dt>
                              <dd className="font-medium whitespace-pre-wrap">
                                {String(r.contactAddressSnapshot || r.address || '—')}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">City / State / ZIP</dt>
                              <dd className="font-medium">
                                {[r.city, r.state, r.zipCode].filter(Boolean).map(String).join(', ') || '—'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <div className="mb-4">
                          <label className="text-xs font-bold text-slate-600">Interview note (optional)</label>
                          <input
                            className="mt-1 w-full max-w-lg rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={interviewNote}
                            onChange={(e) => setInterviewNote(e.target.value)}
                            placeholder="qualify note"
                          />
                        </div>
                        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                          <button
                            type="button"
                            onClick={() => toggleInterviewQa(dumId)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg text-left outline-none ring-indigo-500/0 hover:bg-indigo-100/50 focus-visible:ring-2"
                            aria-expanded={!!interviewQaExpanded[dumId]}
                          >
                            <span className="text-xs font-bold uppercase text-indigo-700">
                              Interview Q&amp;A (read-only)
                            </span>
                            <span className="flex items-center gap-2 text-[11px] font-semibold text-indigo-800">
                              {interviewQaExpanded[dumId] ? 'Hide' : 'Show questions & answers'}
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 transition-transform ${interviewQaExpanded[dumId] ? 'rotate-180' : ''}`}
                                aria-hidden
                              />
                            </span>
                          </button>
                          {interviewQaExpanded[dumId] ? (
                            <div className="mt-3 border-t border-indigo-200/80 pt-3">
                              <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={interviewReviewLoading === dumId}
                                  onClick={() => void loadInterviewReview(dumId)}
                                  className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800 disabled:opacity-50"
                                >
                                  {interviewReviewLoading === dumId ? 'Loading…' : 'Refresh'}
                                </button>
                              </div>
                              {interviewReviewLoading === dumId && !interviewReviewByTrainer[dumId] ? (
                                <p className="text-sm text-slate-600">Loading interview responses…</p>
                              ) : (
                                <AdminInterviewQaReadOnly
                                  bundle={interviewReviewByTrainer[dumId] as InterviewReviewBundle | undefined}
                                  compact
                                />
                              )}
                            </div>
                          ) : null}
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">1) Application gate</p>
                            <div className="flex items-end gap-2">
                              <select
                                value={applicationDraft[dumId] || 'Approved'}
                                onChange={(e) => setApplicationDraft((p) => ({ ...p, [dumId]: e.target.value }))}
                                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                              >
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button
                                type="button"
                                disabled={!!busy || workflowLocked}
                                onClick={() =>
                                  act('updateApplicationStatus', { trainerId: dumId, status: applicationDraft[dumId] || 'Approved' }, 'Application updated')
                                }
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                              >
                                Save
                              </button>
                            </div>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">2) Interview decision</p>
                            <div className="grid gap-2">
                              <select
                                value={interviewDraft[dumId] || 'Pending'}
                                onChange={(e) => setInterviewDraft((p) => ({ ...p, [dumId]: e.target.value }))}
                                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Qualified">Qualified</option>
                                <option value="NotQualified">NotQualified</option>
                              </select>
                              <button
                                type="button"
                                disabled={!!busy || workflowLocked}
                                onClick={() =>
                                  act(
                                    'updateTrainerInterviewStatus',
                                    { trainerId: dumId, status: interviewDraft[dumId] || 'Pending', ...(note ? { qualifyNote: note } : {}) },
                                    'Interview decision updated'
                                  )
                                }
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                              >
                                Save
                              </button>
                            </div>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">3) Interviewer assignment</p>
                            <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
                              Choose one or more <strong>completed instructors</strong> (legacy: Assign Interviewer), then{' '}
                              <strong>Save assignment</strong>. Set the interview date/time in step 4. After assignment, the applicant
                              moves to the <strong>Interview Coordination</strong> tab.
                            </p>
                            {assignedNames && (
                              <p className="mb-2 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1.5 text-[11px] text-teal-900">
                                Currently assigned: <span className="font-semibold">{assignedNames}</span>
                              </p>
                            )}
                            {(() => {
                              const options = interviewers
                                .map((iv, idx) => {
                                  const id = instructorTrainerId(iv) || `iv-${idx}`
                                  const label =
                                    `${String(iv.firstName || '')} ${String(iv.lastName || '')}`.trim() ||
                                    String(iv.emailId || id)
                                  return { id, label }
                                })
                                .filter((o) => o.id && o.id !== dumId)
                              const selected = selectedInterviewers[dumId] || []
                              if (options.length === 0) {
                                return (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
                                    <p className="font-semibold">No interviewers in the list</p>
                                    <p className="mt-1">
                                      Interviewers must be instructors with <strong>Completed</strong> status (see{' '}
                                      <Link href="/portal/admin/instructors" className="font-bold text-[#0d9488] underline">
                                        Instructor Management → Active instructors
                                      </Link>
                                      ). Convert a trainee or add another completed instructor, then return here.
                                    </p>
                                  </div>
                                )
                              }
                              return (
                                <>
                                  <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                                    {options.map((o) => {
                                      const checked = selected.includes(o.id)
                                      return (
                                        <li key={o.id}>
                                          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-white">
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() => {
                                                setSelectedInterviewers((prev) => {
                                                  const cur = prev[dumId] || []
                                                  const next = checked
                                                    ? cur.filter((x) => x !== o.id)
                                                    : [...cur, o.id]
                                                  return { ...prev, [dumId]: next }
                                                })
                                              }}
                                              className="rounded border-slate-300"
                                            />
                                            <span className="font-medium text-slate-800">{o.label}</span>
                                          </label>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    {selected.length === 0
                                      ? 'Select at least one interviewer.'
                                      : `${selected.length} selected`}
                                  </p>
                                </>
                              )
                            })()}
                            <button
                              type="button"
                              disabled={!!busy || workflowLocked || (selectedInterviewers[dumId] || []).length === 0}
                              onClick={() =>
                                act(
                                  'assignInterviewers',
                                  {
                                    trainerId: dumId,
                                    interviewerIds: (selectedInterviewers[dumId] || []).join(','),
                                  },
                                  'Interviewers assigned'
                                )
                              }
                              className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                              Save assignment
                            </button>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">4) Coordination + tracker</p>
                            <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
                              Two separate saves (legacy): <strong>Save interview schedule</strong> stores date/time and notifies
                              participants; <strong>Save tracker status</strong> records the outcome after the interview.
                            </p>
                            {formatInterviewScheduledDisplay(r) && (
                              <p className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50/80 px-2 py-1.5 text-xs text-emerald-900">
                                Saved schedule: {formatInterviewScheduledDisplay(r)}
                                {interviewStatusForRow(r) ? ` · Status: ${stageText(interviewStatusForRow(r))}` : ''}
                              </p>
                            )}
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Interview date & time</p>
                            <input
                              type="datetime-local"
                              value={scheduledAt[dumId] || ''}
                              onChange={(e) => setScheduledAt((prev) => ({ ...prev, [dumId]: e.target.value }))}
                              className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                disabled={!!busy || workflowLocked || !(scheduledAt[dumId] || '').trim()}
                                onClick={() => saveInterviewSchedule(dumId)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"
                              >
                                Save interview schedule
                              </button>
                            </div>
                            <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              Interview tracker status
                            </p>
                            <div className="flex gap-2">
                              <select
                                value={trackerDraft[dumId] || 'Pending'}
                                onChange={(e) => setTrackerDraft((p) => ({ ...p, [dumId]: e.target.value }))}
                                className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Successful">Successful</option>
                                <option value="Unsuccessful">Unsuccessful</option>
                              </select>
                              <button
                                type="button"
                                disabled={!!busy || workflowLocked}
                                onClick={() => act('updateInterviewTrackerStatus', { trainerId: dumId, status: trackerDraft[dumId] || 'Pending' }, 'Tracker status updated')}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                              >
                                Save tracker status
                              </button>
                            </div>
                          </section>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-3">
                          {uid && (
                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">5) Background (read-only)</p>
                              <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
                                Legacy <strong>Instructor Applications</strong> does not let staff approve background here.
                                The applicant pays the investigator fee, then the{' '}
                                <Link href="/portal/admin/bg-verification" className="font-semibold text-[#0d9488] hover:underline">
                                  BG verification queue
                                </Link>{' '}
                                sets Successful / Unsuccessful.
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                Status: {stageText(r.bgVerificationStatus)} ({bgLegacyDoneLabel(r.bgVerificationStatus)})
                              </p>
                              {bgPaymentHint(r.bgVerificationStatus) && (
                                <p className="mt-2 text-[11px] text-amber-800">{bgPaymentHint(r.bgVerificationStatus)}</p>
                              )}
                            </section>
                          )}

                          <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">6) Verification stages</p>
                            <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
                              Mark <strong>Done</strong> only after the applicant has submitted that step in the portal (legacy uses
                              submitted dates). Physical and shirt orders have no background-style investigator payment in legacy.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {VERIFICATION_STAGE_META.map(({ key, label, op, submittedKey, statusKey }) => {
                                const submitted = pipelineStageSubmitted(r, submittedKey, statusKey)
                                return (
                                <div key={key} className="rounded-lg border border-slate-200 p-2">
                                  <p className="mb-1 text-[11px] font-semibold text-slate-600">{label}</p>
                                  {!submitted && (
                                    <p className="mb-1 text-[10px] text-amber-800">Waiting for applicant submission</p>
                                  )}
                                  <div className="flex gap-1">
                                    <select
                                      value={(stageDraft[dumId] as any)?.[key] || 'Pending'}
                                      onChange={(e) =>
                                        setStageDraft((prev) => ({
                                          ...prev,
                                          [dumId]: { ...(prev[dumId] || { physical: 'Pending', equipment: 'Pending', travel: 'Pending', tshirt: 'Pending', basic: 'Pending', expense: 'Pending' }), [key]: e.target.value } as any,
                                        }))
                                      }
                                      disabled={!submitted}
                                      className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px] disabled:bg-slate-100"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Submitted">Submitted</option>
                                      <option value="Successful">Successful</option>
                                    </select>
                                    <button
                                      type="button"
                                      disabled={!!busy || workflowLocked || !submitted}
                                      title={!submitted ? 'Applicant must submit this form first' : undefined}
                                      onClick={() =>
                                        act(
                                          op,
                                          {
                                            trainerId: dumId,
                                            userId: uid,
                                            status: String((stageDraft[dumId] as any)?.[key] || 'Pending'),
                                          },
                                          `${label} updated`
                                        )
                                      }
                                      className="rounded bg-slate-900 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              )})}
                            </div>
                          </section>

                        </div>

                        <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">7) Finalize</p>
                          <p className="mb-3 text-[11px] leading-relaxed text-slate-600">
                            Legacy asks for confirmation before convert or reject. <strong>Qualified as instructor</strong>{' '}
                            requires every verification stage Successful (background after applicant payment and BG agent
                            approval). Notes are saved on the applicant record for staff reference.
                          </p>
                          {!isReadyToConvert(r) && !workflowLocked && (
                            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                              Not ready to convert: complete interview qualification, tracker, background (paid + BG agent),
                              and all verification stages below.
                            </p>
                          )}
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Admin notes / comments
                          </label>
                          <textarea
                            rows={3}
                            value={finalizeNotes[dumId] || ''}
                            onChange={(e) =>
                              setFinalizeNotes((prev) => ({ ...prev, [dumId]: e.target.value }))
                            }
                            placeholder="Internal notes for this applicant (optional)"
                            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
                          />
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <button
                              type="button"
                              disabled={!!busy || workflowLocked || !isReadyToConvert(r)}
                              title={
                                !isReadyToConvert(r)
                                  ? 'Legacy: all stages must be Successful and interview Qualified'
                                  : undefined
                              }
                              onClick={() => openConvertConfirm(dumId, name)}
                              className="w-full rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 sm:flex-1"
                            >
                              Convert to instructor
                            </button>
                            <button
                              type="button"
                              disabled={!!busy || workflowLocked || !uid}
                              onClick={() => openRejectConfirm(dumId, uid, name)}
                              className="w-full rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white sm:flex-1"
                            >
                              Reject and reset onboarding
                            </button>
                            <button
                              type="button"
                              disabled={!!busy || workflowLocked}
                              onClick={() => openArchiveConfirm(dumId, name)}
                              className="w-full rounded-lg border border-amber-600 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 sm:flex-1"
                            >
                              {tab === 'active' ? 'Move to archive' : 'Restore from archive'}
                            </button>
                          </div>
                        </section>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {filteredRows.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{' '}
              <span className="font-semibold text-slate-900">{filteredRows.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-slate-800">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
        {filteredRows.length === 0 && (
          <div className="p-10 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-800">No applicants for this view</p>
              <p className="mt-2 text-sm text-slate-600">
                Try switching pipeline view, clearing filters, or searching with a different keyword.
              </p>
              {rows.length > 0 && (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold">{rows.length}</span> applicant{rows.length === 1 ? '' : 's'} loaded
                  for this list — they may be on another pipeline tab (e.g. after interviewers are assigned, use{' '}
                  <span className="font-semibold">Interview Coordination</span> or{' '}
                  <span className="font-semibold">Interview Tracker</span>
                  ), or hidden by the stage filter above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <AdminApplicantSubmissionModal
        open={submissionView != null}
        onClose={() => setSubmissionView(null)}
        applicantName={submissionView?.name ?? ''}
        lookupId={submissionView?.lookupId ?? ''}
        stage={submissionView?.stage ?? ''}
        stageLabel={submissionView?.label ?? ''}
      />

      {pipelineConfirm && (() => {
        const copy = pipelineConfirmCopy(pipelineConfirm, tab)
        return (
          <div className="fixed inset-0 z-[280]">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              aria-label="Close confirmation"
              onClick={() => setPipelineConfirm(null)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="pipeline-confirm-title"
                className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
              >
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className={`mb-3 inline-flex rounded-full p-2.5 ${copy.iconWrapClass}`}>
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 id="pipeline-confirm-title" className="text-lg font-bold text-slate-900">
                    {copy.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-700">{pipelineConfirm.name}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed text-slate-600">{copy.description}</p>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => setPipelineConfirm(null)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={executePipelineConfirm}
                    className={`rounded-lg px-4 py-2.5 text-sm font-bold ${copy.confirmClass}`}
                  >
                    {copy.confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {notesView && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close admin notes"
            onClick={() => setNotesView(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-notes-title"
              className="flex max-h-[min(90vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="admin-notes-title" className="text-lg font-bold text-slate-900">
                    Admin notes
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{notesView.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotesView(null)}
                  className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{notesView.note}</p>
              </div>
              <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setNotesView(null)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {emailModal && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close send email"
            onClick={() => setEmailModal(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="send-email-title"
              className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 id="send-email-title" className="text-lg font-bold text-slate-900">
                    Send email
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.applicantName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="grid gap-3 text-sm">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">To</span>
                    <input
                      type="email"
                      value={emailModal.to}
                      onChange={(e) => setEmailModal({ ...emailModal, to: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Cc</span>
                    <input
                      type="text"
                      value={emailModal.cc}
                      onChange={(e) => setEmailModal({ ...emailModal, cc: e.target.value })}
                      placeholder="Optional, comma-separated"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Bcc</span>
                    <input
                      type="text"
                      value={emailModal.bcc}
                      onChange={(e) => setEmailModal({ ...emailModal, bcc: e.target.value })}
                      placeholder="Optional, comma-separated"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Subject</span>
                    <input
                      type="text"
                      value={emailModal.subject}
                      onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Body</span>
                    <textarea
                      rows={10}
                      value={emailModal.body}
                      onChange={(e) => setEmailModal({ ...emailModal, body: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                      required
                    />
                  </label>
                  {emailMsg && (
                    <p
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        emailMsg.includes('sent')
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      {emailMsg}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={emailSending}
                  onClick={() => void sendApplicantEmail()}
                  className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {emailSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
