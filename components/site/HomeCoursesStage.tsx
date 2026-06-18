'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Heart,
  Baby,
  User,
  TrendingUp,
  GraduationCap,
} from 'lucide-react'

const stages = [
  {
    name: "Women's Basic",
    tag: 'Flagship',
    blurb: 'Weekend intensive · full-force',
    href: '/training',
    icon: Heart,
  },
  {
    name: 'Teens & kids',
    tag: 'Youth',
    blurb: 'Age-appropriate skills',
    href: '/training',
    icon: Baby,
  },
  {
    name: "Men's Basic",
    tag: 'Weekend',
    blurb: 'Same method, adapted',
    href: '/training',
    icon: User,
  },
  {
    name: 'Advanced',
    tag: 'Graduates',
    blurb: 'Deeper scenarios',
    href: '/training',
    icon: TrendingUp,
  },
  {
    name: 'Instructor path',
    tag: 'Certify',
    blurb: 'Teach the program',
    href: '/trainers',
    icon: GraduationCap,
  },
]

type HomeCoursesContent = { eyebrow?: string; title?: string; subtitle?: string; ctaLabel?: string }

export default function HomeCoursesStage({ content }: { content?: HomeCoursesContent }) {
  const reduce = useReducedMotion()

  return (
    <section
      className="relative overflow-hidden py-14 sm:py-16"
      style={{
        background: 'linear-gradient(180deg, #042f2e 0%, #0f172a 35%, #0c1222 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(ellipse 50% 40% at 70% 20%, rgba(0,174,239,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 40% 50% at 10% 80%, rgba(27,58,140,0.2) 0%, transparent 50%)`,
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00d4aa]">
            {content?.eyebrow || 'Our courses'}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.65rem)] font-bold leading-tight text-white">
            {content?.title || 'Courses designed for every stage'}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">
            {content?.subtitle ||
              'One methodology — from first-timers to instructors. Pick your path; open dates are on the schedule.'}
          </p>
          <Link
            href="/schedule"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00d4aa] px-5 py-2.5 text-sm font-bold text-[#0f172a] transition hover:bg-teal-300"
          >
            {content?.ctaLabel || 'View open dates'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          {stages.map((s, i) => {
            const Icon = s.icon
            const colClass =
              i < 3
                ? 'lg:col-span-2'
                : i === 3
                  ? 'lg:col-span-2 lg:col-start-2'
                  : 'lg:col-span-2'
            return (
              <motion.div
                key={s.name}
                className={colClass}
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduce ? 0 : i * 0.05 }}
              >
                <Link
                  href={s.href}
                  className="group flex h-full min-h-[4.75rem] items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0f172a]/70 px-4 py-3 backdrop-blur-sm transition hover:border-[#00d4aa]/35 hover:bg-[#1e293b]/90 sm:min-h-0 sm:gap-4 sm:px-5 sm:py-3.5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00d4aa]/15 text-[#00d4aa] transition group-hover:bg-[#00d4aa]/25">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-white group-hover:text-[#00d4aa] sm:text-lg">
                        {s.name}
                      </h3>
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#00d4aa]">
                        {s.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/50 sm:text-sm">{s.blurb}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-[#00d4aa]" aria-hidden />
                </Link>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/40 sm:text-sm">
          Not sure which fits?{' '}
          <Link href="/contact" className="font-semibold text-[#00d4aa] hover:text-[#7dd3fc]">
            Ask us
          </Link>
        </p>
      </div>
    </section>
  )
}
