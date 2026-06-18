/** Graduate / video quote — matches legacy blockquote under intro video. */
export function LocationQuoteBlock({ quote, className = '' }: { quote: string; className?: string }) {
  return (
    <blockquote
      className={`rounded-xl border border-[#1f497d]/15 bg-[#1f497d]/[0.06] px-5 py-4 text-center text-sm italic leading-relaxed text-slate-800 sm:text-base ${className}`}
    >
      {quote}
    </blockquote>
  )
}
