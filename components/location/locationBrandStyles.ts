/** Logo palette for location city pages — navy primary, no teal/green/orange CTAs. */

/** Overrides `.prose-site a { text-teal-600 }` on city location pages. */
const LOCATION_CTA =
  'location-cta !text-white hover:!text-white !no-underline hover:!no-underline [&_span]:!text-white'

export const LOCATION_BTN_PRIMARY = `inline-flex rounded-lg bg-[#1f497d] px-4 py-2 text-sm font-semibold transition hover:bg-[#163a63] ${LOCATION_CTA}`

export const LOCATION_BTN_SECONDARY =
  'inline-flex rounded-lg border-2 border-[#1f497d]/25 bg-white px-4 py-2 text-sm font-bold !text-[#1f497d] !no-underline hover:border-[#1da1f2]/60 hover:bg-sky-50/80 hover:!text-[#1f497d]'

export const LOCATION_LINK =
  'font-semibold text-[#1f497d] hover:text-[#1da1f2] hover:underline'

/** Compact register on event cards (blends with page, not oversized). */
export const LOCATION_BTN_COMPACT = `inline-flex rounded-md bg-[#1f497d] px-3 py-1.5 text-xs font-semibold transition hover:bg-[#163a63] sm:text-sm ${LOCATION_CTA}`

/** In-page CTAs (mid-page, footer) — navy, smaller than hero/site header buttons. */
export const LOCATION_BTN_INLINE = `inline-flex rounded-lg bg-[#1f497d] px-4 py-2 text-sm font-semibold transition hover:bg-[#163a63] ${LOCATION_CTA}`

/** Link on dark sidebar event cards */
export const LOCATION_LINK_ON_DARK =
  'font-semibold !text-[#1da1f2] hover:!text-white hover:underline'

/** Main column section headings (events, local SEO, etc.). */
export const LOCATION_SECTION_TITLE =
  'font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 sm:text-3xl'

/** Bordered content box titles (retreat, subscribe, marketing headers). */
export const LOCATION_BOX_TITLE =
  'font-[family-name:var(--font-display)] text-xl font-bold text-slate-900 sm:text-2xl'

export const LOCATION_MAIN_COLUMN_SPACING = 'space-y-6'
