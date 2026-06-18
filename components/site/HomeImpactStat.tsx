'use client'

import Link from 'next/link'
import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const steps = [
  { n: 1, title: 'Research-backed', text: 'Training built on how real attacks unfold — not theory.' },
  { n: 2, title: 'Stress inoculation', text: 'Full-force drills so your body responds under adrenaline.' },
  { n: 3, title: 'Tracked outcomes', text: 'We survey graduates on what happened when it mattered.' },
]

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

type HomeImpactContent = { eyebrow?: string; title?: string }

export default function HomeImpactStat({ content }: { content?: HomeImpactContent }) {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.35 })
  const [displayPct, setDisplayPct] = useState(reduce ? 97 : 0)
  const [stepsVisible, setStepsVisible] = useState(reduce ? 3 : 0)

  useEffect(() => {
    if (reduce) {
      setDisplayPct(97)
      setStepsVisible(3)
      return
    }
    if (!inView) return

    const stepTimers = [0, 450, 900].map((delay, i) =>
      window.setTimeout(() => setStepsVisible((v) => Math.max(v, i + 1)), delay)
    )

    const startCount = window.setTimeout(() => {
      const duration = 2200
      const start = performance.now()
      const tick = (now: number) => {
        const p = easeOutCubic(Math.min(1, (now - start) / duration))
        setDisplayPct(Math.min(97, Math.round(97 * p)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 1350)

    return () => {
      stepTimers.forEach(clearTimeout)
      clearTimeout(startCount)
    }
  }, [inView, reduce])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-20"
      style={{
        background: 'linear-gradient(160deg, #042f2e 0%, #0f172a 42%, #070b14 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#00d4aa]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[#00d4aa]">
          {content?.eyebrow || 'Real-world impact'}
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-[family-name:var(--font-display)] text-[clamp(1.5rem,4vw,2.25rem)] font-bold leading-tight text-white">
          {content?.title || 'When training meets reality'}
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={false}
              animate={{
                opacity: stepsVisible > i ? 1 : 0.15,
                y: stepsVisible > i ? 0 : 12,
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${
                stepsVisible > i
                  ? 'border-[#00d4aa]/30 bg-[#00d4aa]/[0.08]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00d4aa] text-sm font-black text-[#0f172a]">
                {s.n}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduce ? {} : { opacity: 0, scale: 0.96 }}
          animate={displayPct >= 97 || reduce ? { opacity: 1, scale: 1 } : { opacity: 0.85, scale: 1 }}
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-[#00d4aa]/25 bg-gradient-to-br from-[#1e293b]/90 to-[#0f172a] px-6 py-10 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#00d4aa]/90">
            Graduate-reported success
          </p>
          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span
              className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,16vw,8rem)] font-black leading-none tabular-nums tracking-tight text-white"
              style={{
                textShadow: '0 0 60px rgba(0,174,239,0.25)',
              }}
            >
              {displayPct}
            </span>
            <span className="text-[clamp(2rem,6vw,3.5rem)] font-black leading-none text-[#00d4aa]">
              %
            </span>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Of graduates who were{' '}
            <span className="font-semibold text-white">physically attacked</span> after training,{' '}
            <span className="text-[#00d4aa]">fought off their assailant successfully</span> — per
            follow-up surveys. Outcomes vary; training shifts what&apos;s possible.
          </p>
          <Link
            href="/training"
            className="mt-8 inline-flex rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:border-[#00d4aa] hover:bg-[#00d4aa]/10"
          >
            How we train
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
