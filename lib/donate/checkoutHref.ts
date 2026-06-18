import { DONATE_STRIPE_CHECKOUT_PATH } from './constants'

export type DonateCheckoutParams = {
  amount?: number | null
  support?: string
  acknowledgment?: string
}

/** Stripe checkout page with optional amount and allocation metadata. */
export function buildDonateStripeHref(
  stripeHref: string,
  params: DonateCheckoutParams = {},
): string {
  const base = stripeHref.startsWith('/') ? stripeHref : `/${stripeHref}`
  const path = base.replace(/\?.*$/, '').replace(/\/$/, '') || DONATE_STRIPE_CHECKOUT_PATH
  const q = new URLSearchParams()

  if (params.amount != null && params.amount > 0) {
    q.set('amount', String(params.amount))
  }
  if (params.support?.trim()) q.set('support', params.support.trim())
  if (params.acknowledgment?.trim()) q.set('ack', params.acknowledgment.trim())

  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}
