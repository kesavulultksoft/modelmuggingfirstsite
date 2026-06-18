'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const principles = [
  {
    n: 1,
    title: 'Principle One',
    short: 'Awareness & avoidance',
    body: 'Most safety wins happen before contact. We teach you to read environments, set boundaries early, and de-escalate when you can — without blaming you for what you didn’t “see.”',
  },
  {
    n: 2,
    title: 'Principle Two',
    short: 'Voice as a weapon',
    body: 'A loud, committed voice can stop an attack before it starts. You’ll practice until shouting feels natural under stress — not polite, not small.',
  },
  {
    n: 3,
    title: 'Principle Three',
    short: 'Physical options',
    body: 'When words aren’t enough, your body needs simple strikes that work at full force. We build muscle memory against padded gear so you’re not guessing in a crisis.',
  },
  {
    n: 4,
    title: 'Principle Four',
    short: 'Fight through fear',
    body: 'Adrenaline changes everything. Our training is designed around how people actually feel in danger — not how they perform in a calm classroom.',
  },
  {
    n: 5,
    title: 'Principle Five',
    short: 'Community & dignity',
    body: 'You train alongside others who get it. Small classes, respect for trauma, and graduation as proof you did something hard — and finished.',
  },
]

type HomePrinciplesContent = { eyebrow?: string; title?: string; subtitle?: string }

export default function HomePrinciples({ content }: { content?: HomePrinciplesContent }) {
  const [active, setActive] = useState(1)
  const reduce = useReducedMotion()
  const current = principles.find((p) => p.n === active) ?? principles[0]

  return (
    <section className="border-t border-white/10 bg-[#0D2260] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00d4aa]">
            {content?.eyebrow || 'Our philosophy'}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-white">
            {content?.title || 'Five principles that underpin everything'}
          </h2>
          <p className="mt-4 text-white/65">
            {content?.subtitle ||
              'Every course — basic, teen, advanced, or instructor — is built on the same core ideas.'}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3 sm:gap-4">
          {principles.map((p) => (
            <button
              key={p.n}
              type="button"
              onClick={() => setActive(p.n)}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-black transition sm:h-16 sm:w-16 ${
                active === p.n
                  ? 'bg-[#00d4aa] text-[#0f172a] shadow-[0_0_24px_rgba(0,212,170,0.35)]'
                  : 'border-2 border-white/25 bg-transparent text-white/80 hover:border-[#00d4aa]/50 hover:text-white'
              }`}
              aria-pressed={active === p.n}
              aria-label={`Principle ${p.n}: ${p.short}`}
            >
              {p.n}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-[#0f172a]/90 p-8 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#00d4aa]">
                {current.title}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {current.short}
              </h3>
              <p className="mt-4 leading-relaxed text-white/75">{current.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
