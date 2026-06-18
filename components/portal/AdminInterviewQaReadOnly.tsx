'use client'

import { humanizePersonLabel, humanizeQuestionLabel, looksLikeMongoId } from '@/lib/opaqueId'

export type InterviewReviewBundle = {
  questions?: Record<string, unknown>[]
  answers?: Record<string, unknown>[]
  comments?: Record<string, unknown>[]
  qaRows?: Record<string, unknown>[]
  error?: string
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function isFinalFlag(v: unknown): boolean {
  if (v === true) return true
  const s = str(v).toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

function normalizeQaRows(bundle: InterviewReviewBundle): Record<string, unknown>[] {
  const raw = bundle.qaRows
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((r) => str(r._section) !== 'comments') as Record<string, unknown>[]
  }
  const questions = Array.isArray(bundle.questions) ? bundle.questions : []
  const answers = Array.isArray(bundle.answers) ? bundle.answers : []
  const qText = new Map<string, string>()
  for (const q of questions) {
    const qid = str(q.questionId) || str(q._id)
    const raw = str(q.question) || str(q.text)
    qText.set(qid, raw && !looksLikeMongoId(raw) ? raw : '')
  }
  const rows: Record<string, unknown>[] = []
  const sortedQ = [...questions].sort(
    (a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
  )
  for (const q of sortedQ) {
    const qid = str(q.questionId) || str(q._id)
    const matching = answers.filter((a) => str(a.questionId) === qid)
    if (matching.length === 0) {
      rows.push({
        questionId: qid,
        questionText: qText.get(qid) || '',
        answer: '',
        hasAnswer: false,
      })
      continue
    }
    for (const a of matching) {
      rows.push({
        questionId: qid,
        questionText: qText.get(qid) || str(a.questionText) || qid,
        answer: str(a.answer),
        interviewerDisplay: str(a.interviewerDisplay) || str(a.interviewerId),
        finalSubmission: a.finalSubmission,
        hasAnswer: Boolean(str(a.answer)),
      })
    }
  }
  for (const a of answers) {
    const qid = str(a.questionId)
    if (rows.some((r) => str(r.questionId) === qid && str(r.interviewerId) === str(a.interviewerId))) {
      continue
    }
    if (!rows.some((r) => str(r.questionId) === qid && str(r.answer) === str(a.answer))) {
      rows.push({
        questionId: qid,
        questionText: str(a.questionText) && !looksLikeMongoId(a.questionText) ? str(a.questionText) : qText.get(qid) || '',
        answer: str(a.answer),
        interviewerDisplay: str(a.interviewerDisplay) || str(a.interviewerId),
        finalSubmission: a.finalSubmission,
        hasAnswer: Boolean(str(a.answer)),
      })
    }
  }
  return rows
}

function normalizeComments(bundle: InterviewReviewBundle): Record<string, unknown>[] {
  const raw = bundle.qaRows
  if (Array.isArray(raw)) {
    const section = raw.find((r) => str(r._section) === 'comments') as Record<string, unknown> | undefined
    if (section && Array.isArray(section.comments)) {
      return section.comments as Record<string, unknown>[]
    }
  }
  return Array.isArray(bundle.comments) ? bundle.comments : []
}

export default function AdminInterviewQaReadOnly({
  bundle,
  compact = false,
}: {
  bundle: InterviewReviewBundle | null | undefined
  compact?: boolean
}) {
  if (!bundle) {
    return <p className="text-sm text-slate-500">No interview data loaded.</p>
  }
  if (bundle.error) {
    return <p className="text-sm text-red-700">{bundle.error}</p>
  }

  const qaRows = normalizeQaRows(bundle)
  const comments = normalizeComments(bundle)
  const answered = qaRows.filter((r) => r.hasAnswer !== false && str(r.answer)).length

  if (qaRows.length === 0 && comments.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        No interview answers have been submitted for this applicant yet.
      </p>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <p className="text-xs text-slate-600">
        {answered} of {qaRows.length} question{qaRows.length === 1 ? '' : 's'} answered
        {comments.length > 0 ? ` · ${comments.length} interviewer comment${comments.length === 1 ? '' : 's'}` : ''}
      </p>

      {comments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">Interviewer comments</p>
          {comments.map((c, ci) => (
            <div key={ci} className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm">
              <p className="font-semibold text-indigo-900">
                {humanizePersonLabel(c.interviewerDisplay, c.interviewerId) || 'Interviewer'}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Recommendation: {str(c.recommendedApproval) || '—'}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{str(c.instructorComment) || '—'}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Questions &amp; answers</p>
        {qaRows.map((row, i) => {
          const hasAnswer = row.hasAnswer !== false && Boolean(str(row.answer))
          return (
            <div
              key={`${str(row.questionId)}-${i}`}
              className={`rounded-xl border px-3 py-3 ${hasAnswer ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {humanizeQuestionLabel(row.questionText, i)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {humanizePersonLabel(row.interviewerDisplay, row.interviewerId) ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                      {humanizePersonLabel(row.interviewerDisplay, row.interviewerId)}
                    </span>
                  ) : null}
                  {isFinalFlag(row.finalSubmission) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Final
                    </span>
                  ) : hasAnswer ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Draft
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                {hasAnswer ? str(row.answer) : '— No answer submitted —'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
