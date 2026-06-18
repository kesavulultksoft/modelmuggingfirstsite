import type { DonateQuote } from '@/lib/marketingPages/donateToEmpowerment/types'

export function DonateQuoteBlock({ quote }: { quote: DonateQuote }) {
  return (
    <figure className="my-6 rounded-xl border border-[#1f497d]/15 bg-slate-50/90 px-5 py-4 sm:px-6">
      <blockquote className="text-base italic leading-relaxed text-slate-700">&ldquo;{quote.text}&rdquo;</blockquote>
      <figcaption className="mt-3 text-sm font-semibold text-[#1f497d]">— {quote.attribution}</figcaption>
      {quote.note ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          <span className="font-semibold text-slate-700">Note:</span> {quote.note}
        </p>
      ) : null}
    </figure>
  )
}
