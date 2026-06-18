import Image from 'next/image'
import Link from 'next/link'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { LocationRichText } from '@/components/location/LocationRichText'
import { formatLocationLabel } from '@/components/location/locationText'
import { LOCATION_BTN_COMPACT } from '@/components/location/locationBrandStyles'

/** Bottom-of-page promo cards (defend time & money + podcast). */
export function LocationBottomPromoBoxes({
  boxes,
}: {
  boxes: NonNullable<LocationCityPageContent['bottomPromoBoxes']>
}) {
  const items = [boxes.defendTimeAndMoney, boxes.podcast].filter(Boolean)
  if (items.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((box) =>
        box ? (
          <section
            key={box.href}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {box.imageSrc ? (
              <Link href={box.href} className="block bg-white">
                <Image
                  src={box.imageSrc}
                  alt={box.imageAlt || box.title}
                  width={400}
                  height={400}
                  className="mx-auto h-auto w-full max-w-[280px] object-contain p-3"
                />
              </Link>
            ) : null}
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                {box.title}
              </h3>
              {box.body?.length ? (
                <div className="mt-2 flex-1">
                  <LocationRichText value={box.body} />
                </div>
              ) : null}
              <Link href={box.href} className={`mt-4 w-fit ${LOCATION_BTN_COMPACT}`}>
                {formatLocationLabel(box.ctaLabel || 'Learn more')}
              </Link>
            </div>
          </section>
        ) : null,
      )}
    </div>
  )
}
