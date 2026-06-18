'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createAdminEmailTemplate,
  fetchAdminCrmTable,
  fetchMe,
  getToken,
  postAdminEmailBroadcast,
  postAdminEmailSend,
  postAdminEmailToCourse,
  postAdminEmailToStudent,
  updateAdminEmailTemplate,
  type MeUser,
} from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import PortalJsonTable from '@/components/portal/PortalJsonTable'

type Tab = 'templates' | 'newtpl' | 'send' | 'mass' | 'studentmail' | 'history'
type Row = Record<string, unknown>

function docId(r: Row): string {
  const id = r._id
  if (typeof id === 'string') return id
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: string }).$oid)
  return ''
}

export default function AdminEmailCenterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [me, setMe] = useState<MeUser | null>(null)
  const [tab, setTab] = useState<Tab>('templates')
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState('')
  const [sendForm, setSendForm] = useState({
    mode: 'single' as 'single' | 'broadcast' | 'course' | 'student',
    to: '',
    recipients: '',
    courseId: '',
    userId: '',
    subject: '',
    text: '',
    html: '',
    category: '',
    attachmentName: '',
    attachmentBase64: '',
  })
  const [sendMsg, setSendMsg] = useState('')

  const [form, setForm] = useState({
    templateName: '',
    subject: '',
    type: '',
    templateType: '',
    autoOrManual: '',
    recipients: '',
    categoryKey: '',
    emailBody: '',
    adminComments: '',
  })

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/email-center')
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
    if (searchParams.get('tab') === 'send') {
      setTab('send')
    }
  }, [searchParams])

  useEffect(() => {
    if (!me) return
    if (tab === 'send') return
    const key =
      tab === 'templates'
        ? 'email-templates'
        : tab === 'newtpl'
          ? 'email-new-templates'
          : tab === 'mass'
            ? 'mass-emails-sent'
            : tab === 'studentmail'
              ? 'student-emails-sent'
              : 'email-history-all'
    fetchAdminCrmTable(key).then((d) => setRows(Array.isArray(d) ? (d as Row[]) : []))
  }, [me, tab])

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function saveTemplate() {
    setMsg('')
    const bucket = tab === 'newtpl' ? 'email-new-templates' : 'email-templates'
    const body = {
      templateName: form.templateName,
      subject: form.subject,
      type: form.type,
      templateType: form.templateType,
      autoOrManual: form.autoOrManual,
      recipients: form.recipients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      categoryKey: form.categoryKey,
      emailBody: form.emailBody,
      adminComments: form.adminComments,
    }
    const res = editingId
      ? await updateAdminEmailTemplate(bucket, editingId, body)
      : await createAdminEmailTemplate(bucket, body)
    if (!res.ok) {
      setMsg('Failed to save template.')
      return
    }
    setMsg(editingId ? 'Template updated.' : 'Template created.')
    setEditingId('')
    setForm({
      templateName: '',
      subject: '',
      type: '',
      templateType: '',
      autoOrManual: '',
      recipients: '',
      categoryKey: '',
      emailBody: '',
      adminComments: '',
    })
    const refreshed = await fetchAdminCrmTable(bucket)
    setRows(Array.isArray(refreshed) ? (refreshed as Row[]) : [])
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const templateMode = tab === 'templates' || tab === 'newtpl'

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => {
        const s = String(r.result || '')
        const i = s.indexOf(',')
        resolve(i >= 0 ? s.slice(i + 1) : s)
      }
      r.onerror = () => reject(new Error('read failed'))
      r.readAsDataURL(file)
    })
  }

  async function submitSend() {
    setSendMsg('')
    const base: Record<string, unknown> = {
      subject: sendForm.subject,
      text: sendForm.text,
      html: sendForm.html || undefined,
      category: sendForm.category || undefined,
    }
    if (sendForm.attachmentBase64) {
      base.attachmentBase64 = sendForm.attachmentBase64
      base.attachmentFileName = sendForm.attachmentName || 'attachment.bin'
      base.attachmentMimeType = 'application/octet-stream'
    }
    try {
      let res: Response
      if (sendForm.mode === 'single') {
        res = await postAdminEmailSend({ ...base, to: sendForm.to })
      } else if (sendForm.mode === 'broadcast') {
        const recipients = sendForm.recipients
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        res = await postAdminEmailBroadcast({ ...base, recipients })
      } else if (sendForm.mode === 'course') {
        res = await postAdminEmailToCourse({ ...base, courseId: sendForm.courseId })
      } else {
        res = await postAdminEmailToStudent({ ...base, userId: sendForm.userId })
      }
      if (!res.ok) {
        setSendMsg((await res.text()) || 'Send failed')
        return
      }
      setSendMsg('Queued / sent. Check Email history tab (transportOk in mm_email_history when SMTP is configured).')
      setSendForm((f) => ({ ...f, attachmentBase64: '', attachmentName: '' }))
    } catch (e) {
      setSendMsg(String((e as Error).message || e))
    }
  }
  const filtered = rows.filter((r) => {
    if (!q.trim()) return true
    const s = JSON.stringify(r).toLowerCase()
    return s.includes(q.toLowerCase())
  })

  return (
    <>
      <PortalPageHeader
        title="Email center"
        subtitle={
          <>
            Templates and outbound mail. For the full audit log (legacy EmailHistory fields), see{' '}
            <Link href="/portal/admin/email-history" className="font-semibold text-[#0d9488] underline">
              Email history
            </Link>
            .
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'templates' as const, label: 'Email templates' },
            { id: 'newtpl' as const, label: 'New templates' },
            { id: 'send' as const, label: 'Send mail' },
            { id: 'mass' as const, label: 'Mass mail sent' },
            { id: 'studentmail' as const, label: 'Student emails sent' },
            { id: 'history' as const, label: 'Email history' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold sm:text-sm ${
              tab === t.id ? 'bg-[#0f172a] text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search templates, subjects, recipients..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {tab === 'send' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-slate-600">
            Sends via configured SMTP (see <code className="rounded bg-slate-100 px-1">spring.mail.*</code>). Each
            attempt is logged to <code className="rounded bg-slate-100 px-1">mm_email_history</code> with{' '}
            <code className="rounded bg-slate-100 px-1">transportOk</code>. Optional file attachment uses base64 (same
            as API).
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['single', 'broadcast', 'course', 'student'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSendForm((f) => ({ ...f, mode: m }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  sendForm.mode === m ? 'bg-[#0f172a] text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {m === 'single' ? 'One recipient' : m === 'broadcast' ? 'Mass list' : m === 'course' ? 'Course roster' : 'Student by user id'}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sendForm.mode === 'single' && (
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                To (email)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={sendForm.to}
                  onChange={(e) => setSendForm((f) => ({ ...f, to: e.target.value }))}
                />
              </label>
            )}
            {sendForm.mode === 'broadcast' && (
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Recipients (comma or newline separated)
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={4}
                  value={sendForm.recipients}
                  onChange={(e) => setSendForm((f) => ({ ...f, recipients: e.target.value }))}
                />
              </label>
            )}
            {sendForm.mode === 'course' && (
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Course ID (Mongo hex)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={sendForm.courseId}
                  onChange={(e) => setSendForm((f) => ({ ...f, courseId: e.target.value }))}
                />
              </label>
            )}
            {sendForm.mode === 'student' && (
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Portal user ID
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={sendForm.userId}
                  onChange={(e) => setSendForm((f) => ({ ...f, userId: e.target.value }))}
                />
              </label>
            )}
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Subject
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={sendForm.subject}
                onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Plain text
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                value={sendForm.text}
                onChange={(e) => setSendForm((f) => ({ ...f, text: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              HTML (optional)
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                value={sendForm.html}
                onChange={(e) => setSendForm((f) => ({ ...f, html: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Category / type label
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. admin-broadcast"
                value={sendForm.category}
                onChange={(e) => setSendForm((f) => ({ ...f, category: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
              Attachment (optional)
              <input
                type="file"
                className="mt-1 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) {
                    setSendForm((f) => ({ ...f, attachmentBase64: '', attachmentName: '' }))
                    return
                  }
                  const b64 = await fileToBase64(file)
                  setSendForm((f) => ({ ...f, attachmentBase64: b64, attachmentName: file.name }))
                }}
              />
              {sendForm.attachmentName && (
                <span className="mt-1 block text-[11px] text-slate-500">Attached: {sendForm.attachmentName}</span>
              )}
            </label>
          </div>
          <button
            type="button"
            onClick={() => submitSend()}
            className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white"
          >
            Send
          </button>
          {sendMsg && <p className="mt-3 text-sm text-slate-700">{sendMsg}</p>}
        </div>
      ) : templateMode ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">Templates</p>
            <div className="max-h-[72vh] space-y-2 overflow-y-auto">
              {filtered.map((r, i) => (
                <button
                  key={docId(r) || i}
                  type="button"
                  onClick={() => {
                    setEditingId(docId(r))
                    setForm({
                      templateName: String(r.templateName || ''),
                      subject: String(r.subject || ''),
                      type: String(r.type || ''),
                      templateType: String(r.templateType || ''),
                      autoOrManual: String(r.autoOrManual || ''),
                      recipients: Array.isArray(r.recipients) ? (r.recipients as unknown[]).map(String).join(', ') : '',
                      categoryKey: String(r.categoryKey || ''),
                      emailBody: String(r.emailBody || ''),
                      adminComments: String(r.adminComments || ''),
                    })
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-[#00d4aa]"
                >
                  <p className="line-clamp-1 text-sm font-semibold text-slate-900">{String(r.templateName || 'Untitled')}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{String(r.subject || '')}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-bold text-slate-800">
              {editingId ? 'Edit template' : 'Create template'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Template name
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.templateName} onChange={(e)=>setField('templateName', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Subject
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.subject} onChange={(e)=>setField('subject', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Type
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.type} onChange={(e)=>setField('type', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Template type
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.templateType} onChange={(e)=>setField('templateType', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Auto/Manual
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.autoOrManual} onChange={(e)=>setField('autoOrManual', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Category
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.categoryKey} onChange={(e)=>setField('categoryKey', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Recipients (comma-separated)
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.recipients} onChange={(e)=>setField('recipients', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Email body (HTML allowed)
                <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={10} value={form.emailBody} onChange={(e)=>setField('emailBody', e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
                Admin comments
                <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={4} value={form.adminComments} onChange={(e)=>setField('adminComments', e.target.value)} />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={saveTemplate} className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white">
                {editingId ? 'Save changes' : 'Create template'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId('')
                  setForm({
                    templateName: '',
                    subject: '',
                    type: '',
                    templateType: '',
                    autoOrManual: '',
                    recipients: '',
                    categoryKey: '',
                    emailBody: '',
                    adminComments: '',
                  })
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                New
              </button>
            </div>
            {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
          </div>
        </div>
      ) : (
        <PortalJsonTable
          rows={filtered.map((r) => {
            const copy = { ...r }
            delete copy.legacyId
            delete copy.migratedAt
            delete copy.sourceClass
            return copy
          })}
          maxRows={120}
        />
      )}
    </>
  )
}
