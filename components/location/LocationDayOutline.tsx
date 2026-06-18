/** Day One / Day Two — both visible (matches live site noticeability, not tabbed). */

export function LocationDayOutline({
  sectionHeading,
  dayOne,
  dayTwo,
}: {
  sectionHeading?: string
  dayOne: { heading: string; subheading?: string; items: string[] }
  dayTwo: { heading: string; subheading?: string; items: string[] }
}) {
  const renderDay = (day: { heading: string; subheading?: string; items: string[] }) => (
    <div className="min-w-0">
      <h3 className="border-b border-[#1f497d]/25 pb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[#1f497d]">
        {day.heading}
      </h3>
      {day.subheading ? <p className="mt-2 text-sm font-semibold text-slate-600">{day.subheading}</p> : null}
      <ul className="mt-3 list-none space-y-2 p-0 text-sm leading-relaxed text-slate-700">
        {day.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f497d]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  const inner = (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      {renderDay(dayOne)}
      {renderDay(dayTwo)}
    </div>
  )

  if (!sectionHeading) {
    return <div className="pt-1">{inner}</div>
  }

  return (
    <section className="scroll-mt-24 rounded-xl border border-[#1f497d]/15 bg-gradient-to-b from-[#1f497d]/[0.04] to-white p-5 sm:p-6">
      <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
        {sectionHeading}
      </h2>
      {inner}
    </section>
  )
}
