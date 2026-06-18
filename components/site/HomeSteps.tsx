'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, UserPlus, CreditCard } from 'lucide-react'

const steps = [
  {
    icon: CalendarDays,
    title: 'Choose your class',
    desc: 'Browse cities and dates on the live schedule.',
    link: '/schedule',
    linkText: 'View schedule',
  },
  {
    icon: UserPlus,
    title: 'Create your account',
    desc: 'One login — parent + student flows when you register minors.',
  },
  {
    icon: CreditCard,
    title: 'Pay & confirm',
    desc: 'Secure checkout. Email with what to bring and expect.',
  },
]

type HomeStepsContent = { eyebrow?: string; title?: string; ctaLabel?: string }

export default function HomeSteps({ content }: { content?: HomeStepsContent }) {
  const reduce = useReducedMotion()

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">
            {content?.eyebrow || 'Simple path'}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-[#0f172a] sm:text-4xl">
            {content?.title || 'Three steps to your seat'}
          </h2>
        </motion.div>

        <div className="relative mt-16">
          <div
            className="absolute left-[8%] right-[8%] top-[2.25rem] hidden h-0.5 bg-gradient-to-r from-[#00d4aa]/0 via-[#00d4aa]/40 to-[#00d4aa]/0 lg:block"
            aria-hidden
          />
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.title}
                  initial={reduce ? {} : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduce ? 0 : i * 0.1 }}
                  className="relative text-center lg:text-left"
                >
                  <div className="relative z-10 mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border-2 border-[#00d4aa] bg-white text-[#00d4aa] shadow-[0_8px_30px_rgba(0,212,170,0.2)] lg:mx-0">
                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-black text-white">
                      {i + 1}
                    </span>
                    <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#0f172a]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{s.desc}</p>
                  {s.link && (
                    <Link
                      href={s.link}
                      className="mt-3 inline-block text-sm font-bold text-[#00d4aa] hover:text-teal-700"
                    >
                      {s.linkText} →
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        <motion.div
          initial={reduce ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex justify-center"
        >
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-10 py-4 text-base font-bold text-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.4)] transition hover:bg-[#134e4a] hover:shadow-lg"
          >
            {content?.ctaLabel || 'Browse open classes'}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
