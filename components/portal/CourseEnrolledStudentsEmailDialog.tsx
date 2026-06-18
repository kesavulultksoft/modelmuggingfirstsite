'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import {
  fetchAdminPreClassEmail,
  fetchInstructorPreClassEmail,
  postAdminEmailSend,
  sendInstructorEmail,
} from '@/lib/portalApi'
import {
  htmlFromBody,
  joinEmailList,
  legacyEnrolledStudentRecipients,
} from '@/lib/courseRosterEmail'

export type CourseEnrolledStudentsEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseTitle: string
  studentEmails: string[]
  audience: 'admin' | 'instructor'
  /** bulk = enrolled-students blast (legacy Cc/Bcc + pre-class template); simple = one student from roster */
  variant?: 'bulk' | 'simple'
  loading?: boolean
  rosterError?: string
}

type FormState = {
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
}

/** Right-side drawer (trainer-pipeline Manage / applicant submission style). */
export default function CourseEnrolledStudentsEmailDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  studentEmails,
  audience,
  variant = 'bulk',
  loading = false,
  rosterError = '',
}: CourseEnrolledStudentsEmailDialogProps) {
  const isSimple = variant === 'simple'
  const [form, setForm] = useState<FormState>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  })
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [templateLoading, setTemplateLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setMsg('')
    const roster = studentEmails
    setForm({
      to: roster[0] || '',
      cc: isSimple ? '' : roster.length > 1 ? joinEmailList(roster) : '',
      bcc: isSimple ? '' : roster.length > 1 ? joinEmailList(roster.slice(1)) : '',
      subject: '',
      body: '',
    })
  }, [open, studentEmails, isSimple])

  function close() {
    if (sending) return
    onOpenChange(false)
  }

  async function loadPreClassTemplate() {
    if (!courseId.trim()) {
      setMsg('Course id is missing; cannot load template.')
      return
    }
    setTemplateLoading(true)
    setMsg('')
    try {
      const merged =
        audience === 'admin'
          ? await fetchAdminPreClassEmail(courseId)
          : await fetchInstructorPreClassEmail(courseId)
      if (!merged) {
        setMsg('Pre-class template not found or course data unavailable.')
        return
      }
      const body = String(merged.html || merged.emailBody || merged.text || '').trim()
      setForm((f) => ({
        ...f,
        subject: String(merged.subject || '').trim() || f.subject,
        body: body || f.body,
      }))
    } catch (e) {
      setMsg(String((e as Error).message || e))
    } finally {
      setTemplateLoading(false)
    }
  }

  async function handleSend() {
    const roster = studentEmails
    if (!isSimple && roster.length === 0) {
      setMsg('No registered student emails for this course.')
      return
    }
    if (!form.subject.trim()) {
      setMsg('Subject is required.')
      return
    }
    if (!form.body.trim()) {
      setMsg('Email body is required.')
      return
    }
    const legacyRecipients = isSimple ? null : legacyEnrolledStudentRecipients(roster, form.to, form.bcc)
    const to = isSimple ? form.to.trim() : legacyRecipients?.to || ''
    if (!to) {
      setMsg(isSimple ? 'To is required.' : 'To is required (first registered student is used if left blank).')
      return
    }
    const { text, html } = htmlFromBody(form.body)
    setSending(true)
    setMsg('')
    try {
      const cc = isSimple ? undefined : form.cc.trim() || undefined
      const bccOut = isSimple ? undefined : legacyRecipients?.bcc || undefined
      if (audience === 'admin') {
        const res = await postAdminEmailSend({
          to,
          cc,
          bcc: bccOut,
          subject: form.subject.trim(),
          text,
          html,
          category: isSimple ? 'Student Email' : 'Enrolled Students Email',
        })
        const data = (await res.json().catch(() => ({}))) as { transportOk?: boolean }
        if (!res.ok) throw new Error('Send failed')
        setMsg(data.transportOk === false ? 'Logged; SMTP may not be configured.' : 'Email sent.')
      } else {
        const res = await sendInstructorEmail({
          to,
          cc,
          bcc: bccOut,
          subject: form.subject.trim(),
          text,
          html,
        })
        if (!res.ok) throw new Error('Send failed')
        setMsg('Email sent.')
      }
      setTimeout(() => {
        onOpenChange(false)
        setMsg('')
      }, 1200)
    } catch (e) {
      setMsg(String((e as Error).message || e))
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[280]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close email panel"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-enrolled-email-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,920px)] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {isSimple ? 'Roster' : 'Course roster'}
            </p>
            <h2
              id="course-enrolled-email-title"
              className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900"
            >
              <Mail className="size-5 shrink-0 text-[#0d9488]" aria-hidden />
              <span className="truncate">{isSimple ? 'Email student' : 'Email registered students'}</span>
            </h2>
            <p className="mt-1 truncate text-sm text-slate-600">{courseTitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="text-sm text-slate-600">Loading roster…</p>
          ) : (
            <div className="space-y-4">
              {!isSimple && (
                <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                  <p className="text-sm text-teal-950/90">
                    Registered student addresses are pre-filled in <strong>Cc</strong> (and{' '}
                    <strong>Bcc</strong> for additional students, matching legacy delivery). Edit recipients, subject,
                    and body before sending. Use the pre-class template for the standard 7-day reminder.
                  </p>
                  {studentEmails.length > 0 && (
                    <p className="mt-2 text-xs text-teal-800">
                      <span className="font-semibold">{studentEmails.length}</span> registered
                      {studentEmails.length === 1 ? ' student' : ' students'}
                    </p>
                  )}
                </section>
              )}

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 text-sm">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">To</span>
                    <input
                      type="email"
                      value={form.to}
                      onChange={(e) => setForm({ ...form, to: e.target.value })}
                      placeholder={studentEmails[0] || (isSimple ? 'Student email' : 'First registered student if blank')}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      readOnly={isSimple && Boolean(studentEmails[0])}
                    />
                  </label>
                  {!isSimple && (
                    <>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-600">Cc</span>
                        <input
                          type="text"
                          value={form.cc}
                          onChange={(e) => setForm({ ...form, cc: e.target.value })}
                          placeholder="Registered students (comma-separated)"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-600">Bcc</span>
                        <input
                          type="text"
                          value={form.bcc}
                          onChange={(e) => setForm({ ...form, bcc: e.target.value })}
                          placeholder="Additional hidden recipients"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                        />
                      </label>
                    </>
                  )}
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Subject</span>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Body</span>
                    <textarea
                      rows={16}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="mt-1 min-h-[280px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900"
                      required
                    />
                  </label>
                </div>
              </section>

              {rosterError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {rosterError}
                </p>
              )}
              {!rosterError && !isSimple && studentEmails.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No registered student emails found for this course.
                </p>
              )}
              {msg && (
                <p
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    msg.includes('sent')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {msg}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className={`flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 ${
            isSimple ? 'sm:flex-row sm:justify-end' : 'sm:flex-row sm:items-center sm:justify-between'
          }`}
        >
          {!isSimple && (
            <button
              type="button"
              disabled={templateLoading || loading}
              onClick={() => void loadPreClassTemplate()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {templateLoading ? 'Loading template…' : 'Load pre-class template'}
            </button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                sending ||
                loading ||
                (!isSimple && studentEmails.length === 0) ||
                (isSimple && !form.to.trim())
              }
              onClick={() => void handleSend()}
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
