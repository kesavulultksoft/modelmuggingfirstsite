import Link from 'next/link'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { LocationRichText } from '@/components/location/LocationRichText'
import { portableToPlainText } from '@/lib/marketingPages/locationCity/portable'
import { formatLocationLabel } from '@/components/location/locationText'
import { LOCATION_BTN_INLINE, LOCATION_BTN_SECONDARY } from '@/components/location/locationBrandStyles'
import { DONATE_CARD } from '@/components/donate/DonateMethodCards'
import { SupportModelMuggingDonate } from '@/components/donate/SupportModelMuggingDonate'

export function LocationDonateBlock({ donate }: { donate: LocationCityPageContent['donate'] }) {
  const [paypal, stripe, ...other] = donate.buttons

  return (
    <>
      {paypal?.imageSrc && stripe ? (
        <SupportModelMuggingDonate
          title={donate.title}
          intro={portableToPlainText(donate.intro)}
          footnote={donate.footnote ? portableToPlainText(donate.footnote) : undefined}
          compactImages
          paypal={{
            hostedButtonId: 'R8JB9PFDTAL6N',
            imageSrc: paypal.imageSrc,
            imageAlt: paypal.imageAlt || 'Donate with PayPal',
            imageWidth: paypal.imageWidth,
            imageHeight: paypal.imageHeight,
            mode: 'image-link',
            imageHref: paypal.href,
          }}
          stripe={
            stripe.imageSrc
              ? {
                  href: stripe.href,
                  label: stripe.label,
                  imageSrc: stripe.imageSrc,
                  imageAlt: stripe.imageAlt,
                  imageWidth: stripe.imageWidth,
                  imageHeight: stripe.imageHeight,
                }
              : { href: stripe.href, label: stripe.label }
          }
        />
      ) : (
        <section className="scroll-mt-24 rounded-xl border border-[#1f497d]/15 bg-slate-50/90 p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
            {formatLocationLabel(donate.title)}
          </h2>
          <div className="mt-2 max-w-2xl">
            <LocationRichText value={donate.intro} />
          </div>
          {paypal && !paypal.imageSrc ? (
            <div className="mt-6 max-w-3xl">
              <Link href={paypal.href} className={`${DONATE_CARD} ${LOCATION_BTN_INLINE}`}>
                <span>{formatLocationLabel(paypal.label)}</span>
              </Link>
            </div>
          ) : null}
        </section>
      )}
      {other.length > 0 ? (
        <div className="mt-4 flex max-w-3xl flex-wrap gap-3">
          {other.map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className={`inline-flex flex-col ${LOCATION_BTN_SECONDARY}`}
            >
              <span>{formatLocationLabel(btn.label)}</span>
              {btn.description ? (
                <span className="mt-1 text-xs font-normal text-slate-600">{btn.description}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  )
}
