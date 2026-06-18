'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, sendInstructorEmail, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { Mail, Send } from 'lucide-react'

const DEFAULT_TO = 'info@modelmugging.com'

/**
 * Parity with legacy instructorUpcomingTrainings / admin mail: To, CC, BCC, Subject, Body.
 * Sends through the API (SMTP) when configured; audit row in Email history.
 */
export default function InstructorEmailPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [to, setTo] = useState(DEFAULT_TO)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/email')
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

  async function sendViaServer(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (!to.trim()) {
      setErr('To is required.')
      return
    }
    if (!subject.trim()) {
      setErr('Subject is required.')
      return
    }
    setSending(true)
    const res = await sendInstructorEmail({
      to: to.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim(),
      text: body.trim(),
    })
    setSending(false)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr((j as { error?: string }).error || 'Send failed. Is SMTP configured on the server?')
      return
    }
    setMsg('Message queued or sent. See Email history for delivery status.')
    setBody('')
  }

  function openMailto() {
    const addr = to.trim() || DEFAULT_TO
    const params = new URLSearchParams()
    if (cc.trim()) params.set('cc', cc.trim())
    if (bcc.trim()) params.set('bcc', bcc.trim())
    if (subject.trim()) params.set('subject', subject.trim())
    const combined = [
      body.trim(),
      '',
      `—`,
      `Sent from instructor portal`,
      `${me?.firstName || ''} ${me?.lastName || ''}`.trim(),
      me?.email || '',
    ]
      .filter(Boolean)
      .join('\n')
    if (combined.trim()) params.set('body', combined)
    const q = params.toString()
    window.location.href = `mailto:${encodeURIComponent(addr)}${q ? `?${q}` : ''}`
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Email"
        subtitle="Same fields as the legacy instructor mail form: To, CC, BCC, subject, and body. Prefer Send via server so staff can audit in Email history; use your mail app as a fallback."
      />

      {err && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}
      {msg && (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <Send className="h-5 w-5 text-[#0d9488]" aria-hidden />
            <h2 className="text-lg font-bold">Compose</h2>
          </div>
          <form onSubmit={sendViaServer} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">To *</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={DEFAULT_TO}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">CC</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Optional, comma-separated"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">BCC</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Optional, comma-separated"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Subject *</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Topic…"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Message</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {sending ? 'Sending…' : 'Send via server'}
              </button>
              <button
                type="button"
                onClick={openMailto}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 hover:border-[#0d9488]"
              >
                Open in email app
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Related</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/portal/instructor/email-history" className="font-semibold text-[#0d9488] hover:underline">
                  Email history
                </Link>
                <p className="text-xs text-slate-500">Server-sent messages and audit rows.</p>
              </li>
              <li>
                <Link href="/portal/instructor/trainings" className="font-semibold text-[#0d9488] hover:underline">
                  Course management
                </Link>
                <p className="text-xs text-slate-500">Roster email shortcuts on each course (legacy flow).</p>
              </li>
              <li>
                <Link href="/portal/admin/email-center" className="font-semibold text-slate-500 hover:underline">
                  Admin email center
                </Link>
                <p className="text-xs text-slate-500">Templates & broadcasts (admin only).</p>
              </li>
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Legacy Angular used the same structure for mass mail to enrolled students from a class; that path lives under
            course management and admin tools here.
          </p>
        </aside>
      </div>
    </>
  )
}
