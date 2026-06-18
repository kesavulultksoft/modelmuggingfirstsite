'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { DONATE_STRIPE_CHECKOUT_PATH } from '@/lib/donate/constants'
import { formatInlineBackLabel, formatTitleCase } from '@/lib/formatTitleCase'
import { createPaymentIntent, fetchStripeConfig } from '@/lib/portalApi'

function CheckoutForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErr('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })
    setLoading(false)
    if (error) setErr(error.message || 'Payment could not complete')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PaymentElement />
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-2xl bg-[#0f172a] py-4 text-base font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Complete donation'}
      </button>
    </form>
  )
}

function DonateStripeCheckoutInner() {
  const sp = useSearchParams()
  const paid = sp.get('paid') === '1'
  const urlAmount = sp.get('amount')?.trim() || '50'
  const urlSupport = sp.get('support')?.trim() || ''
  const urlAck = sp.get('ack')?.trim() || ''
  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [amount, setAmount] = useState(urlAmount)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [step, setStep] = useState(1)

  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${DONATE_STRIPE_CHECKOUT_PATH}?paid=1`
      : `${DONATE_STRIPE_CHECKOUT_PATH}?paid=1`

  useEffect(() => {
    fetchStripeConfig().then((c) => {
      if (c?.publishableKey) {
        loadStripe(c.publishableKey).then(setStripePromise)
      }
    })
  }, [])

  async function startPayment(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    const n = parseFloat(amount)
    if (!(n >= 1)) {
      setErr('Minimum donation $1')
      return
    }
    const res = await createPaymentIntent(amount, {
      type: 'donation',
      email: email || 'guest',
      name: name || 'Supporter',
      ...(urlSupport ? { support: urlSupport } : {}),
      ...(urlAck ? { acknowledgment: urlAck } : {}),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr((j as { error?: string }).error || 'Could not start payment. Is Stripe configured?')
      return
    }
    if ((j as { clientSecret?: string }).clientSecret) {
      setClientSecret((j as { clientSecret: string }).clientSecret)
      setStep(2)
    }
  }

  if (paid) {
    return (
      <div className="site-page-shell">
        <div className="site-page-inner-wide flex justify-center py-16 sm:py-20">
          <div className="w-full max-w-lg text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#0f172a]">
              Thank you
            </p>
            <p className="mt-4 text-slate-600">Your support helps keep this training accessible.</p>
            <Link
              href="/donate-to-empowerment/"
              className="mt-8 inline-block font-semibold text-[#0d9488] hover:underline"
            >
              {formatTitleCase('Back to Donate to Empowerment')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="site-page-shell">
      <div className="site-page-inner-wide flex justify-center py-12 sm:py-16">
        <div className="w-full max-w-lg">
          <Link href="/donate-to-empowerment/" className="text-sm font-semibold text-teal-700 hover:underline">
            {formatInlineBackLabel('← Donate to Empowerment')}
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-[#0d9488]">Card payment</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0f172a] sm:text-4xl">
            Secure donation
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-600">
            Secure payment via Stripe. Model Mugging is a 501(c)(3) nonprofit — your gift fuels scholarships
            and program quality.
          </p>
          {urlSupport || urlAck ? (
            <p className="mt-2 max-w-md text-xs text-slate-500">
              {urlSupport ? <>Support allocation: {urlSupport}. </> : null}
              {urlAck ? <>Recipient acknowledgment: {urlAck}</> : null}
            </p>
          ) : null}

          {step === 1 ? (
            <form
              onSubmit={startPayment}
              className="mt-10 space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div>
                <label className="text-sm font-semibold text-slate-700">Amount (USD)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['25', '50', '100', '250'].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold ${
                        amount === a
                          ? 'bg-[#0f172a] text-white'
                          : 'border border-slate-200 text-slate-700 hover:border-[#00d4aa]'
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Email (for receipt)</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {err ? <p className="text-sm text-red-600">{err}</p> : null}
              <button
                type="submit"
                disabled={!stripePromise}
                className="w-full rounded-2xl bg-[#0f172a] py-4 font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
              >
                Continue to payment
              </button>
              {!stripePromise ? (
                <p className="text-center text-xs text-amber-700">Stripe not configured on API.</p>
              ) : null}
            </form>
          ) : null}

          {step === 2 && clientSecret && stripePromise ? (
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
                }}
              >
                <CheckoutForm returnUrl={returnUrl} />
              </Elements>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function DonateStripeCheckoutView() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading…</div>}>
      <DonateStripeCheckoutInner />
    </Suspense>
  )
}
