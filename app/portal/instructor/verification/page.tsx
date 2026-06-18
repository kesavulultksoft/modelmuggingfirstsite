'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  addInstructorBackgroundVerificationAdditionalFeeToCart,
  addInstructorBackgroundVerificationFeeToCart,
  confirmInstructorBackgroundVerificationAdditionalPayment,
  confirmInstructorBackgroundVerificationPayment,
  createInstructorBackgroundVerificationAdditionalPaymentIntent,
  createInstructorBackgroundVerificationPaymentIntent,
  deleteInstructorBackgroundVerificationSupportingPdf,
  fetchInstructorBackgroundVerification,
  fetchInstructorBackgroundVerificationFee,
  fetchInstructorBackgroundVerificationFormTemplate,
  fetchInstructorCrmProfile,
  fetchMe,
  fetchStripeConfig,
  getToken,
  openInstructorBackgroundVerificationSupportingPdf,
  updateInstructorBackgroundVerification,
  uploadInstructorBackgroundVerificationPdf,
  type MeUser,
} from '@/lib/portalApi'
import { emitInstructorCartChanged } from '@/lib/instructorCartSummary'
import { legacyAsObjectArray, legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import GooglePlacesAutocomplete from '@/components/portal/GooglePlacesAutocomplete'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { labelForFormField } from '@/lib/humanizeFieldLabel'
import { formatUsPhoneInput, isValidUsPhone10 } from '@/lib/phoneUs'
import {
  crmDateFieldToUs,
  formatTimeHm,
  formatUsDateTime,
  parseStoredDateTimeToUsFields,
  usDateAndTimeToIso,
} from '@/lib/usDate'

const BOOL_KEYS = ['la', 'oc', 'vent', 'riv', 'sor', 'sb', 'sd', 'other', 'ssn', 'dl', 'wc'] as const

/** Legacy Angular template ids from `backgroundverification.html` / `InstructorSettingController.js`. */
const LEGACY_BG_TERMS_TEMPLATE_ID = '5db1bf57e4b0c1e38254ac65'
const LEGACY_BG_ACK_TEMPLATE_ID = '5db68e33d8ba021180988ca5'

const fieldInputClass =
  'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900'

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function centsToUsd(c: number): string {
  if (!Number.isFinite(c) || c <= 0) return '—'
  return `$${(c / 100).toFixed(2)}`
}

function isBoolTrue(v: unknown): boolean {
  if (v === true) return true
  const s = str(v).toLowerCase()
  return s === 'true' || s === 'yes' || s === 'on' || s === '1'
}

function formLocked(profile: Record<string, unknown>, bg: Record<string, unknown> | null): boolean {
  const p = str(profile.bgVerificationStatus || profile.bgverificationStatus).toLowerCase()
  if (p === 'successful' || p === 'inprogress') return true
  const st = str(bg?.status).toLowerCase()
  return st === 'successful' || st === 'unsuccessful'
}

function digitsOnly(s: string | undefined | null): string {
  if (s == null) return ''
  return String(s).replace(/\D/g, '')
}

/** US SSN entry: up to 9 digits as XXX-XX-XXXX (legacy jQuery mask). */
function formatSsnInput(raw: string | undefined | null): string {
  const d = digitsOnly(raw).slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

function isApiMaskedSsn(s: string | undefined | null): boolean {
  if (s == null || s === '') return false
  return /\*{2,}/.test(String(s)) && digitsOnly(s).length <= 4
}

function PrimaryPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorBackgroundVerificationPayment(piId)
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setErr(j.error || 'Could not record payment — contact staff if your card was charged.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay & record'}
      </button>
    </form>
  )
}

function AdditionalPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorBackgroundVerificationAdditionalPayment(piId)
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setErr(j.error || 'Could not record payment.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay additional fee'}
      </button>
    </form>
  )
}

