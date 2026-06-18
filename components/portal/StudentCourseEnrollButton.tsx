'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  createEnrollmentPaymentIntent,
  enrollInCourse,
  fetchStripeConfig,
} from '@/lib/portalApi'
import { feeDisplayToCents } from '@/lib/courseFee'
import { removeStudentCartCourseId } from '@/lib/studentCart'
import type { CourseDTO } from '@/lib/types'

function CheckoutForm({
  courseId,
  attendeeCount,
  onEnrolled,
}: {
  courseId: string
  attendeeCount: number
  onEnrolled: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState<'idle' | 'paying' | 'enrolling'>('idle')
  const busy = phase !== 'idle'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPhase('paying')
    setErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })
    if (error) {
      setPhase('idle')
      setErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setPhase('idle')
      setErr('Payment did not return a payment reference. Try again.')
      return
    }
    setPhase('enrolling')
    const res = await enrollInCourse(courseId, piId, attendeeCount)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPhase('idle')
      setErr((j as { error?: string }).error || 'Enrollment failed after payment')
      return
    }
    onEnrolled()
  }

  const buttonLabel =
    phase === 'paying'
      ? 'Processing payment…'
      : phase === 'enrolling'
        ? 'Completing enrollment…'
        : 'Pay & enroll'

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      {busy ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/85 px-4 text-center backdrop-blur-[1px]"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-slate-800">{buttonLabel}</p>
          <p className="mt-1 text-xs text-slate-500">Please keep this page open.</p>
        </div>
      ) : null}
      <PaymentElement />
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-xl bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </form>
  )
}

export default function StudentCourseEnrollButton({
  course,
  attendeeCount = 1,
  onEnrolled,
}: {
  course: CourseDTO
  attendeeCount?: number
  onEnrolled: () => void
}) {
  const headcount = Math.max(1, Math.min(20, attendeeCount))
  const unitCents = feeDisplayToCents(course.feeDisplay)
  const cents = unitCents * headcount

  function completeEnrollment() {
    removeStudentCartCourseId(course.id)
    onEnrolled()
  }
  const [stripePromise, setStripePromise] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [err, setErr] = useState('')
  const [opening, setOpening] = useState(false)
  const [freeErr, setFreeErr] = useState('')

  useEffect(() => {
    fetchStripeConfig().then((c) => {
      if (c?.publishableKey) {
        loadStripe(c.publishableKey).then(setStripePromise)
      }
    })
  }, [])

  async function startPaid(e: React.MouseEvent) {
    e.preventDefault()
    setErr('')
    setOpening(true)
    const res = await createEnrollmentPaymentIntent(course.id, headcount)
    const j = await res.json().catch(() => ({}))
    setOpening(false)
    if (!res.ok) {
      setErr((j as { error?: string }).error || 'Could not start payment. Is Stripe configured?')
      return
    }
    if ((j as { clientSecret?: string }).clientSecret) {
      setClientSecret((j as { clientSecret: string }).clientSecret)
    }
  }

  if (cents <= 0) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={async () => {
            setFreeErr('')
            const res = await enrollInCourse(course.id, undefined, headcount)
            const j = await res.json().catch(() => ({}))
            if (!res.ok) {
              setFreeErr((j as { error?: string }).error || 'Could not enroll')
              return
            }
            completeEnrollment()
          }}
          className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
        >
          Enroll (no charge)
        </button>
        {freeErr && <p className="max-w-xs text-right text-xs text-red-600">{freeErr}</p>}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={opening || !stripePromise}
          onClick={startPaid}
          className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
        >
          {opening ? 'Starting…' : 'Pay & enroll'}
        </button>
        {!stripePromise && <p className="text-xs text-amber-700">Stripe not configured.</p>}
        {err && <p className="max-w-xs text-right text-xs text-red-600">{err}</p>}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">
        Complete payment —{' '}
        {headcount > 1 && course.feeDisplay
          ? `${course.feeDisplay} × ${headcount} = $${((unitCents * headcount) / 100).toFixed(2)}`
          : course.feeDisplay}
      </p>
      {stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
          }}
        >
          <CheckoutForm courseId={course.id} attendeeCount={headcount} onEnrolled={onEnrolled} />
        </Elements>
      )}
    </div>
  )
}
