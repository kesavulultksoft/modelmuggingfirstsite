'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Shield, Users, HeartHandshake, Sparkles } from 'lucide-react'

const rest = [
  {
    icon: Users,
    t: 'Small groups',
    d: 'Personal coaching for your body, pace, and comfort level.',
  },
  {
    icon: HeartHandshake,
    t: 'Supportive culture',
    d: 'Trauma-aware teaching. You choose how you participate.',
  },
  {
    icon: Sparkles,
    t: 'Proven since 1971',
    d: 'Decades of research. Graduates who fought back successfully.',
  },
]

export default function HomePillars() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-[#FAFBFC] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8F4FD]/80"
        style={{ filter: 'blur(100px)' }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-[#00AEEF]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00AEEF]">
            Why Model Mugging
          </span>
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.85rem)] font-bold leading-[1.15] text-[#1B3A8C]">
            Built for real life —{' '}
            <span className="text-gradient-cyan">not the dojo</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Training that matches how attacks happen — not kata in a mirror.
          </p>
        </motion.div>

        <motion.article
          initial={reduce ? {} : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="group relative mt-14 overflow-hidden rounded-[1.75rem] border border-[#00AEEF]/20 bg-gradient-to-br from-[#0B1A3E] via-[#0D2260] to-[#1B3A8C] p-8 text-white shadow-[0_24px_60px_-15px_rgba(11,26,62,0.45)] sm:p-10 md:flex md:items-center md:gap-12 md:p-12"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00AEEF]/15 blur-3xl"
            aria-hidden
          />
          <div className="mb-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#00AEEF]/20 text-[#00AEEF] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] md:mb-0 md:h-24 md:w-24">
            <Shield className="h-11 w-11 md:h-12 md:w-12" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="relative min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              Realistic full-force practice
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              You strike at full power against padded gear — so when adrenaline hits, your body
              already knows the motion. That&apos;s what separates Model Mugging from a weekend
              seminar.
            </p>
          </div>
        </motion.article>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {rest.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.article
                key={p.t}
                initial={reduce ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduce ? 0 : 0.08 + i * 0.06 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-[0_4px_20px_rgba(27,58,140,0.05)] transition hover:-translate-y-0.5 hover:border-[#00AEEF]/25 hover:shadow-[0_16px_40px_-12px_rgba(0,174,239,0.12)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F4FD] text-[#00AEEF]">
                  <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1B3A8C]">
                  {p.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.d}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
