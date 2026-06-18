'use client'

import { useEffect, useRef, useState } from 'react'
import UsDatePicker from '@/components/portal/UsDatePicker'
import {
  BG_OFFICE_CHECKBOX_KEYS,
  bgAgentDocMeta,
  candidateLegacyFileNames,
  isBoolTrue,
  maskSsnForBgAgentDisplay,
  maskTaxIdForBgAgentDisplay,
  isBgVerificationFinalized,
  supportingDocMeta,
  type BgRow,
} from '@/lib/bgAgentDisplay'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'
import {
  createBgAgentAdditionalVerification,
  openBgAgentCandidateSupportingPdf,
  openBgAgentInvestigatorPdf,
  updateBgAgentVerificationStatus,
  uploadBgAgentVerificationPdf,
} from '@/lib/portalApi'
import {
  formatTimeHm,
  formatUsDateTime,
  parseStoredDateTimeToUsFields,
  usDateAndTimeToIso,
} from '@/lib/usDate'

const fieldClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00d4aa] focus:outline-none focus:ring-2 focus:ring-[#00d4aa]/25'

type Props = {
  detail: BgRow
  /** Approved/rejected tabs: legacy view-only (no save, outcome, or uploads). */
  readOnly?: boolean
  onClose: () => void
  onSaved: () => void
  onMessage: (msg: string) => void
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function BgAgentVerificationDetail({
  detail,
  readOnly: readOnlyTab = false,
  onClose,
  onSaved,
  onMessage,
}: Props) {
  const [form, setForm] = useState<BgRow>(() => ({ ...detail }))
  const [busy, setBusy] = useState(false)
  const [addFee, setAddFee] = useState(String(detail.additionalAmount ?? ''))
  const [panelMsg, setPanelMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showPanelMessage(text: string, tone: 'success' | 'error' = 'success') {
    setPanelMsg({ text, tone })
  }

  useEffect(() => {
    setForm({ ...detail })
    setAddFee(String(detail.additionalAmount ?? ''))
    setPanelMsg(null)
  }, [detail])

  const locked = readOnlyTab || isBgVerificationFinalized(form)
  const uid = String(form.userId ?? '').trim()
  const completionLabel = (() => {
    const raw = form.completionDate ?? form.completedDate
    if (raw == null || raw === '') return ''
    const d = new Date(String(raw))
    return Number.isNaN(d.getTime()) ? String(raw) : formatUsDateTime(d)
  })()
  const sigStored = String(form.signatureDate ?? '')
  const sigFields = parseStoredDateTimeToUsFields(sigStored)

  function patch(p: Partial<BgRow>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function toggleOffice(key: string) {
    setForm((prev) => ({ ...prev, [key]: !isBoolTrue(prev[key]) }))
  }

  function onSignatureDatePick(usDate: string) {
    if (!usDate.trim()) {
      patch({ signatureDate: '' })
      return
    }
    const iso = usDateAndTimeToIso(usDate, formatTimeHm(new Date()))
    patch({ signatureDate: iso || usDate })
  }

  function buildUpdates(): Record<string, unknown> {
    const updates: Record<string, unknown> = {
      signature: form.signature,
      signatureDate: form.signatureDate,
      notes: form.notes,
      otherName: form.otherName,
      additionalAmount: form.additionalAmount,
      additionalVerificationStatus: form.additionalVerificationStatus,
    }
    for (const { key } of BG_OFFICE_CHECKBOX_KEYS) {
      updates[key] = isBoolTrue(form[key])
    }
    return updates
  }

  async function saveStatus(status: 'Submitted' | 'Successful' | 'Unsuccessful') {
    if (locked) return
    if (!uid) return
    setPanelMsg(null)
    setBusy(true)
    const res = await updateBgAgentVerificationStatus(uid, status, buildUpdates())
    setBusy(false)
    if (res.ok) {
      let msg = `Saved as ${status}`
      try {
        const data = (await res.json()) as Record<string, unknown>
        const emailMsg = data.emailMessage
        if (typeof emailMsg === 'string' && emailMsg.trim()) {
          msg = emailMsg.trim()
        }
      } catch {
        /* non-JSON body */
      }
      onMessage(msg)
      await onSaved()
      onClose()
    } else {
      try {
        const err = (await res.json()) as { error?: string }
        onMessage(err.error?.trim() || 'Could not update status')
      } catch {
        onMessage('Could not update status')
      }
    }
  }

  async function assignAdditional() {
    if (locked) return
    if (!uid) return
    const amount = Number(addFee)
    setPanelMsg(null)
    setBusy(true)
    const res = await createBgAgentAdditionalVerification({
      userId: uid,
      additionalAmount: Number.isFinite(amount) ? amount : undefined,
      additionalVerificationStatus: 'Submitted',
    })
    setBusy(false)
    if (res.ok) {
      const j = (await res.json().catch(() => null)) as BgRow | null
      if (j) setForm((prev) => ({ ...prev, ...j }))
      showPanelMessage(
        'Additional verification assigned — applicant can pay the fee from their portal.',
      )
      onSaved()
    } else {
      try {
        const err = (await res.json()) as { error?: string }
        showPanelMessage(err.error?.trim() || 'Could not assign additional verification', 'error')
      } catch {
        showPanelMessage('Could not assign additional verification', 'error')
      }
    }
  }

  async function onUploadPdf(file: File) {
    if (locked) return
    if (!uid) return
    setPanelMsg(null)
    setBusy(true)
    const res = await uploadBgAgentVerificationPdf(uid, file)
    setBusy(false)
    if (res.ok) {
      const j = (await res.json().catch(() => null)) as BgRow | null
      if (j) setForm(j)
      showPanelMessage('Investigator document uploaded')
      onSaved()
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      showPanelMessage(j.error || 'Upload failed', 'error')
    }
  }

  const candidateDocs = supportingDocMeta(form)
  const legacyFiles = candidateLegacyFileNames(form)
  const agentDocs = bgAgentDocMeta(form)
  const paymentSummary = String(form.paymentSummary ?? '').trim()

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
              {locked ? 'View trainer details' : 'Verification review'}
            </p>
            <h2 className="font-[family-name:var(--font-portal-display)] text-xl font-bold text-slate-900">
              {String(form.firstName ?? '')} {String(form.lastName ?? '')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Status: {String(form.status ?? '—')}</p>
            {locked && completionLabel && (
              <p className="mt-0.5 text-xs text-slate-500">Completed: {completionLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {panelMsg && (
            <div
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                panelMsg.tone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-950'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-950'
              }`}
              role="status"
            >
              {panelMsg.text}
            </div>
          )}
          {locked && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              This case is finalized. You can review applicant data and open PDFs; use quick email from the table to
              contact the applicant or admin (legacy approved/rejected queues).
            </div>
          )}
          {paymentSummary && (
            <div className="mb-5 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <span className="font-semibold">Payment: </span>
              {paymentSummary}
            </div>
          )}

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Applicant information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadField label="Other name / alias" value={String(form.otherName ?? '')} />
              <ReadField label="Current address" value={String(form.address ?? '')} />
              <ReadField label="Previous address 1" value={String(form.previousAddress1 ?? '')} />
              <ReadField label="Previous address 2" value={String(form.previousAddress2 ?? '')} />
              <ReadField label="SSN" value={maskSsnForBgAgentDisplay(form.socialSecurityNumber)} />
              <ReadField label="Tax ID" value={maskTaxIdForBgAgentDisplay(form.taxId)} />
              <ReadField label="Driver license / ID" value={String(form.licenseNumber ?? '')} />
              <ReadField label="Date of birth" value={String(form.dob ?? '')} />
              <ReadField label="Phone" value={formatUsPhoneDisplay(form.contactNumber) || '—'} />
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Office use only</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {BG_OFFICE_CHECKBOX_KEYS.map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 ${
                    locked ? '' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isBoolTrue(form[key])}
                    disabled={locked}
                    onChange={() => toggleOffice(key)}
                    className="size-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#00d4aa] disabled:opacity-70"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Candidate attachments</h3>
            {candidateDocs.length === 0 && legacyFiles.length === 0 ? (
              <p className="text-sm text-slate-500">No candidate PDFs on file.</p>
            ) : (
              <ul className="space-y-2">
                {candidateDocs.map((d) => (
                  <li key={`c-${d.index}`}>
                    <button
                      type="button"
                      disabled={!uid || busy}
                      onClick={() => void openBgAgentCandidateSupportingPdf(uid, d.index)}
                      className="text-sm font-semibold text-[#0d9488] hover:underline disabled:opacity-50"
                    >
                      {d.filename}
                    </button>
                  </li>
                ))}
                {legacyFiles.map((name) => (
                  <li key={`legacy-${name}`} className="text-sm text-slate-600">
                    {name} <span className="text-xs text-slate-400">(legacy file reference)</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Investigator uploads</h3>
            <ul className="mb-3 space-y-2">
              {agentDocs.map((d) => (
                <li key={`a-${d.index}`} className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">{d.filename}</span>
                  {!d.legacyOnly && uid && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void openBgAgentInvestigatorPdf(uid, d.index)}
                      className="text-xs font-semibold text-[#0d9488] hover:underline"
                    >
                      View PDF
                    </button>
                  )}
                </li>
              ))}
              {agentDocs.length === 0 && <p className="text-sm text-slate-500">No investigator files yet.</p>}
            </ul>
            {!locked && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onUploadPdf(f)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  disabled={busy || !uid}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#00d4aa]"
                >
                  Upload PDF (investigator)
                </button>
              </>
            )}
          </section>

          {!locked && (
          <section className="mb-6 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Additional verification & fee</h3>
            <p className="mb-3 text-xs text-slate-600">
              Assign an extra background fee (legacy). The applicant pays from their portal cart, then appears under
              the Additional verification tab.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Fee (USD)
                <input
                  value={addFee}
                  onChange={(e) => setAddFee(e.target.value)}
                  placeholder="e.g. 75"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Current status
                <input
                  value={String(form.additionalVerificationStatus ?? 'Not assigned')}
                  readOnly
                  className={`${fieldClass} bg-slate-50`}
                />
              </label>
              <button
                type="button"
                disabled={busy || !uid}
                onClick={() => void assignAdditional()}
                className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
              >
                Assign additional verification
              </button>
            </div>
          </section>
          )}

          {locked ? (
            <section className="mb-4 grid gap-4 sm:grid-cols-2">
              <ReadField label="Investigator signature" value={String(form.signature ?? '')} />
              <ReadField
                label="Signature date"
                value={
                  sigStored
                    ? (() => {
                        const d = new Date(sigStored)
                        return Number.isNaN(d.getTime()) ? sigStored : formatUsDateTime(d)
                      })()
                    : '—'
                }
              />
              <div className="sm:col-span-2">
                <ReadField label="Notes" value={String(form.notes ?? '')} />
              </div>
            </section>
          ) : (
            <section className="mb-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Investigator signature
                <input
                  value={String(form.signature ?? '')}
                  onChange={(e) => patch({ signature: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <div>
                <p className="text-sm font-semibold text-slate-700">Signature date</p>
                <UsDatePicker
                  value={sigFields.date}
                  onChange={onSignatureDatePick}
                  buttonClassName={fieldClass}
                />
                {sigStored && (
                  <p className="mt-2 text-xs text-slate-600">
                    Recorded:{' '}
                    <span className="font-mono font-medium text-slate-800">
                      {(() => {
                        const d = new Date(sigStored)
                        return Number.isNaN(d.getTime()) ? sigStored : formatUsDateTime(d)
                      })()}
                    </span>
                  </p>
                )}
              </div>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Notes
                <textarea
                  value={String(form.notes ?? '')}
                  onChange={(e) => patch({ notes: e.target.value })}
                  className={`${fieldClass} min-h-[88px]`}
                />
              </label>
            </section>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          {!locked && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveStatus('Submitted')}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveStatus('Successful')}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
              >
                Successful
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveStatus('Unsuccessful')}
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900"
              >
                Unsuccessful
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
