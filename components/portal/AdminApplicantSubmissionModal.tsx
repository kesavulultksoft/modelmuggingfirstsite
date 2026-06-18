'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchAdminTrainerApplicantSubmission,
  fetchAdminTrainerInterviewReview,
} from '@/lib/portalApi'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { looksLikeMongoId } from '@/lib/opaqueId'
import AdminInterviewQaReadOnly, { type InterviewReviewBundle } from '@/components/portal/AdminInterviewQaReadOnly'

export type AdminApplicantSubmissionModalProps = {
  open: boolean
  onClose: () => void
  applicantName: string
  /** Portal `userId` or trainer row id (`dumId` / `_id` hex); server resolves to portal user when needed. */
  lookupId: string
  stage: string
  stageLabel: string
}

/** Keys to omit from admin-facing submission drawers (IDs, versions, opaque tokens). */
const HIDDEN_FIELD_KEYS = new Set(
  [
    '_id',
    'id',
    '__v',
    'v',
    'userId',
    'dumId',
    'dum_id',
    'trainerId',
    'applicantId',
    'interviewerId',
    'questionId',
    'courseId',
    'enrollmentId',
    'studentUserId',
    'parentId',
    'instructorId',
    'createdByUserId',
    'equipmentId',
    'inventoryTypeId',
    'templateId',
    'formId',
    'subscriptionId',
    'leadToken',
    'sourceLeadToken',
    'linkedUserId',
    'applicantidaliases',
    'qarows',
    'lookupkey',
    'interviewerid',
    'questiontext',
    'hasanswer',
    'finalsubmission',
    'displayorder',
    'submitteddate',
    'scheduledate',
    'createddate',
    'updatedat',
    'createdat',
    '_section',
    'stripePaymentIntentId',
    'stripePaymentIntentAdditionalId',
    'paymentIntentId',
    'transactionId',
    'password',
    'passwordHash',
    'fileData',
  ].map((k) => k.toLowerCase()),
)

function shouldSkipKey(k: string): boolean {
  if (k === '__proto__') return true
  if (k === '_class') return true
  const kl = k.toLowerCase()
  if (kl.startsWith('_') && kl !== '_') return true
  if (HIDDEN_FIELD_KEYS.has(kl)) return true
  return false
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function isMongoOidWrapper(val: unknown): val is { $oid: string } {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false
  const o = val as Record<string, unknown>
  return typeof o.$oid === 'string' && Object.keys(o).length <= 2
}

function isMongoDateWrapper(val: unknown): val is { $date: string } {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false
  const o = val as Record<string, unknown>
  return typeof o.$date === 'string' && Object.keys(o).length <= 2
}

function formatIsoOrNumberToDisplay(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw > 1e12 ? raw : raw * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  }
  const s = String(raw).trim()
  if (!s) return ''
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return s
}

/** Turn BSON-ish date objects and `{ timestamp, date }` pairs into a single readable line — never JSON. */
function formatDateLikeObject(obj: Record<string, unknown>): string | null {
  if (isMongoDateWrapper(obj)) {
    return formatIsoOrNumberToDisplay(obj.$date)
  }
  const dateVal = obj.date ?? obj.createdDate ?? obj.updatedAt ?? obj.sentOn ?? obj.completedDate
  if (dateVal != null && String(dateVal).trim() !== '') {
    return formatIsoOrNumberToDisplay(dateVal)
  }
  const ts = obj.timestamp
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    return formatIsoOrNumberToDisplay(ts)
  }
  return null
}

const MAX_DISPLAY_DEPTH = 8

