'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchMe,
  fetchTrainerApplication,
  getToken,
  patchTrainerApplication,
  type MeUser,
} from '@/lib/portalApi'
import { formatInstructorGenderDisplay } from '@/lib/gender'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type LeadSnap = Record<string, unknown> | null

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export default function InstructorTrainerApplicationPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/trainer-application')
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
    setLoading(true)
    fetchTrainerApplication()
      .then((d) => {
        setDoc(d)
        const q = asRecord(d.questionnaire)
        const existing = q?.additionalNotes
        setAdditionalNotes(typeof existing === 'string' ? existing : '')
        setErr('')
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Could not load application'))
      .finally(() => setLoading(false))
  }, [me])

  async function saveNotes(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const updated = await patchTrainerApplication({ additionalNotes })
      setDoc(updated)
      setMsg('Saved.')
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const questionnaire = asRecord(doc?.questionnaire)
  const lead: LeadSnap = questionnaire ? (asRecord(questionnaire.lead) as LeadSnap) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <PortalPageHeader
        title="Trainer application"
        subtitle="Your public interest form is linked here when you register with the same email. Add draft notes below; full legacy-style sections can be added over time."
      />

      {loading ? (
        <p className="mt-8 text-sm text-slate-600">Loading…</p>
      ) : (
        <>
          {lead && Object.keys(lead).length > 0 ? (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">From your public form</h2>
              <dl className="mt-4 space-y-2 text-sm">
                {lead.firstName != null ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Name</dt>
                    <dd className="text-slate-900">
                      {String(lead.firstName || '')} {String(lead.lastName || '')}
                    </dd>
                  </div>
                ) : null}
                {lead.email != null ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Email</dt>
                    <dd className="text-slate-900">{String(lead.email)}</dd>
                  </div>
                ) : null}
                {lead.phone != null && formatUsPhoneDisplay(lead.phone) ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Phone</dt>
                    <dd className="text-slate-900">{formatUsPhoneDisplay(lead.phone)}</dd>
                  </div>
                ) : null}
                {lead.gender != null && formatInstructorGenderDisplay(lead.gender) !== '—' ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Gender</dt>
                    <dd className="text-slate-900">{formatInstructorGenderDisplay(lead.gender)}</dd>
                  </div>
                ) : null}
                {lead.locationIntent != null ? (
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Location</dt>
                    <dd className="text-slate-900">{String(lead.locationIntent)}</dd>
                  </div>
                ) : null}
                {lead.notes != null ? (
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                    <dt className="w-28 shrink-0 text-slate-500">Notes</dt>
                    <dd className="whitespace-pre-wrap text-slate-900">{String(lead.notes)}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : (
            <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No linked public lead on file. If you started on{' '}
              <a href="/apply/trainer" className="font-semibold underline">
                /apply/trainer
              </a>
              , use the same email when you registered, or submit the short form again before creating your account.
            </p>
          )}

          <form onSubmit={saveNotes} className="mt-10 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Portal questionnaire (draft)</h2>
            <p className="text-sm text-slate-600">
              This page is the secure home for the longer application. For now, use the field below to save draft text;
              structured sections (background, references, agreements) can mirror the legacy flow later.
            </p>
            <div>
              <label htmlFor="trainer-additional-notes" className="block text-sm font-semibold text-slate-700">
                Additional notes & draft answers
              </label>
              <textarea
                id="trainer-additional-notes"
                className="mt-1 min-h-[180px] w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#0d9488] focus:outline-none"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Write freely; staff see this on your trainer application record."
              />
            </div>
            {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm font-semibold text-teal-700">{msg}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          </form>

          {doc?.status != null ? (
            <p className="mt-6 text-xs text-slate-500">
              Status: <span className="font-medium text-slate-700">{String(doc.status)}</span>
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
