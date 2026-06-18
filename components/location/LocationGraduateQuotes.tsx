import type { LocationCityTestimonial } from '@/lib/marketingPages/locationCity/types'

function displayQuote(raw: string): string {
  return raw.replace(/^[\s"'“”]+|[\s"'“”]+$/g, '').trim()
}

/** Grid quote cards — clean spacing, no duplicate quotation marks. */
export function LocationGraduateQuotes({
  title = 'What Are Graduates Saying',
  testimonials,
}: {
  title?: string
  testimonials: LocationCityTestimonial[]
}) {
  if (!testimonials.length) return null

  return (
    <section className="scroll-mt-24">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {testimonials.map((t) => {
          const text = displayQuote(t.quote)
          return (
            <figure
              key={t.anchorId || t.quote.slice(0, 24)}
              id={t.anchorId}
              className="rounded-xl border border-[#1f497d]/15 bg-slate-50/80 px-5 py-5 shadow-sm"
            >
              <blockquote className="text-sm leading-relaxed text-slate-700">
                <span className="text-[#1f497d]/50" aria-hidden>
                  &ldquo;
                </span>
                <span className="italic">{text}</span>
                <span className="text-[#1f497d]/50" aria-hidden>
                  &rdquo;
                </span>
              </blockquote>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
