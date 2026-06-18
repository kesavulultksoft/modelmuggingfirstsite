import { formatLocationLabel } from '@/components/location/locationText'
import { DonateMethodPair } from '@/components/donate/DonateMethodCards'

export type SupportModelMuggingDonateProps = {
  title: string
  intro: string
  footnote?: string
  paypal: {
    hostedButtonId: string
    imageSrc: string
    imageAlt: string
    imageWidth?: number
    imageHeight?: number
    /** On donate-to-empowerment: image submits PayPal form. On city pages: image links to donation page. */
    mode: 'hosted-form-image' | 'image-link'
    imageHref?: string
  }
  stripe:
    | { href: string; label: string }
    | {
        href: string
        label: string
        imageSrc: string
        imageAlt?: string
        imageWidth?: number
        imageHeight?: number
      }
  id?: string
  className?: string
  /** Smaller PayPal/Stripe images (~50% height). */
  compactImages?: boolean
}

/** “Support Model Mugging” donate block — PayPal image + Stripe card (San Diego layout). */
export function SupportModelMuggingDonate({
  title,
  intro,
  footnote,
  paypal,
  stripe,
  id,
  className = '',
  compactImages = false,
}: SupportModelMuggingDonateProps) {
  const paypalProp =
    paypal.mode === 'hosted-form-image'
      ? {
          kind: 'hosted-form-image' as const,
          hostedButtonId: paypal.hostedButtonId,
          imageSrc: paypal.imageSrc,
          imageAlt: paypal.imageAlt,
          imageWidth: paypal.imageWidth,
          imageHeight: paypal.imageHeight,
        }
      : {
          kind: 'image-link' as const,
          href: paypal.imageHref || '/donate-to-empowerment/',
          label: 'Donate with PayPal',
          imageSrc: paypal.imageSrc,
          imageAlt: paypal.imageAlt,
          imageWidth: paypal.imageWidth,
          imageHeight: paypal.imageHeight,
        }

  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-xl border border-[#1f497d]/15 bg-slate-50/90 p-4 sm:p-5 ${className}`.trim()}
    >
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900 sm:text-2xl">
        {formatLocationLabel(title)}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">{intro}</p>
      {footnote ? (
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-500">{footnote}</p>
      ) : null}
      <DonateMethodPair
        className="mt-6"
        paypal={paypalProp}
        stripe={stripe}
        compactImages={compactImages}
      />
    </section>
  )
}
