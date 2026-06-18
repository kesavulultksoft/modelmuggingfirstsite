'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Target, UserRound, Users } from 'lucide-react'

const cards = [
  {
    icon: Target,
    title: 'Realistic scenario training',
    bullets: [
      'Full-force strikes against padded gear',
      'Adrenaline-based drills you remember',
      'Verbal and physical boundaries together',
    ],
    accent: 'from-[#6366f1]/20 to-[#8b5cf6]/10 border-[#a5b4fc]/30',
    iconBg: 'bg-[#6366f1]/20 text-[#a5b4fc]',
  },
  {
    icon: UserRound,
    title: 'Padded assailant methodology',
    bullets: [
      'Train against a moving, suited role-player',
      'Safe contact at real intensity',
      'The original full-force approach since 1971',
    ],
    accent: 'from-white/[0.08] to-white/[0.02] border-white/15',
    iconBg: 'bg-[#00d4aa]/20 text-[#00d4aa]',
  },
  {
    icon: Users,
    title: 'Small supportive classes',
    bullets: [
      'Personal correction and pacing',
      'Trauma-informed coaching',
      'Graduation you can be proud of',
    ],
    accent: 'from-white/[0.08] to-white/[0.02] border-white/15',
    iconBg: 'bg-[#00d4aa]/20 text-[#00d4aa]',
  },
]

type HomeNotTypicalContent = { eyebrow?: string; title?: string; subtitle?: string }

export default function HomeNotTypical({ content }: { content?: HomeNotTypicalContent }) {
  const reduce = useReducedMotion()

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #070b14 50%, #0f172a 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#00d4aa]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
            {content?.eyebrow || 'What we do'}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-white">
            {content?.title || 'Not a typical self-defense class'}
          </h2>
          <p className="mt-4 text-base text-white/65 sm:text-lg">
            {content?.subtitle ||
              "We don't lecture from slides. You sweat, shout, and strike — until your body knows what to do."}
          </p>
        </motion.div>

        {/* Horizontal scroll: all 3 cards accessible; snap on mobile */}
        <div className="mt-12 -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 pt-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.article
                key={card.title}
                initial={reduce ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduce ? 0 : i * 0.1 }}
                className={`snap-center min-w-0 shrink-0 w-[min(85vw,380px)] rounded-2xl border bg-gradient-to-br p-7 shadow-xl backdrop-blur-sm sm:w-full sm:max-w-none ${card.accent}`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                  {card.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/70">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00d4aa]" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>
        <p className="mt-2 text-center text-xs text-white/40 sm:hidden">
          Swipe for more →
        </p>
      </div>
    </section>
  )
}
