'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles, Users, Shield, Award, Zap } from 'lucide-react'

const trustStats = [
  { number: '100K+', label: 'Students taught', icon: Users },
  { number: '97%', label: 'Reported success when attacked', icon: Shield },
  { number: '50+', label: 'Years of research', icon: Award },
  { number: '1,000+', label: 'Stopped by voice alone', icon: Zap },
]

const lineVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

type HomeHeroContent = {
  eyebrow?: string
  badge?: string
  line1?: string
  line2?: string
  line3?: string
  subtitle?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

export default function HomeHero({ content }: { content?: HomeHeroContent }) {
  const reduce = useReducedMotion()

  return (
    <section
      className="mm-noise relative flex min-h-[min(100dvh,920px)] flex-col overflow-hidden pt-[4.5rem] pb-0 md:min-h-[min(92dvh,880px)]"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,170,0.1) 0%, transparent 50%), linear-gradient(165deg, #042f2e 0%, #0f172a 42%, #0a1624 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 top-1/4 h-[420px] w-[420px] rounded-full blur-3xl md:right-[8%]"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.18) 0%, transparent 65%)',
        }}
        animate={reduce ? {} : { scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 sm:px-6 lg:pb-8">
        <div className="mx-auto max-w-4xl text-center lg:max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="mb-6 flex flex-wrap items-center justify-center gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/35 bg-[#00d4aa]/[0.1] px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#00d4aa]" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00d4aa]">
                {content?.eyebrow || 'Est. 1971 · Full-force training'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur-sm">
              <Zap className="h-3 w-3 text-[#F59E0B]" aria-hidden />
              {content?.badge || 'No martial arts required'}
            </span>
          </motion.div>

          <h1
            className="font-[family-name:var(--font-display)] font-bold tracking-[-0.02em] text-white"
            style={{ lineHeight: 0.98 }}
          >
            <motion.span
              custom={0}
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className="block text-[clamp(2.35rem,6vw,3.75rem)] text-white/90"
            >
              {content?.line1 || 'Learn to'}
            </motion.span>
            <motion.span
              custom={1}
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className="block text-[clamp(2.6rem,7vw,4.5rem)]"
            >
              {content?.line2 || 'Fight Back'}
            </motion.span>
            <motion.span
              custom={2}
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className="text-gradient-teal mt-1 block text-[clamp(2.6rem,7vw,4.75rem)] drop-shadow-[0_0_40px_rgba(0,212,170,0.2)]"
            >
              {content?.line3 || 'In a Weekend.'}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mx-auto mb-10 mt-7 max-w-2xl text-[17px] leading-[1.75] text-white/[0.72]"
          >
            {content?.subtitle ||
              'Real adrenaline. Real scenarios. Real confidence. We train you to defeat physical assault — not just talk about it.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.45 }}
            className="mb-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href={content?.primaryCtaHref || '/schedule'}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-9 py-4 text-center text-base font-bold text-[#0f172a] shadow-[0_0_40px_rgba(0,212,170,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_56px_rgba(0,212,170,0.45)] active:scale-[0.99]"
            >
              <span className="mm-cta-shine absolute inset-0 rounded-2xl" />
              <span className="relative">{content?.primaryCtaLabel || 'Find a class near you'}</span>
            </Link>
            <Link
              href={content?.secondaryCtaHref || '/training'}
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/[0.04] px-8 py-4 text-center text-base font-semibold text-white backdrop-blur-sm transition hover:border-[#00d4aa]/45 hover:bg-[#00d4aa]/10"
            >
              {content?.secondaryCtaLabel || 'Types of training'}
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-white/45"
          >
            <Link href="/#newsletter" className="text-[#5eead4] hover:text-[#99f6e4]">
              Get class alerts
            </Link>
            {' · '}
            <Link href="/about#why-model-mugging" className="hover:text-white/70">
              Why Model Mugging?
            </Link>
          </motion.p>
        </div>

        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="relative z-10 mt-auto w-full border-t border-white/[0.08] bg-[#070b14]/70 backdrop-blur-md"
        >
          <div className="mx-auto max-w-6xl px-2 py-6 sm:px-4 sm:py-8">
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#00d4aa]/85 sm:mb-5">
              Trusted by graduates nationwide
            </p>
            <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 sm:snap-none">
              {trustStats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className={`flex min-w-[46%] shrink-0 snap-center flex-col items-center px-4 py-3 text-center sm:min-w-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-2 sm:text-left md:px-6 ${
                      idx > 0 ? 'sm:border-l sm:border-white/10' : ''
                    }`}
                  >
                    <div className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00d4aa]/15 text-[#00d4aa] sm:mb-0">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </div>
                    <div>
                      <div className="font-[family-name:var(--font-display)] text-2xl font-black leading-none text-white sm:text-3xl">
                        <span className="text-[#00d4aa]">{stat.number}</span>
                      </div>
                      <div className="mt-1.5 max-w-[11rem] text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-white/45 sm:max-w-none">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 md:bottom-32 lg:bottom-36"
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
          Explore
        </span>
        <ChevronDown className="h-4 w-4 text-[#00d4aa]/50" />
      </motion.div>
    </section>
  )
}
