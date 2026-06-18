import Image from 'next/image'

type Props = {
  hostedButtonId: string
  className?: string
}

/** PayPal hosted button — same hosted_button_id as legacy donate-to-empowerment.html */
export function PayPalDonateForm({ hostedButtonId, className = '' }: Props) {
  return (
    <form
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
      className={`w-full ${className}`.trim()}
    >
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
      <button
        type="submit"
        className="inline-flex w-full min-h-[52px] items-center justify-center rounded-lg bg-[#ffc439] px-6 py-3 text-base font-bold tracking-tight text-[#003087] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2] sm:min-h-[56px] sm:text-lg"
      >
        Donate With PayPal
      </button>
    </form>
  )
}

/** PayPal donate graphic as submit button (matches location page card style). */
export function PayPalDonateImageButton({
  hostedButtonId,
  imageSrc,
  imageAlt,
  imageWidth = 400,
  imageHeight = 242,
  className = '',
  compact = false,
}: {
  hostedButtonId: string
  imageSrc: string
  imageAlt: string
  imageWidth?: number
  imageHeight?: number
  className?: string
  compact?: boolean
}) {
  return (
    <form
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
      className={`w-full ${className}`.trim()}
    >
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
      <button
        type="submit"
        className="inline-flex w-full min-h-[40px] items-center justify-center rounded-lg border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2] sm:min-h-[52px]"
        aria-label={imageAlt || 'Donate with PayPal'}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className={
            compact
              ? 'h-auto max-h-[80px] w-full max-w-[200px] object-contain'
              : 'h-auto max-h-[160px] w-full object-contain'
          }
          sizes="(max-width: 640px) 100vw, 280px"
        />
      </button>
    </form>
  )
}
