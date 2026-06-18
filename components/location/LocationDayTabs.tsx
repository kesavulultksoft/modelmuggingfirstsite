'use client'

import { useState } from 'react'

export function LocationDayTabs({
  dayOne,
  dayTwo,
}: {
  dayOne: { heading: string; subheading?: string; items: string[] }
  dayTwo: { heading: string; subheading?: string; items: string[] }
}) {
  const [tab, setTab] = useState<'one' | 'two'>('one')
  const active = tab === 'one' ? dayOne : dayTwo

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => setTab('one')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'one' ? 'bg-[#1f497d] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Day one
        </button>
        <button
          type="button"
          onClick={() => setTab('two')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'two' ? 'bg-[#1f497d] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Day two
        </button>
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
        {active.heading}
      </h3>
      {active.subheading ? <p className="mt-1 text-sm font-medium text-[#1f497d]">{active.subheading}</p> : null}
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {active.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f497d]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