function renderAdminFieldValue(val: unknown, depth: number): ReactNode {
  if (val == null || val === '') {
    return <span className="text-slate-400">—</span>
  }
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    if (typeof val === 'string' && looksLikeMongoId(val)) {
      return <span className="text-slate-400">—</span>
    }
    return <span className="whitespace-pre-wrap text-slate-900">{String(val)}</span>
  }

  if (depth >= MAX_DISPLAY_DEPTH) {
    return <span className="text-slate-500 italic">(nested data — see surrounding fields)</span>
  }

  if (isMongoOidWrapper(val)) {
    return <span className="text-slate-400">—</span>
  }
  if (isMongoDateWrapper(val)) {
    return <span className="text-slate-900">{formatIsoOrNumberToDisplay(val.$date)}</span>
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-400">—</span>
    return (
      <ul className="list-disc space-y-2 pl-4 text-slate-900">
        {val.map((item, i) => (
          <li key={i} className="text-sm">
            {renderAdminFieldValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  const rec = asRecord(val)
  if (rec) {
    const dateLine = formatDateLikeObject(rec)
    const temporalKeys = new Set(['timestamp', 'date', 'createddate', 'updatedat', 'completeddate', 'senton', 'createdat'])
    if (
      dateLine &&
      Object.keys(rec).every((k) => shouldSkipKey(k) || temporalKeys.has(k.toLowerCase()))
    ) {
      return <span className="text-slate-900">{dateLine}</span>
    }
    const entries = Object.entries(rec).filter(([k]) => !shouldSkipKey(k))
    if (entries.length === 0) {
      return <span className="text-slate-400">—</span>
    }
    return (
      <dl className="mt-1 space-y-2 border-l-2 border-slate-200 pl-3 text-sm">
        {entries.map(([k, v]) => {
          if (v == null || v === '') return null
          const nested = asRecord(v)
          const temporalOnly =
            nested &&
            formatDateLikeObject(nested) &&
            Object.keys(nested)
              .filter((nk) => !shouldSkipKey(nk))
              .every((nk) => temporalKeys.has(nk.toLowerCase()))
          return (
            <div key={k}>
              <dt className="text-xs font-semibold text-slate-500">{labelForFormField(k)}</dt>
              <dd className="text-slate-900">
                {temporalOnly && nested ? formatDateLikeObject(nested) : renderAdminFieldValue(v, depth + 1)}
              </dd>
            </div>
          )
        })}
      </dl>
    )
  }

  return <span className="text-slate-900">{String(val)}</span>
}

const NESTED_SECTION_KEYS = new Set(['contactInformationForm', 'trainerPortalApplication', 'review'])

function SubmissionFields({
  data,
  excludeKeys,
}: {
  data: Record<string, unknown>
  excludeKeys?: Set<string>
}) {
  const keys = useMemo(() => {
    return Object.keys(data)
      .filter((k) => !shouldSkipKey(k))
      .filter((k) => !(excludeKeys?.has(k) ?? false))
      .sort((a, b) => a.localeCompare(b))
  }, [data, excludeKeys])

  const visibleRows = keys
    .map((k) => {
      const val = data[k]
      if (val == null || val === '') return null
      return { k, val }
    })
    .filter(Boolean) as { k: string; val: unknown }[]

  if (visibleRows.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        No submission fields in this section yet.
      </p>
    )
  }

  return (
    <dl className="mt-3 space-y-3 text-sm">
      {visibleRows.map(({ k, val }) => {
        const label = labelForFormField(k)
        return (
          <div key={k} className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
            <dd className="min-w-0 flex-1">{renderAdminFieldValue(val, 0)}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function FormSubsection({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return null
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <SubmissionFields data={data} />
    </section>
  )
}

export default function AdminApplicantSubmissionModal({
  open,
  onClose,
  applicantName,
  lookupId,
  stage,
  stageLabel,
}: AdminApplicantSubmissionModalProps) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [payload, setPayload] = useState<Record<string, unknown>>({})
  const [interviewReview, setInterviewReview] = useState<InterviewReviewBundle | null>(null)

  useEffect(() => {
    if (!open || !lookupId.trim() || !stage.trim()) {
      setPayload({})
      setErr('')
      setInterviewReview(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setErr('')
    setPayload({})
    setInterviewReview(null)
    fetchAdminTrainerApplicantSubmission(lookupId, stage)
      .then((doc) => {
        if (cancelled) return
        const topErr = doc?.error != null ? String(doc.error) : ''
        const d = (doc?.data as Record<string, unknown>) || {}
        setPayload(d)
        if (topErr) setErr(topErr)
      })
      .catch(() => {
        if (cancelled) return
        setErr('Could not load submission details.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, lookupId, stage])

  const embeddedReview = useMemo(() => asRecord(payload.review), [payload.review])

  useEffect(() => {
    if (!open || stage !== 'interview' || !lookupId.trim()) {
      setInterviewReview(null)
      return
    }
    const embedded = embeddedReview as InterviewReviewBundle | null
    const hasEmbedded =
      embedded &&
      ((Array.isArray(embedded.qaRows) && embedded.qaRows.length > 0) ||
        (Array.isArray(embedded.answers) && embedded.answers.length > 0))
    if (hasEmbedded) {
      setInterviewReview(embedded)
      return
    }
    let cancelled = false
    fetchAdminTrainerInterviewReview(lookupId)
      .then((b) => {
        if (!cancelled) setInterviewReview(b as InterviewReviewBundle)
      })
      .catch(() => {
        if (!cancelled) setInterviewReview(embedded || null)
      })
    return () => {
      cancelled = true
    }
  }, [open, lookupId, stage, embeddedReview])

  const titleName = applicantName.trim() || 'Applicant'

  const contactForm = asRecord(payload.contactInformationForm)
  const trainerApp = asRecord(payload.trainerPortalApplication)
  const questionnaire = trainerApp ? asRecord(trainerApp.questionnaire) : null
  const review =
    stage === 'interview' && interviewReview
      ? interviewReview
      : (embeddedReview as InterviewReviewBundle | null)

  const trainerAppSansQuestionnaire: Record<string, unknown> | null = trainerApp
    ? (Object.fromEntries(Object.entries(trainerApp).filter(([k]) => k !== 'questionnaire')) as Record<string, unknown>)
    : null

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[280]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant submission</p>
            <h2 id="submission-drawer-title" className="truncate text-lg font-bold text-slate-900">
              {stageLabel}
            </h2>
            <p className="truncate text-xs text-slate-500">{titleName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && Object.keys(payload).length === 0 ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  Refreshing from server…
                </p>
              ) : null}
              {err ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
              ) : null}

              {!err ? (
                <>
                  <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-teal-800">Read-only</h3>
                    <p className="mt-2 text-sm text-teal-950/90">
                      CRM snapshot for pipeline stage <span className="font-semibold">{stageLabel}</span>. Values are
                      shown in plain language; internal IDs and raw JSON are omitted.
                    </p>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Summary fields</h3>
                    <SubmissionFields data={payload} excludeKeys={NESTED_SECTION_KEYS} />
                  </section>

                  {stage !== 'interview' ? (
                    <>
                      <FormSubsection title="Contact form (mm_contact_information)" data={contactForm} />
                      <FormSubsection
                        title="Trainer portal application (mm_trainer_applications)"
                        data={trainerAppSansQuestionnaire}
                      />
                    </>
                  ) : null}

                  {stage !== 'interview' && questionnaire && Object.keys(questionnaire).length > 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Questionnaire (nested)</h3>
                      <SubmissionFields data={questionnaire} />
                    </section>
                  ) : null}

                  {stage === 'interview' ? (
                    <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-800">
                        Interview Q&amp;A (read-only)
                      </h3>
                      <div className="mt-3">
                        <AdminInterviewQaReadOnly bundle={(review as InterviewReviewBundle) || null} />
                      </div>
                    </section>
                  ) : review && Object.keys(review).length > 0 ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Interview review bundle</h3>
                      <AdminInterviewQaReadOnly bundle={review as InterviewReviewBundle} compact />
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
