'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  confirmInstructorBackgroundVerificationAdditionalPayment,
  confirmInstructorBackgroundVerificationPayment,
  confirmInstructorCartPayment,
  createInstructorBackgroundVerificationAdditionalPaymentIntent,
  createInstructorBackgroundVerificationPaymentIntent,
  createInstructorCartPaymentIntent,
  fetchInstructorBackgroundVerification,
  fetchInstructorBackgroundVerificationFee,
  fetchInstructorCrmView,
  fetchMe,
  fetchStripeConfig,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray, legacyAsRecord } from '@/lib/legacyHelpers'
import {
  emitInstructorCartChanged,
  instructorCartTotalUsd,
  parseCartAmountUsd,
} from '@/lib/instructorCartSummary'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

async function parseJsonBody(res: Response): Promise<{ raw: string; json: Record<string, unknown> }> {
  const raw = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(raw) as Record<string, unknown>
  } catch {
    /* ignore */
  }
  return { raw, json }
}

function isStandardBackgroundCartType(t: string): boolean {
  const s = t.trim().toLowerCase()
  return s.includes('background') && !s.includes('additional')
}

function isAdditionalBackgroundCartType(t: string): boolean {
  const s = t.trim().toLowerCase()
  return s.includes('additional') && s.includes('background')
}

function legacyCartPayHint(typeStr: string): { href: string; label: string } | null {
  const t = typeStr.trim().toLowerCase()
  if (t.includes('t-shirt') || t.includes('polo')) {
    return { href: '/portal/instructor/t-shirt', label: 'Open T-shirt & polo orders' }
  }
  if (t.includes('expense pool') && !t.includes('accommodation') && !t.includes('room')) {
    return { href: '/portal/instructor/expense-pool', label: 'Open expense pool' }
  }
  if (t.includes('accommodation') || t.includes('room')) {
    return { href: '/portal/instructor/expense-pool', label: 'Open expense pool (accommodation)' }
  }
  return null
}

function CartAllPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [localErr, setLocalErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setLocalErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setLocalErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setLocalErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorCartPayment(piId)
    const { raw, json } = await parseJsonBody(res)
    if (!res.ok) {
      setLocalErr(str(json.error) || raw.slice(0, 400) || 'Could not record payment.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {localErr && <p className="text-sm font-medium text-red-600">{localErr}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay all & complete'}
      </button>
    </form>
  )
}

function CartPrimaryPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [localErr, setLocalErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setLocalErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setLocalErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setLocalErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorBackgroundVerificationPayment(piId)
    const { raw, json } = await parseJsonBody(res)
    if (!res.ok) {
      setLocalErr(str(json.error) || raw.slice(0, 400) || 'Could not record payment.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {localErr && <p className="text-sm font-medium text-red-600">{localErr}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay & complete'}
      </button>
    </form>
  )
}

function CartAdditionalPayForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [localErr, setLocalErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setLocalErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setLocalErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setLocalErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorBackgroundVerificationAdditionalPayment(piId)
    const { raw, json } = await parseJsonBody(res)
    if (!res.ok) {
      setLocalErr(str(json.error) || raw.slice(0, 400) || 'Could not record payment.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {localErr && <p className="text-sm font-medium text-red-600">{localErr}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay additional & complete'}
      </button>
    </form>
  )
}

