'use client'

const cities = [
  'Philadelphia',
  'New York City',
  'Denver',
  'Los Angeles',
  'San Francisco',
  'Boston',
  'Seattle',
  'Las Vegas',
  'San Diego',
  'Phoenix',
  'Atlanta',
  'Dallas',
  'Germany',
  'Switzerland',
]

function Pills({ suffix }: { suffix: string }) {
  return (
    <>
      {cities.map((city) => (
        <span
          key={`${suffix}-${city}`}
          className="shrink-0 rounded-full border border-[#E8F4FD] bg-[#F8FAFC] px-5 py-2 text-sm font-semibold text-[#0f172a] shadow-sm"
        >
          {city}
        </span>
      ))}
    </>
  )
}

export default function HomeMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-[#E2E8F0] bg-white py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-28" />
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#0f172a]/45">
        Classes across the U.S. &amp; abroad
      </p>
      <div className="flex overflow-hidden">
        <div className="flex min-w-max animate-mm-marquee items-center gap-3 pr-3">
          <Pills suffix="a" />
          <Pills suffix="b" />
        </div>
      </div>
    </section>
  )
}
