'use client'

import type { PortableTextBlock } from '@portabletext/react'

import { LocationCollapsible } from '@/components/location/LocationCollapsible'
import { LocationRichText } from '@/components/location/LocationRichText'
import { LOCATION_BOX_TITLE } from '@/components/location/locationBrandStyles'
import type { LocationCityElevenWay } from '@/lib/marketingPages/locationCity/types'

/** Ten ways block: visible title + optional subtitle, collapsible numbered list. */
export function LocationElevenWaysSection({
  title,
  subtitle,
  items,
  defaultOpen = true,
}: {
  title: string
  subtitle?: PortableTextBlock[]
  items: LocationCityElevenWay[]
  defaultOpen?: boolean
}) {
  const count = items.length

  return (
    <section className="scroll-mt-24 overflow-hidden rounded-xl border-2 border-[#1f497d]/25 bg-white shadow-md ring-1 ring-[#1f497d]/10">
      <div className="border-b border-[#1f497d]/15 bg-gradient-to-r from-[#1f497d]/10 via-[#1f497d]/5 to-white px-4 py-2.5 sm:px-4 sm:py-3">
        <h2 className={LOCATION_BOX_TITLE}>{title}</h2>
        {subtitle?.length ? (
          <div className="mt-3">
            <LocationRichText value={subtitle} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Open the list below to see how this course empowers you in {count} practical ways.
          </p>
        )}
      </div>
      <LocationCollapsible
        toggleLabel={`View All ${count} Ways`}
        headingExternal
        defaultOpen={defaultOpen}
        className="rounded-none border-0 shadow-none"
      >
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={item.title} className="flex gap-3 text-sm text-slate-800 sm:text-base">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f497d] text-xs font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <div className="mt-1">
                  <LocationRichText value={item.description} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </LocationCollapsible>
    </section>
  )
}