export default function InstructorCartPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [bg, setBg] = useState<Record<string, unknown> | null>(null)
  const [feeInfo, setFeeInfo] = useState<{
    feeCents: number
    additionalCents: number
    stripeEnabled: boolean
  } | null>(null)
  const [err, setErr] = useState('')
  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null)
  const [standardSecret, setStandardSecret] = useState('')
  const [additionalSecret, setAdditionalSecret] = useState('')
  const [standardOpening, setStandardOpening] = useState(false)
  const [additionalOpening, setAdditionalOpening] = useState(false)
  const [cartAllSecret, setCartAllSecret] = useState('')
  const [cartAllOpening, setCartAllOpening] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(''), 6000)
    return () => clearTimeout(t)
  }, [successMsg])

  const reload = useCallback(async () => {
    setErr('')
    const [cartData, b, f] = await Promise.all([
      fetchInstructorCrmView('cart').catch(() => []),
      fetchInstructorBackgroundVerification().catch(() => ({})),
      fetchInstructorBackgroundVerificationFee().catch(() => null),
    ])
    setRows(legacyAsObjectArray(cartData))
    setBg(legacyAsRecord(b))
    setFeeInfo(f)
    emitInstructorCartChanged()
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/cart')
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
    if (!me) return
    reload()
  }, [me, reload])

  useEffect(() => {
    fetchStripeConfig().then((c) => {
      if (c?.publishableKey) loadStripe(c.publishableKey).then(setStripePromise)
    })
  }, [])

  const total = instructorCartTotalUsd(rows)
  const status = str(bg?.status).trim()
  const addSt = str(bg?.additionalVerificationStatus).trim()
  const feeCents = feeInfo?.feeCents ?? 0
  const additionalCents = feeInfo?.additionalCents ?? 0
  const stripeOk = feeInfo?.stripeEnabled === true && !!stripePromise

  const hasStandardBgRow = useMemo(() => rows.some((r) => isStandardBackgroundCartType(str(r.type))), [rows])
  const hasAdditionalBgRow = useMemo(() => rows.some((r) => isAdditionalBackgroundCartType(str(r.type))), [rows])

  const statusNorm = status.toLowerCase()
  const submittedLike = statusNorm === 'submitted'
  const primaryPaidLike = ['paid', 'successful', 'inprogress'].includes(statusNorm)
  const additionalPaidLike = ['paid', 'successful', 'inprogress'].includes(addSt.toLowerCase())

  const canPayStandardFromCart =
    stripeOk &&
    feeCents > 0 &&
    submittedLike &&
    hasStandardBgRow &&
    !['paid', 'successful', 'unsuccessful', 'inprogress'].includes(statusNorm)

  const canPayAdditionalFromCart =
    stripeOk &&
    additionalCents > 0 &&
    primaryPaidLike &&
    !additionalPaidLike &&
    hasAdditionalBgRow

  const canPayAllFromCart = stripeOk && rows.length > 0 && total > 0

  const otherRows = useMemo(
    () =>
      rows.filter((r) => {
        const t = str(r.type)
        return !isStandardBackgroundCartType(t) && !isAdditionalBackgroundCartType(t)
      }),
    [rows],
  )

  async function startStandardPayment() {
    setStandardOpening(true)
    setErr('')
    setStandardSecret('')
    try {
      const res = await createInstructorBackgroundVerificationPaymentIntent()
      const { raw, json } = await parseJsonBody(res)
      if (!res.ok) {
        setErr(str(json.error) || raw.slice(0, 400) || 'Could not start payment')
        return
      }
      const cs = str(json.clientSecret)
      if (cs) setStandardSecret(cs)
    } finally {
      setStandardOpening(false)
    }
  }

  async function startCartAllPayment() {
    setCartAllOpening(true)
    setErr('')
    setCartAllSecret('')
    try {
      const res = await createInstructorCartPaymentIntent()
      const { raw, json } = await parseJsonBody(res)
      if (!res.ok) {
        setErr(str(json.error) || raw.slice(0, 400) || 'Could not start payment')
        return
      }
      const cs = str(json.clientSecret)
      if (cs) setCartAllSecret(cs)
    } finally {
      setCartAllOpening(false)
    }
  }

  async function startAdditionalPayment() {
    setAdditionalOpening(true)
    setErr('')
    setAdditionalSecret('')
    try {
      const res = await createInstructorBackgroundVerificationAdditionalPaymentIntent()
      const { raw, json } = await parseJsonBody(res)
      if (!res.ok) {
        setErr(str(json.error) || raw.slice(0, 400) || 'Could not start additional payment')
        return
      }
      const cs = str(json.clientSecret)
      if (cs) setAdditionalSecret(cs)
    } finally {
      setAdditionalOpening(false)
    }
  }

  return (
    <>
      <PortalPageHeader
        title="Cart"
        subtitle="Review all line items and pay everything in one secure Stripe checkout (legacy cart parity). Receipt emails go to you and admin."
      />

      {err && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}
      {successMsg && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
          {successMsg}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-sm">
          Your cart is empty. Add fees from{' '}
          <Link href="/portal/instructor/verification" className="font-semibold text-[#0d9488] hover:underline">
            Background verification
          </Link>
          , save a shirt order from{' '}
          <Link href="/portal/instructor/t-shirt" className="font-semibold text-[#0d9488] hover:underline">
            Shirts/Uniform
          </Link>{' '}
          (<span className="font-medium">Save &amp; add to cart</span>), or other flows that support{' '}
          <strong>Add to cart</strong>.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cart summary</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {rows.length} {rows.length === 1 ? 'item' : 'items'}
                {total > 0 ? (
                  <>
                    {' '}
                    · Total <span className="text-[#0d9488]">${total.toFixed(2)}</span>
                  </>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void reload()}
              className="shrink-0 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          <section className="mb-8 rounded-2xl border-2 border-[#0d9488] bg-gradient-to-br from-teal-50 to-white p-6 shadow-md">
              <h2 className="text-base font-bold uppercase tracking-wide text-teal-900">Checkout</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                Pay all cart items in one transaction with Stripe. After payment, cart lines clear, related records
                update (shirts, expense pool, background verification), transactions are recorded, and confirmation
                emails are sent using legacy templates.
              </p>

              {canPayAllFromCart && (
                <div className="mt-5 rounded-xl border-2 border-[#0d9488] bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Pay entire cart</p>
                  <p className="mt-1 text-xs text-slate-600">
                    One charge for{' '}
                    <span className="font-mono font-semibold text-[#0d9488]">${total.toFixed(2)}</span> ·{' '}
                    {rows.length} {rows.length === 1 ? 'item' : 'items'}
                  </p>
                  {!cartAllSecret ? (
                    <button
                      type="button"
                      disabled={cartAllOpening}
                      onClick={() => void startCartAllPayment()}
                      className="mt-4 rounded-xl bg-[#0f172a] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
                    >
                      {cartAllOpening ? 'Starting…' : `Checkout — pay $${total.toFixed(2)} with card`}
                    </button>
                  ) : (
                    <Elements
                      stripe={stripePromise!}
                      options={{
                        clientSecret: cartAllSecret,
                        appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
                      }}
                    >
                      <div className="mt-4 max-w-lg">
                        <CartAllPayForm
                          onPaid={() => {
                            setCartAllSecret('')
                            setStandardSecret('')
                            setAdditionalSecret('')
                            setSuccessMsg('Payment received. Cart cleared and records updated.')
                            void reload()
                          }}
                        />
                      </div>
                    </Elements>
                  )}
                </div>
              )}

              {!stripeOk && rows.length > 0 && (
                <p className="mt-4 text-sm text-amber-900">
                  Stripe is not configured — card checkout is unavailable until ops enables Stripe.
                </p>
              )}

              {canPayStandardFromCart && !canPayAllFromCart && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Standard background verification fee</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Amount <span className="font-mono">${(feeCents / 100).toFixed(2)}</span> · Form status{' '}
                    <span className="font-mono">{status}</span>
                  </p>
                  {!standardSecret ? (
                    <button
                      type="button"
                      disabled={standardOpening}
                      onClick={() => void startStandardPayment()}
                      className="mt-3 rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
                    >
                      {standardOpening ? 'Starting…' : `Checkout — pay $${(feeCents / 100).toFixed(2)} with card`}
                    </button>
                  ) : (
                    <Elements
                      stripe={stripePromise!}
                      options={{
                        clientSecret: standardSecret,
                        appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
                      }}
                    >
                      <div className="mt-4 max-w-lg">
                        <CartPrimaryPayForm
                          onPaid={() => {
                            setStandardSecret('')
                            setSuccessMsg('Standard fee paid. Cart updated.')
                            void reload()
                          }}
                        />
                      </div>
                    </Elements>
                  )}
                </div>
              )}

              {hasStandardBgRow && !canPayStandardFromCart && stripeOk && feeCents > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <strong>Standard background fee</strong> is in your cart but cannot be paid here yet (
                  <span className="font-mono">status must be Submitted</span>
                  {statusNorm === 'paid' ? '; it looks already paid — try Refresh.' : ''}).{' '}
                  <Link href="/portal/instructor/verification" className="font-semibold text-[#0b8f7a] underline">
                    Open background verification
                  </Link>{' '}
                  to finish the form or review status.
                </div>
              )}

              {canPayAdditionalFromCart && !canPayAllFromCart && (
                <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-indigo-950">Additional background verification fee</p>
                  <p className="mt-1 text-xs text-slate-700">
                    Amount <span className="font-mono">${(additionalCents / 100).toFixed(2)}</span>
                  </p>
                  {!additionalSecret ? (
                    <button
                      type="button"
                      disabled={additionalOpening}
                      onClick={() => void startAdditionalPayment()}
                      className="mt-3 rounded-xl bg-indigo-900 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                    >
                      {additionalOpening ? 'Starting…' : `Checkout — pay $${(additionalCents / 100).toFixed(2)} with card`}
                    </button>
                  ) : (
                    <Elements
                      stripe={stripePromise!}
                      options={{
                        clientSecret: additionalSecret,
                        appearance: { theme: 'stripe', variables: { colorPrimary: '#312e81' } },
                      }}
                    >
                      <div className="mt-4 max-w-lg">
                        <CartAdditionalPayForm
                          onPaid={() => {
                            setAdditionalSecret('')
                            setSuccessMsg('Additional fee paid. Cart updated.')
                            void reload()
                          }}
                        />
                      </div>
                    </Elements>
                  )}
                </div>
              )}

              {hasAdditionalBgRow && !canPayAdditionalFromCart && stripeOk && additionalCents > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <strong>Additional background fee</strong> is in your cart but the primary fee must be paid first, or
                  the additional fee is already settled.{' '}
                  <Link href="/portal/instructor/verification" className="font-semibold text-[#0b8f7a] underline">
                    Background verification
                  </Link>
                </div>
              )}

              {otherRows.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-900">Cart line items</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {canPayAllFromCart
                      ? 'Included in Pay entire cart above. You can also open the source page to edit before paying.'
                      : 'These types are paid on their own portal pages when Stripe checkout is unavailable.'}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {otherRows.map((r, i) => {
                      const t = str(r.type)
                      const hint = legacyCartPayHint(t)
                      const amt = parseCartAmountUsd(r.amount)
                      return (
                        <li
                          key={i}
                          className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{t || '—'}</p>
                            <p className="text-xs text-slate-600">
                              {amt > 0 ? `$${amt.toFixed(2)}` : str(r.amount)} · {str(r.status)}
                            </p>
                          </div>
                          {hint ? (
                            <Link
                              href={hint.href}
                              className="inline-flex shrink-0 justify-center rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
                            >
                              {hint.label}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">Contact staff if you need a pay link for this type.</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-800">Type</th>
                    <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-800">Amount ($)</th>
                    <th className="hidden px-4 py-3 font-semibold text-slate-800 sm:table-cell">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const amt = parseCartAmountUsd(row.amount)
                    const when = str(row.createdAt || row.updatedAt || row.createdDate || '')
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                        <td className="align-top px-4 py-4 font-medium text-slate-900">
                          <span className="block max-w-md leading-snug">{str(row.type) || '—'}</span>
                        </td>
                        <td className="align-top px-4 py-4 text-slate-700">{str(row.status) || '—'}</td>
                        <td className="align-top whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-slate-900">
                          {amt > 0 ? `$${amt.toFixed(2)}` : str(row.amount) || '—'}
                        </td>
                        <td className="hidden align-top px-4 py-4 text-xs text-slate-600 sm:table-cell">{when || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Need the full authorization form?{' '}
            <Link href="/portal/instructor/verification" className="font-semibold text-[#0d9488] hover:underline">
              Background verification
            </Link>
          </p>
        </>
      )}
    </>
  )
}
