'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Quote } from 'lucide-react'

export default function HomeQuote() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(0,174,239,0.08) 0%, transparent 50%), linear-gradient(180deg, #0B1A3E 0%, #0D2260 100%)',
        }}
      />
      <div className="mm-noise absolute inset-0 opacity-100" aria-hidden />
      <motion.div
        initial={reduce ? {} : { opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        <Quote
          className="mx-auto mb-8 h-12 w-12 text-[#00AEEF]/40"
          strokeWidth={1}
          aria-hidden
        />
        <blockquote className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.5vw,2rem)] font-medium leading-snug text-white/95">
          I walked in scared of my own shadow. I walked out knowing if someone grabbed me, I
          could hurt them badly enough to get away. That changed everything.
        </blockquote>
        <footer className="mt-8 text-sm font-semibold text-[#00AEEF]">
          — Graduate, Women&apos;s Basic Course
        </footer>
      </motion.div>
    </section>
  )
}
