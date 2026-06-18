'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmView,
  fetchInstructorInterviewAnswers,
  fetchInstructorInterviewComment,
  fetchInstructorInterviewQuestions,
  fetchMe,
  getToken,
  saveInstructorInterviewAnswers,
  saveInstructorInterviewComment,
  type MeUser,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow, legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Row = Record<string, unknown>

function isFinalSubmissionFlag(v: unknown): boolean {
  if (v === true) return true
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

function questionKey(q: Row, idx: number): string {
  const raw = q.questionId
  if (raw != null && String(raw).trim()) return String(raw).trim()
  const oid = q._id
  if (oid && typeof oid === 'object' && oid !== null && '$oid' in oid) return String((oid as { $oid: string }).$oid)
  if (typeof oid === 'string') return oid
  return `Q${idx + 1}`
}

export default function InstructorInterviewsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [candidates, setCandidates] = useState<Row[]>([])
  const [questions, setQuestions] = useState<Row[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [comment, setComment] = useState('')
  const [recommendation, setRecommendation] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/interviews')
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
    Promise.all([fetchInstructorCrmView('interviews'), fetchInstructorInterviewQuestions()])
      .then(([cs, qs]) => {
        setCandidates(legacyAsObjectArray(cs))
        setQuestions(legacyAsObjectArray(qs))
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  useEffect(() => {
    if (!selectedApplicant) {
      setIsFinalSubmitted(false)
      return
    }
    Promise.all([
      fetchInstructorInterviewAnswers(selectedApplicant),
      fetchInstructorInterviewComment(selectedApplicant),
    ])
      .then(([rows, commentDoc]) => {
        const answerRows = legacyAsObjectArray(rows)
        const locked = answerRows.some((r) => isFinalSubmissionFlag(r.finalSubmission))
        setIsFinalSubmitted(locked)
        const mapped: Record<string, string> = {}
        answerRows.forEach((r) => {
          const qid = String(r.questionId || '')
          if (qid) mapped[qid] = String(r.answer || '')
        })
        setAnswers(mapped)
        setComment(String(commentDoc.instructorComment || ''))
        const rec = String(commentDoc.recommendedApproval || '').toUpperCase()
        if (rec.includes('NOT')) setRecommendation('NOT_RECOMMENDED')
        else if (rec.includes('RECOMMEND') || rec === 'YES' || rec === 'TRUE') setRecommendation('RECOMMENDED')
        else setRecommendation('PENDING')
      })
      .catch(() => {
        setIsFinalSubmitted(false)
        setAnswers({})
        setComment('')
        setRecommendation('PENDING')
      })
  }, [selectedApplicant])

  const sortedQuestions = useMemo(
    () =>
      [...questions].sort(
        (a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)
      ),
    [questions]
  )
  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter((c) => JSON.stringify(c).toLowerCase().includes(q))
  }, [candidates, search])
  const answeredCount = Object.values(answers).filter((v) => String(v || '').trim().length > 0).length

  const readOnly = isFinalSubmitted

  async function save(finalSubmission: boolean) {
    if (!selectedApplicant) {
      setErr('Pick an applicant first.')
      return
    }
    if (readOnly) {
      setErr('Final submission already completed. This interview is read-only.')
      return
    }
    setErr('')
    setMsg('')
    const payload = sortedQuestions.map((q, idx) => {
      const qid = questionKey(q, idx)
      return {
        questionId: qid,
        answer: answers[qid] || '',
        displayOrder: Number(q.displayOrder || idx + 1),
      }
    })
    const resComment = await saveInstructorInterviewComment({
      applicantId: selectedApplicant,
      instructorComment: comment,
      recommendedApproval: recommendation,
    })
    if (!resComment.ok) {
      let errText = await resComment.text()
      try {
        const j = JSON.parse(errText) as { error?: string }
        if (j.error) errText = j.error
      } catch {
        /* plain text */
      }
      setErr(errText || 'Failed to save comment.')
      return
    }
    const res = await saveInstructorInterviewAnswers({
      applicantId: selectedApplicant,
      finalSubmission,
      answers: payload,
    })
    if (!res.ok) {
      let errText = await res.text()
      try {
        const j = JSON.parse(errText) as { error?: string }
        if (j.error) errText = j.error
      } catch {
        /* plain text */
      }
      setErr(
        finalSubmission
          ? errText || 'Comment saved; final answer submission failed.'
          : errText || 'Comment saved; failed to save answers.',
      )
      return
    }
    if (finalSubmission) {
      setIsFinalSubmitted(true)
      setMsg('Final interview submitted. Answers are now locked.')
    } else {
      setMsg('Draft saved.')
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Interview workspace"
        subtitle="Interview queue with structured response drafting, recommendation, and final submission."
      />
      {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assigned applicants</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{candidates.length}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Question count</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{sortedQuestions.length}</p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">Answered now</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{answeredCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Stage / recommendation</p>
            <p className="mt-1 text-sm font-bold text-amber-900">
              {!selectedApplicant ? '—' : readOnly ? 'Final submitted' : 'Draft (editable)'}
            </p>
            {selectedApplicant ? (
              <p className="mt-0.5 text-xs text-amber-800">Recommendation: {recommendation}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Search applicant
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, id..."
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Applicant
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={selectedApplicant}
              onChange={(e) => setSelectedApplicant(e.target.value)}
            >
              <option value="">Select assigned applicant</option>
              {filteredCandidates.map((c, i) => {
                const id = coerceMongoIdFromRow(c) || String(c.userId || i)
                const name = `${String(c.firstName || '')} ${String(c.lastName || '')}`.trim() || id
                return (
                  <option key={`${id}-${i}`} value={id}>
                    {name}
                  </option>
                )
              })}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        {sortedQuestions.length === 0 ? (
          <p className="text-sm text-slate-600">
            No interview questions are configured yet. Admin can add them under{' '}
            <span className="font-semibold">Admin → Interview Questions</span>; they will appear here automatically.
          </p>
        ) : (
          sortedQuestions.map((q, idx) => {
            const qid = questionKey(q, idx)
            const text = String(q.question || q.text || `Question ${idx + 1}`)
            return (
              <label key={qid} className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">{text}</span>
                <textarea
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  rows={3}
                  value={answers[qid] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [qid]: e.target.value }))}
                />
              </label>
            )
          })
        )}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Recommendation
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            value={recommendation}
            disabled={readOnly}
            onChange={(e) => setRecommendation(e.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="NOT_RECOMMENDED">Not recommended</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Interviewer comment
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
            rows={3}
            value={comment}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={readOnly || !selectedApplicant}
          className="rounded bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={readOnly || !selectedApplicant}
          className="rounded bg-[#0d9488] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Final submit
        </button>
      </div>
    </>
  )
}
