/** Stripe card checkout (linked from donation page tiers and location pages). */
export const DONATE_STRIPE_CHECKOUT_PATH = '/donate-to-empowerment/card-payment'

/** Shared PayPal / Stripe brand images (San Diego + donate-to-empowerment). */
export const DONATE_PAYPAL_BUTTON_IMAGE = {
  imageSrc: '/donate/paypal-donate.png',
  imageAlt: 'Donate with PayPal',
  imageWidth: 400,
  imageHeight: 242,
} as const

export const DONATE_STRIPE_BUTTON_IMAGE = {
  imageSrc: '/donate/stripe-donate.png',
  imageAlt: 'Donate or pay with Stripe',
  imageWidth: 400,
  imageHeight: 242,
} as const