export default function InstructorVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const printRef = useRef<HTMLDivElement>(null)
  const [me, setMe] = useState<MeUser | null>(null)
  const [bg, setBg] = useState<Record<string, unknown> | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [feeInfo, setFeeInfo] = useState<{
    feeCents: number
    additionalCents: number
    stripeEnabled: boolean
    standardFeeInCart?: boolean
    additionalFeeInCart?: boolean
  } | null>(null)
  const [text, setText] = useState<Record<string, string>>({})
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [ssnDraft, setSsnDraft] = useState('')
  const [taxIdDraft, setTaxIdDraft] = useState('')
  const [sigDateUs, setSigDateUs] = useState('')
  const [sigTimeHm, setSigTimeHm] = useState('12:00')
  const [ackOpen, setAckOpen] = useState(false)
  const [ackHtml, setAckHtml] = useState('')
  const [ackLoadError, setAckLoadError] = useState('')
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsHtml, setTermsHtml] = useState('')
  const [termsLoadError, setTermsLoadError] = useState('')
  const [cartBusy, setCartBusy] = useState<'std' | 'add' | null>(null)

  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null)
  const [primarySecret, setPrimarySecret] = useState('')
  const [additionalSecret, setAdditionalSecret] = useState('')
  const [primaryOpening, setPrimaryOpening] = useState(false)
  const [additionalOpening, setAdditionalOpening] = useState(false)

  const reload = useCallback(async () => {
    const [b, p, f] = await Promise.all([
      fetchInstructorBackgroundVerification().catch(() => ({})),
      fetchInstructorCrmProfile().catch(() => ({})),
      fetchInstructorBackgroundVerificationFee().catch(() => null),
    ])
    setBg(legacyAsRecord(b) ?? {})
    setProfile(legacyAsRecord(p) ?? {})
    setFeeInfo(f)
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/verification')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me?.id) return
    reload()
  }, [me?.id, reload])

  useEffect(() => {
    fetchStripeConfig().then((c) => {
      if (c?.publishableKey) loadStripe(c.publishableKey).then(setStripePromise)
    })
  }, [])

  useEffect(() => {
    if (searchParams?.get('paid') === '1') {
      setMsg('Payment returned — refreshing your record.')
      reload().finally(() => {
        router.replace('/portal/instructor/verification')
      })
    }
  }, [searchParams, router, reload])

  useEffect(() => {
    const p = profile ?? {}
    const b = bg ?? {}
    const next: Record<string, string> = {}
    next.firstName = str(b.firstName) || str(p.firstName) || str(me?.firstName)
    next.lastName = str(b.lastName) || str(p.lastName) || str(me?.lastName)
    next.otherName = str(b.otherName)
    next.address = str(b.address) || str(p.address) || str(p.contactAddressSnapshot)
    next.previousAddress1 = str(b.previousAddress1)
    next.previousAddress2 = str(b.previousAddress2)
    next.socialSecurityNumber = str(b.socialSecurityNumber)
    next.taxId = str(b.taxId)
    next.dob = crmDateFieldToUs(b.dob || p.dob)
    const phone = str(b.contactNumber) || str(p.phoneNumber) || str(p.contactPhoneSnapshot)
    next.contactNumber = phone ? formatUsPhoneInput(phone) : ''
    next.licenseNumber = str(b.licenseNumber)
    next.electronicSignature =
      str(b.electronicSignature) ||
      `${str(p.firstName || me?.firstName)} ${str(p.lastName || me?.lastName)}`.trim() ||
      str(me?.email)
    const esd = str(b.electronicSignatureDate)
    next.electronicSignatureDate = esd
    const parsed = parseStoredDateTimeToUsFields(esd)
    if (esd.trim()) {
      setSigDateUs(parsed.date ? parsed.date : '')
      setSigTimeHm(parsed.time || formatTimeHm(new Date()))
    } else {
      const now = new Date()
      setSigDateUs(crmDateFieldToUs(now.toISOString()))
      setSigTimeHm(formatTimeHm(now))
    }
    setText(next)
    setSsnDraft('')
    setTaxIdDraft('')

    const nf: Record<string, boolean> = {}
    for (const k of BOOL_KEYS) {
      nf[k] = isBoolTrue(b[k])
    }
    setFlags(nf)
  }, [bg, profile, me])

  useEffect(() => {
    const iso = usDateAndTimeToIso(sigDateUs.trim(), sigTimeHm.trim())
    if (!iso) return
    setText((prev) => ({ ...prev, electronicSignatureDate: formatUsDateTime(new Date(iso)) }))
  }, [sigDateUs, sigTimeHm])

  const locked = useMemo(() => formLocked(profile ?? {}, bg), [profile, bg])
  const status = str(bg?.status)
  const addSt = str(bg?.additionalVerificationStatus)
  const additionalCents = feeInfo?.additionalCents ?? 0
  const feeCents = feeInfo?.feeCents ?? 0
  const stripeOk = feeInfo?.stripeEnabled === true && !!stripePromise
  const standardInCart = feeInfo?.standardFeeInCart === true
  const additionalInCart = feeInfo?.additionalFeeInCart === true
  const primaryPaidLike = ['Paid', 'Successful', 'Unsuccessful', 'InProgress'].includes(status)
  const additionalPaidLike = ['Paid', 'Successful', 'InProgress'].includes(addSt)
  const canAddStandardFeeToCart =
    feeCents > 0 && status === 'Submitted' && !primaryPaidLike && !standardInCart && !locked
  const canAddAdditionalFeeToCart =
    additionalCents > 0 &&
    ['Paid', 'Successful', 'InProgress'].includes(status) &&
    !additionalPaidLike &&
    !additionalInCart &&
    !locked

  const supporting = useMemo(() => legacyAsObjectArray(bg?.supportingDocuments), [bg])

  const ssnMaskedDisplay = str(text.socialSecurityNumber)
  const maskedSsnOnFile = isApiMaskedSsn(ssnMaskedDisplay)
  const showSsnSingleField = !maskedSsnOnFile && digitsOnly(ssnMaskedDisplay).length < 9

  async function save() {
    setErr('')
    setMsg('')
    const body: Record<string, unknown> = {
      firstName: text.firstName?.trim(),
      lastName: text.lastName?.trim(),
      otherName: text.otherName?.trim(),
      address: text.address?.trim(),
      previousAddress1: text.previousAddress1?.trim(),
      previousAddress2: text.previousAddress2?.trim(),
      dob: text.dob?.trim(),
      contactNumber: text.contactNumber?.trim(),
      licenseNumber: text.licenseNumber?.trim(),
      electronicSignature: text.electronicSignature?.trim(),
      electronicSignatureDate: text.electronicSignatureDate?.trim(),
    }
    const ssnDigits = digitsOnly(ssnDraft)
    if (ssnDigits.length >= 9) {
      body.socialSecurityNumber = formatSsnInput(ssnDraft)
    } else if (!maskedSsnOnFile && digitsOnly(str(text.socialSecurityNumber)).length >= 9) {
      body.socialSecurityNumber = text.socialSecurityNumber.trim()
    }
    const taxMasked = /\*{2,}/.test(str(text.taxId))
    const taxDigits = digitsOnly(taxMasked ? taxIdDraft : str(text.taxId))
    if (taxMasked && taxIdDraft.trim().length > 0 && taxDigits.length >= 4) {
      body.taxId = taxIdDraft.trim()
    } else if (!taxMasked && text.taxId?.trim()) {
      body.taxId = text.taxId.trim()
    }
    for (const k of BOOL_KEYS) {
      body[k] = Boolean(flags[k])
    }
    const phoneDigits = digitsOnly(text.contactNumber || '')
    if (phoneDigits.length === 10 && !isValidUsPhone10(text.contactNumber || '')) {
      setErr('For 10-digit US numbers use the XXX-XXX-XXXX format.')
      return
    }
    const res = await updateInstructorBackgroundVerification(body)
    const raw = await res.text()
    let j: { error?: string } = {}
    try {
      j = JSON.parse(raw) as { error?: string }
    } catch {
      /* plain-text error body */
    }
    if (!res.ok) {
      setErr(j.error || raw.trim().slice(0, 500) || 'Save failed')
      return
    }
    setMsg('Authorization form saved (status Submitted). You can add the fee to your cart and/or pay with Stripe when ready.')
    setPrimarySecret('')
    setSsnDraft('')
    setTaxIdDraft('')
    await reload()
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    e.target.value = ''
    if (!files?.length) return
    setUploadBusy(true)
    setErr('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await uploadInstructorBackgroundVerificationPdf(file)
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          setErr(j.error || `Upload failed for ${file.name}`)
          return
        }
      }
      setMsg('PDF(s) attached.')
      await reload()
    } finally {
      setUploadBusy(false)
    }
  }

  async function startPrimaryPayment() {
    setPrimaryOpening(true)
    setErr('')
    setPrimarySecret('')
    try {
      const res = await createInstructorBackgroundVerificationPaymentIntent()
      const j = (await res.json()) as { clientSecret?: string; error?: string }
      if (!res.ok) {
        setErr(j.error || 'Could not start payment')
        return
      }
      if (j.clientSecret) setPrimarySecret(j.clientSecret)
    } finally {
      setPrimaryOpening(false)
    }
  }

  async function startAdditionalPayment() {
    setAdditionalOpening(true)
    setErr('')
    setAdditionalSecret('')
    try {
      const res = await createInstructorBackgroundVerificationAdditionalPaymentIntent()
      const j = (await res.json()) as { clientSecret?: string; error?: string }
      if (!res.ok) {
        setErr(j.error || 'Could not start additional payment')
        return
      }
      if (j.clientSecret) setAdditionalSecret(j.clientSecret)
    } finally {
      setAdditionalOpening(false)
    }
  }

  async function openAck() {
    setAckOpen(true)
    setAckLoadError('')
    setAckHtml('<p class="text-sm text-slate-600">Loading…</p>')
    try {
      const t = await fetchInstructorBackgroundVerificationFormTemplate(LEGACY_BG_ACK_TEMPLATE_ID)
      const html = str(t.templateBody)
      if (!html.trim()) {
        setAckHtml('')
        setAckLoadError(
          'No HTML is stored for this template id yet. Ensure Mongo has `AdminForms` or `mm_form_templates` with _id matching the legacy acknowledgment template.',
        )
        return
      }
      setAckHtml(html)
    } catch (e) {
      setAckHtml('')
      setAckLoadError(String((e as Error)?.message || e))
    }
  }

  async function openTerms() {
    setTermsModalOpen(true)
    setTermsLoadError('')
    setTermsHtml('<p class="text-sm text-slate-600">Loading…</p>')
    try {
      const t = await fetchInstructorBackgroundVerificationFormTemplate(LEGACY_BG_TERMS_TEMPLATE_ID)
      const html = str(t.templateBody)
      if (!html.trim()) {
        setTermsHtml('')
        setTermsLoadError(
          'No HTML is stored for this template id yet. Ensure Mongo has `AdminForms` or `mm_form_templates` with _id matching the legacy terms block on the authorization page.',
        )
        return
      }
      setTermsHtml(html)
    } catch (e) {
      setTermsHtml('')
      setTermsLoadError(String((e as Error)?.message || e))
    }
  }

  async function addStdCart() {
    setCartBusy('std')
    setErr('')
    try {
      const res = await addInstructorBackgroundVerificationFeeToCart()
      const raw = await res.text()
      let j: { error?: string; message?: string } = {}
      try {
        j = JSON.parse(raw) as { error?: string; message?: string }
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        setErr(j.error || raw.trim().slice(0, 400) || 'Could not add to cart')
        return
      }
      setMsg(j.message || 'Added to cart.')
      await reload()
      emitInstructorCartChanged()
    } finally {
      setCartBusy(null)
    }
  }

  async function addAdditionalCart() {
    setCartBusy('add')
    setErr('')
    try {
      const res = await addInstructorBackgroundVerificationAdditionalFeeToCart()
      const raw = await res.text()
      let j: { error?: string; message?: string } = {}
      try {
        j = JSON.parse(raw) as { error?: string; message?: string }
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        setErr(j.error || raw.trim().slice(0, 400) || 'Could not add to cart')
        return
      }
      setMsg(j.message || 'Additional fee added to cart.')
      await reload()
      emitInstructorCartChanged()
    } finally {
      setCartBusy(null)
    }
  }

  function printForm() {
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w || !printRef.current) return
    w.document.write(
      `<!DOCTYPE html><html><head><title>Background verification</title><style>body{font-family:system-ui,sans-serif;padding:16px;color:#111}</style></head><body>${printRef.current.innerHTML}<script>window.onload=function(){window.print()}<\/script></body></html>`,
    )
    w.document.close()
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Background verification"
        subtitle="Authorization, cart, investigator fee (Stripe), PDFs — aligned with legacy instructor backgroundverification.html."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className="font-semibold text-[#0d9488] hover:underline" onClick={() => void openAck()}>
          Acknowledgment and purpose
        </button>
        <span className="text-slate-300">|</span>
        <button type="button" className="font-semibold text-[#0d9488] hover:underline" onClick={() => void openTerms()}>
          Application terms (template)
        </button>
        <span className="text-slate-300">|</span>
        <Link href="/portal/instructor/cart" className="font-semibold text-[#0d9488] hover:underline">
          Open cart
        </Link>
        <span className="text-slate-300">|</span>
        <a
          href="https://www.modelmugging.org/"
          className="font-semibold text-slate-600 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Blank background form (PDF)
        </a>
      </div>

      <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          Complete the authorization below. Legacy flow used <strong>Add to cart</strong> then checkout; here you can
          add the same line items to <Link href="/portal/instructor/cart">your cart</Link> and/or pay the investigator
          immediately with Stripe.
        </p>
        <p>
          <Link href="/portal/instructor/onboarding-history" className="font-semibold text-[#0d9488] hover:underline">
            Onboarding history
          </Link>{' '}
          shows this step with the rest of your checklist.
        </p>
      </div>

      {msg && <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{msg}</p>}
      {err && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}

      <section className="mb-6 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-800">Pipeline status</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {str(bg?.status || profile?.bgVerificationStatus || profile?.bgverificationStatus) || 'Pending / not started'}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Standard fee today: <span className="font-semibold">{centsToUsd(feeCents)}</span>
          {additionalCents > 0 && (
            <>
              {' '}
              · Additional fee on file: <span className="font-semibold">{centsToUsd(additionalCents)}</span> (
              {addSt || 'status pending'})
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Cart: standard fee {standardInCart ? <strong className="text-teal-900">in cart</strong> : 'not in cart'}
          {additionalCents > 0 && (
            <>
              {' '}
              · additional {additionalInCart ? <strong className="text-teal-900">in cart</strong> : 'not in cart'}
            </>
          )}
        </p>

        {feeCents <= 0 && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Standard investigator fee is <strong>$0</strong> in server config (<code className="rounded bg-amber-100 px-1">MM_BACKGROUND_VERIFICATION_FEE_CENTS</code>
            ). Legacy-style <strong>Add to cart</strong> and Stripe for the standard fee stay disabled until ops set a positive amount.
          </p>
        )}

        {feeCents > 0 && !primaryPaidLike && (
          <div className="mt-4 rounded-xl border border-teal-300 bg-white/95 p-4 text-slate-900 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-900">Add to cart — standard fee</p>
            <p className="mt-1 text-xs text-slate-600">
              Same control as legacy <span className="font-mono">backgroundverification.html</span>: after the form is{' '}
              <span className="font-mono">Submitted</span>, add the fee to your{' '}
              <Link href="/portal/instructor/cart" className="font-semibold text-[#0d9488] underline">
                cart
              </Link>{' '}
              (then checkout from the cart page), or use Stripe below.
            </p>
            {canAddStandardFeeToCart && (
              <button
                type="button"
                disabled={cartBusy === 'std'}
                onClick={() => void addStdCart()}
                className="mt-3 rounded-lg bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
              >
                {cartBusy === 'std' ? 'Adding…' : `Add standard fee to cart (${centsToUsd(feeCents)})`}
              </button>
            )}
            {feeCents > 0 && status === 'Submitted' && standardInCart && (
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                Standard fee is already in your cart —{' '}
                <Link href="/portal/instructor/cart" className="underline">
                  open cart
                </Link>
                .
              </p>
            )}
            {feeCents > 0 && status !== 'Submitted' && !primaryPaidLike && (
              <p className="mt-2 text-xs text-slate-600">
                Save the authorization form below so status becomes <span className="font-mono">Submitted</span>; then
                the <strong>Add to cart</strong> button appears here (legacy behavior).
              </p>
            )}
          </div>
        )}

        {additionalCents > 0 && ['Paid', 'Successful', 'InProgress'].includes(status) && !additionalPaidLike && (
          <div className="mt-4 rounded-xl border border-indigo-300 bg-indigo-50/95 p-4 text-slate-900 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-900">Add to cart — additional fee</p>
            <p className="mt-1 text-xs text-slate-600">
              Legacy flow: after the primary fee is paid, staff may add an additional investigator amount; you can add
              that line to your cart here.
            </p>
            {canAddAdditionalFeeToCart && (
              <button
                type="button"
                disabled={cartBusy === 'add'}
                onClick={() => void addAdditionalCart()}
                className="mt-3 rounded-lg bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                {cartBusy === 'add' ? 'Adding…' : `Add additional fee to cart (${centsToUsd(additionalCents)})`}
              </button>
            )}
            {additionalInCart && (
              <p className="mt-2 text-sm font-semibold text-indigo-950">
                Additional fee is in your cart —{' '}
                <Link href="/portal/instructor/cart" className="underline">
                  open cart
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </section>

      {locked && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This step is locked for editing because your pipeline status is final or in progress. You can still review
          fields below; contact staff if something needs correction.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Authorization</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('firstName')}
            <input
              className={fieldInputClass}
              disabled={locked}
              value={text.firstName ?? ''}
              onChange={(e) => setText((p) => ({ ...p, firstName: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('lastName')}
            <input
              className={fieldInputClass}
              disabled={locked}
              value={text.lastName ?? ''}
              onChange={(e) => setText((p) => ({ ...p, lastName: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('otherName')}
            <input
              className={fieldInputClass}
              disabled={locked}
              value={text.otherName ?? ''}
              onChange={(e) => setText((p) => ({ ...p, otherName: e.target.value }))}
            />
          </label>
          <GooglePlacesAutocomplete
            id="bg-current-address"
            label={<span className="text-sm font-semibold text-slate-700">{labelForFormField('address')}</span>}
            value={text.address ?? ''}
            onChange={(v) => setText((p) => ({ ...p, address: v }))}
            placeholder="Start typing for suggestions"
            className="block sm:col-span-2"
            inputClassName={fieldInputClass}
          />
          <GooglePlacesAutocomplete
            id="bg-prev-address-1"
            label={<span className="text-sm font-semibold text-slate-700">{labelForFormField('previousAddress1')}</span>}
            value={text.previousAddress1 ?? ''}
            onChange={(v) => setText((p) => ({ ...p, previousAddress1: v }))}
            placeholder="Previous address or N/A"
            className="block sm:col-span-2"
            inputClassName={fieldInputClass}
          />
          <GooglePlacesAutocomplete
            id="bg-prev-address-2"
            label={<span className="text-sm font-semibold text-slate-700">{labelForFormField('previousAddress2')}</span>}
            value={text.previousAddress2 ?? ''}
            onChange={(v) => setText((p) => ({ ...p, previousAddress2: v }))}
            placeholder="Other previous address or N/A"
            className="block sm:col-span-2"
            inputClassName={fieldInputClass}
          />

          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-slate-700">{labelForFormField('socialSecurityNumber')}</p>
            {showSsnSingleField ? (
              <input
                className={fieldInputClass}
                disabled={locked}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="XXX-XX-XXXX"
                value={ssnDraft}
                onChange={(e) => setSsnDraft(formatSsnInput(e.target.value))}
              />
            ) : (
              <div className="mt-1 space-y-2">
                <input className={`${fieldInputClass} bg-slate-50`} readOnly value={ssnMaskedDisplay} aria-label="SSN masked" />
                <input
                  className={fieldInputClass}
                  disabled={locked}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter full SSN only if you are replacing what is on file"
                  value={ssnDraft}
                  onChange={(e) => setSsnDraft(formatSsnInput(e.target.value))}
                />
              </div>
            )}
            <p className="mt-1 text-[10px] text-slate-500">Only the last four digits are shown after save; re-enter the full SSN to replace.</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('taxId')}
            <input
              className={fieldInputClass}
              disabled={locked}
              value={/\*{2,}/.test(text.taxId ?? '') ? taxIdDraft : (text.taxId ?? '')}
              onChange={(e) => {
                const v = e.target.value
                if (/\*{2,}/.test(text.taxId ?? '')) setTaxIdDraft(v)
                else setText((p) => ({ ...p, taxId: v }))
              }}
              placeholder="Other government tax ID / country + last four"
            />
          </label>

          <p className="sm:col-span-2 text-sm leading-relaxed text-slate-700">
            The information contained in this application is correct to the best of my knowledge.
          </p>
          <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm text-slate-800">
            <button type="button" className="font-semibold text-[#0d9488] hover:underline" onClick={() => void openTerms()}>
              View terms / authorization language (template)
            </button>
          </div>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('licenseNumber')}
            <input
              className={fieldInputClass}
              disabled={locked}
              value={text.licenseNumber ?? ''}
              onChange={(e) => setText((p) => ({ ...p, licenseNumber: e.target.value }))}
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-slate-700">{labelForFormField('dob')}</p>
            <UsDatePicker
              value={text.dob ?? ''}
              onChange={(v) => setText((p) => ({ ...p, dob: v }))}
              disabled={locked}
              buttonClassName={`${fieldInputClass} justify-start`}
            />
          </div>
          <label className="text-sm font-semibold text-slate-700">
            {labelForFormField('contactNumber')}
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={fieldInputClass}
              disabled={locked}
              placeholder="000-000-0000"
              value={text.contactNumber ?? ''}
              onChange={(e) => setText((p) => ({ ...p, contactNumber: formatUsPhoneInput(e.target.value) }))}
            />
            <p className="mt-1 text-[10px] text-slate-500">US numbers use 10-digit format like other portal forms.</p>
          </label>

          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-slate-700">Supporting PDFs (optional, max 5)</p>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              disabled={locked || uploadBusy}
              className="mt-2 text-sm"
              onChange={onPickPdf}
            />
            {supporting.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {supporting.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {str(r.filename || r.name || r.documentName || `file-${i + 1}`)}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-bold text-[#0d9488] hover:underline"
                      onClick={() => void openInstructorBackgroundVerificationSupportingPdf(i)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={locked}
                      className="text-xs font-bold text-red-700 hover:underline disabled:opacity-40"
                      onClick={async () => {
                        const res = await deleteInstructorBackgroundVerificationSupportingPdf(i)
                        const raw = await res.text()
                        let j: { error?: string } = {}
                        try {
                          j = JSON.parse(raw) as { error?: string }
                        } catch {
                          /* ignore */
                        }
                        if (!res.ok) {
                          setErr(j.error || raw.trim().slice(0, 300) || 'Remove failed')
                          return
                        }
                        setMsg('Attachment removed.')
                        await reload()
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {labelForFormField('electronicSignature')}
            <input
              className={fieldInputClass}
              disabled={locked}
              placeholder="Type name (and email if you like) as your signature"
              value={text.electronicSignature ?? ''}
              onChange={(e) => setText((p) => ({ ...p, electronicSignature: e.target.value }))}
            />
          </label>

          <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-sm font-semibold text-slate-800">{labelForFormField('electronicSignatureDate')}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Date</p>
                <UsDatePicker
                  value={sigDateUs}
                  onChange={setSigDateUs}
                  disabled={locked}
                  buttonClassName={`${fieldInputClass} justify-start`}
                />
              </div>
              <label className="shrink-0 text-sm font-semibold text-slate-700">
                Time
                <input
                  type="time"
                  className={fieldInputClass}
                  disabled={locked}
                  value={sigTimeHm}
                  onChange={(e) => setSigTimeHm(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={locked}
                className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => {
                  const now = new Date()
                  setSigDateUs(crmDateFieldToUs(now.toISOString()))
                  setSigTimeHm(formatTimeHm(now))
                }}
              >
                Set to now
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Stored as <span className="font-mono">{text.electronicSignatureDate || '—'}</span> (US date & time).
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jurisdiction / record codes (office use)</p>
          <p className="mt-1 text-xs text-slate-500">Same grid as legacy “office use only”.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {BOOL_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={Boolean(flags[k])}
                  onChange={(e) => setFlags((p) => ({ ...p, [k]: e.target.checked }))}
                />
                {labelForFormField(k)}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={locked}
            onClick={save}
            className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e] disabled:opacity-50"
          >
            {status === 'Submitted' || status === 'Paid' ? 'Update authorization' : 'Save authorization (Submitted)'}
          </button>
          <button
            type="button"
            onClick={printForm}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Print
          </button>
        </div>
      </div>

      {/* Print-only mirror (also used as HTML source for print window) */}
      <div ref={printRef} className="hidden" aria-hidden>
        <h1 className="text-lg font-bold">Background check authorization (printout)</h1>
        <p>
          Name: {text.firstName} {text.lastName}
        </p>
        <p>Other names: {text.otherName || 'N/A'}</p>
        <p>Address: {text.address || 'N/A'}</p>
        <p>Previous 1: {text.previousAddress1 || 'N/A'}</p>
        <p>Previous 2: {text.previousAddress2 || 'N/A'}</p>
        <p>SSN (as entered or masked): {ssnDraft ? formatSsnInput(ssnDraft) : ssnMaskedDisplay || 'N/A'}</p>
        <p>Tax ID: {taxIdDraft || text.taxId || 'N/A'}</p>
        <p>DOB: {text.dob || 'N/A'}</p>
        <p>Phone: {text.contactNumber || 'N/A'}</p>
        <p>License: {text.licenseNumber || 'N/A'}</p>
        <p>Signature: {text.electronicSignature || '—'}</p>
        <p>Date: {text.electronicSignatureDate || '—'}</p>
      </div>

      {feeCents > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Investigator fee</h2>
          <p className="mt-2 text-sm text-slate-700">
            Fee <span className="font-semibold">{centsToUsd(feeCents)}</span>. After your form is{' '}
            <span className="font-mono text-xs">Submitted</span>, you may <strong>add to cart</strong> (legacy) and/or pay
            on this page with Stripe. Paid status is recorded on your background record.
          </p>
          {canAddStandardFeeToCart && (
            <button
              type="button"
              disabled={cartBusy === 'std'}
              onClick={() => void addStdCart()}
              className="mt-3 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
            >
              {cartBusy === 'std' ? 'Adding…' : 'Add standard fee to cart'}
            </button>
          )}
          {standardInCart && (
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Standard fee is in your cart —{' '}
              <Link href="/portal/instructor/cart" className="underline">
                open cart
              </Link>{' '}
              or pay below with Stripe.
            </p>
          )}
          {!stripeOk && <p className="mt-2 text-sm text-amber-800">Stripe is not configured or publishable key is missing.</p>}
          {stripeOk && status === 'Submitted' && (
            <div className="mt-4">
              {!primarySecret ? (
                <button
                  type="button"
                  disabled={primaryOpening}
                  onClick={startPrimaryPayment}
                  className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
                >
                  {primaryOpening ? 'Starting…' : `Pay with Stripe (${centsToUsd(feeCents)})`}
                </button>
              ) : (
                <Elements
                  stripe={stripePromise!}
                  options={{
                    clientSecret: primarySecret,
                    appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
                  }}
                >
                  <div className="mt-3 max-w-lg">
                    <PrimaryPayForm
                      onPaid={() => {
                        setMsg('Payment recorded. Thank you.')
                        setPrimarySecret('')
                        void reload().then(() => emitInstructorCartChanged())
                      }}
                    />
                  </div>
                </Elements>
              )}
            </div>
          )}
          {stripeOk && status && status !== 'Submitted' && !['Paid', 'Successful', 'InProgress', 'Unsuccessful'].includes(status) && (
            <p className="mt-2 text-sm text-slate-600">Save the form to reach Submitted before paying or adding to cart.</p>
          )}
        </div>
      )}

      {feeCents <= 0 && (
        <p className="mt-4 text-sm text-slate-600">
          Standard background fee is set to $0 in server config. Staff may still collect payment offline.
        </p>
      )}

      {additionalCents > 0 && ['Paid', 'Successful', 'InProgress'].includes(status) && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-indigo-800">Additional investigator fee</h2>
          <p className="mt-2 text-sm text-slate-700">
            Amount due: <span className="font-semibold">{centsToUsd(additionalCents)}</span>. Additional status:{' '}
            <span className="font-mono text-xs">{addSt || '—'}</span>
          </p>
          {canAddAdditionalFeeToCart && (
            <button
              type="button"
              disabled={cartBusy === 'add'}
              onClick={() => void addAdditionalCart()}
              className="mt-3 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {cartBusy === 'add' ? 'Adding…' : 'Add additional fee to cart'}
            </button>
          )}
          {additionalInCart && (
            <p className="mt-2 text-sm font-medium text-indigo-900">
              Additional fee is in your cart —{' '}
              <Link href="/portal/instructor/cart" className="underline">
                open cart
              </Link>{' '}
              or pay below.
            </p>
          )}
          {!additionalPaidLike && (
            <div className="mt-4">
              {!stripeOk ? (
                <p className="text-sm text-amber-900">Stripe is not configured — use <strong>cart</strong> above if your site charges via cart checkout.</p>
              ) : !additionalSecret ? (
                <button
                  type="button"
                  disabled={additionalOpening}
                  onClick={startAdditionalPayment}
                  className="rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  {additionalOpening ? 'Starting…' : 'Pay additional fee with Stripe'}
                </button>
              ) : (
                <Elements
                  stripe={stripePromise!}
                  options={{
                    clientSecret: additionalSecret,
                    appearance: { theme: 'stripe', variables: { colorPrimary: '#312e81' } },
                  }}
                >
                  <div className="mt-3 max-w-lg">
                    <AdditionalPayForm
                      onPaid={() => {
                        setMsg('Additional payment recorded.')
                        setAdditionalSecret('')
                        void reload().then(() => emitInstructorCartChanged())
                      }}
                    />
                  </div>
                </Elements>
              )}
            </div>
          )}
        </div>
      )}

      {ackOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Acknowledgment and purpose</h2>
              <button type="button" className="text-sm font-bold text-slate-600 hover:text-slate-900" onClick={() => setAckOpen(false)}>
                Close
              </button>
            </div>
            {ackLoadError && <p className="mb-3 text-sm text-red-700">{ackLoadError}</p>}
            {ackHtml ? <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: ackHtml }} /> : null}
          </div>
        </div>
      )}

      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Terms / authorization language</h2>
              <button
                type="button"
                className="text-sm font-bold text-slate-600 hover:text-slate-900"
                onClick={() => setTermsModalOpen(false)}
              >
                Close
              </button>
            </div>
            {termsLoadError && <p className="mb-3 text-sm text-red-700">{termsLoadError}</p>}
            {termsHtml ? (
              <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: termsHtml }} />
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
