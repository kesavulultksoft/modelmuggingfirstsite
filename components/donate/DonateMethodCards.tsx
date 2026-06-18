import Image from 'next/image'
import Link from 'next/link'
import { formatLocationLabel } from '@/components/location/locationText'
import { PayPalDonateForm, PayPalDonateImageButton } from '@/components/donate/PayPalDonateForm'

/** Shared card shell for PayPal + Stripe donate options (location pages and /donate-to-empowerment/). */
export const DONATE_CARD =
  'flex h-full min-h-[140px] w-full min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2] hover:border-slate-300 hover:bg-slate-50 sm:px-6'

export const DONATE_CARD_COMPACT =
  'flex h-full min-h-[72px] w-full min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2] hover:border-slate-300 hover:bg-slate-50 sm:px-4'

const DONATE_IMAGE_CLASS = 'h-auto max-h-[160px] w-full object-contain'
const DONATE_IMAGE_CLASS_COMPACT = 'h-auto max-h-[80px] w-full max-w-[200px] object-contain'

export function DonatePayPalImageLink({
  href,
  label,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  compact,
}: {
  href: string
  label: string
  imageSrc: string
  imageAlt: string
  imageWidth?: number
  imageHeight?: number
  compact?: boolean
}) {
  return (
    <Link href={href} className={compact ? DONATE_CARD_COMPACT : DONATE_CARD}>
      <Image
        src={imageSrc}
        alt={imageAlt || label}
        width={imageWidth ?? 400}
        height={imageHeight ?? 242}
        className={compact ? DONATE_IMAGE_CLASS_COMPACT : DONATE_IMAGE_CLASS}
        sizes="(max-width: 640px) 100vw, 280px"
      />
    </Link>
  )
}

export function DonatePayPalFormCard({ hostedButtonId }: { hostedButtonId: string }) {
  return (
    <div className={DONATE_CARD}>
      <PayPalDonateForm hostedButtonId={hostedButtonId} className="w-full" />
    </div>
  )
}

export function DonatePayPalImageFormCard({
  hostedButtonId,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  compact,
}: {
  hostedButtonId: string
  imageSrc: string
  imageAlt: string
  imageWidth?: number
  imageHeight?: number
  compact?: boolean
}) {
  return (
    <div className={compact ? DONATE_CARD_COMPACT : DONATE_CARD}>
      <PayPalDonateImageButton
        hostedButtonId={hostedButtonId}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        compact={compact}
      />
    </div>
  )
}

export function DonateStripeImageLink({
  href,
  label,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  compact,
}: {
  href: string
  label: string
  imageSrc: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  compact?: boolean
}) {
  return (
    <Link href={href} className={compact ? DONATE_CARD_COMPACT : DONATE_CARD}>
      <Image
        src={imageSrc}
        alt={imageAlt || label}
        width={imageWidth ?? 400}
        height={imageHeight ?? 242}
        className={compact ? DONATE_IMAGE_CLASS_COMPACT : DONATE_IMAGE_CLASS}
        sizes="(max-width: 640px) 100vw, 280px"
      />
    </Link>
  )
}

export function DonateStripeLinkCard({ href, label }: { href: string; label: string }) {
  const text = formatLocationLabel(label)
  const stripeMatch = text.match(/^(.*?)(\s*\(stripe\))$/i)
  const main = stripeMatch ? stripeMatch[1].trim() : text
  const suffix = stripeMatch?.[2]?.trim() ?? ''

  return (
    <Link href={href} className={DONATE_CARD}>
      <span className="text-base font-bold leading-snug tracking-tight sm:text-lg">
        <span className="text-[#1f497d]">{main}</span>
        {suffix ? <span className="text-[#635bff]"> {suffix}</span> : null}
      </span>
    </Link>
  )
}

type DonateMethodPairProps = {
  paypal?:
    | { kind: 'image-link'; href: string; label: string; imageSrc: string; imageAlt?: string; imageWidth?: number; imageHeight?: number }
    | { kind: 'hosted-form'; hostedButtonId: string }
    | {
        kind: 'hosted-form-image'
        hostedButtonId: string
        imageSrc: string
        imageAlt: string
        imageWidth?: number
        imageHeight?: number
      }
  stripe?:
    | { href: string; label: string }
    | {
        href: string
        label: string
        imageSrc: string
        imageAlt?: string
        imageWidth?: number
        imageHeight?: number
      }
  className?: string
  /** ~50% image height for location page main-column donate block. */
  compactImages?: boolean
}

function renderPayPalOption(
  paypal: NonNullable<DonateMethodPairProps['paypal']>,
  compact?: boolean,
) {
  if (paypal.kind === 'hosted-form-image') {
    return (
      <DonatePayPalImageFormCard
        hostedButtonId={paypal.hostedButtonId}
        imageSrc={paypal.imageSrc}
        imageAlt={paypal.imageAlt}
        imageWidth={paypal.imageWidth}
        imageHeight={paypal.imageHeight}
        compact={compact}
      />
    )
  }
  if (paypal.kind === 'hosted-form') {
    return <DonatePayPalFormCard hostedButtonId={paypal.hostedButtonId} />
  }
  return (
    <DonatePayPalImageLink
      href={paypal.href}
      label={paypal.label}
      imageSrc={paypal.imageSrc}
      imageAlt={paypal.imageAlt || paypal.label}
      imageWidth={paypal.imageWidth}
      imageHeight={paypal.imageHeight}
      compact={compact}
    />
  )
}

/** PayPal and Stripe side by side — equal columns on sm+, stacked on mobile. */
export function DonateMethodPair({
  paypal,
  stripe,
  className = '',
  compactImages = false,
}: DonateMethodPairProps) {
  if (!paypal && !stripe) return null

  return (
    <div
      className={`grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch sm:gap-6 ${className}`.trim()}
    >
      {paypal ? (
        <div className="flex w-full min-w-0">{renderPayPalOption(paypal, compactImages)}</div>
      ) : null}
      {stripe ? (
        <div className="flex w-full min-w-0">
          {'imageSrc' in stripe && stripe.imageSrc ? (
            <DonateStripeImageLink
              href={stripe.href}
              label={stripe.label}
              imageSrc={stripe.imageSrc}
              imageAlt={stripe.imageAlt}
              imageWidth={stripe.imageWidth}
              imageHeight={stripe.imageHeight}
              compact={compactImages}
            />
          ) : (
            <DonateStripeLinkCard href={stripe.href} label={stripe.label} />
          )}
        </div>
      ) : null}
    </div>
  )
}
