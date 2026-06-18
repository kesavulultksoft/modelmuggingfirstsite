'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Quote } from 'lucide-react'

const items = [
  {
    name: 'Sarah M.',
    role: "Women's Basic, 2024",
    quote:
      'I thought I would freeze. By Sunday I was hitting hard enough to feel it — and I believed I could hurt someone if I had to.',
    initial: 'S',
  },
  {
    name: 'Jennifer K.',
    role: 'Graduate, Bay Area',
    quote:
      'The padded suit was terrifying at first. By graduation I understood: that fear was the whole point. I’m not the same person.',
    initial: 'J',
  },
  {
    name: 'Maria L.',
    role: 'Mom & student',
    quote:
      'I signed up my daughter and myself. We both left louder, stronger, and closer. Best money I ever spent on safety.',
    initial: 'M',
  },
]

type HomeTestimonialsContent = { eyebrow?: string; title?: string }

export default function HomeTestimonials({ content }: { content?: HomeTestimonialsContent }) {
  const reduce = useReducedMotion()

  return (
    <section className="bg-[#F8FAFC] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00d4aa]">
            {content?.eyebrow || 'Testimonials'}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0f172a]">
            {content?.title || 'Lives changed. In a weekend.'}
          </h2>
        </motion.div>

        <div className="mt-12 flex gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0 sm:snap-none">
          {items.map((t, i) => (
            <motion.article
              key={t.name}
              initial={reduce ? {} : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reduce ? 0 : i * 0.08 }}
              className="snap-center min-w-0 shrink-0 w-[min(88vw,340px)] rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-[0_8px_30px_-8px_rgba(27,58,140,0.08)] sm:w-full sm:max-w-none"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00d4aa] to-[#134e4a] text-lg font-bold text-white">
                  {t.initial}
                </div>
                <div>
                  <p className="font-bold text-[#0f172a]">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
              <Quote className="mb-2 h-6 w-6 text-[#00d4aa]/40" aria-hidden />
              <p className="text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
            </motion.article>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-400 sm:hidden">Swipe for more →</p>
      </div>
    </section>
  )
}
