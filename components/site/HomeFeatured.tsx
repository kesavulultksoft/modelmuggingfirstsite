'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { CourseDTO } from '@/lib/types'
import CourseCard from '@/components/site/CourseCard'
import { WaveTopSky, WaveBottomWhite } from '@/components/site/SectionWave'

export default function HomeFeatured({ courses }: { courses: CourseDTO[] }) {
  const reduce = useReducedMotion()
  const featured = courses.slice(0, 4)

  return (
    <>
      <WaveTopSky />
      <section className="relative bg-gradient-to-b from-[#E8F4FD]/90 via-[#E8F4FD]/70 to-[#d8ecfa]/50 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(0,174,239,0.12) 0%, transparent 45%),
              radial-gradient(circle at 80% 70%, rgba(27,58,140,0.06) 0%, transparent 40%)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.div
              initial={reduce ? {} : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#00AEEF]">
                Upcoming classes
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#1B3A8C]">
                Find a class near you
              </h2>
              <p className="mt-3 max-w-lg text-slate-600">
                Live listings — tap a card for full details, tuition, and registration.
              </p>
            </motion.div>
            <motion.div
              initial={reduce ? {} : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#1B3A8C] bg-white px-6 py-3 text-sm font-bold text-[#1B3A8C] shadow-sm transition hover:bg-[#1B3A8C] hover:text-white"
              >
                Full schedule
                <span aria-hidden>→</span>
              </Link>
            </motion.div>
          </div>

          {featured.length === 0 ? (
            <motion.p
              initial={reduce ? {} : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-14 rounded-2xl border-2 border-dashed border-[#00AEEF]/35 bg-white/80 px-6 py-16 text-center text-slate-600 backdrop-blur-sm"
            >
              No public listings right now.{' '}
              <Link href="/contact" className="font-bold text-[#1B3A8C] underline hover:text-[#00AEEF]">
                Contact us
              </Link>{' '}
              for next dates.
            </motion.p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={reduce ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduce ? 0 : i * 0.06 }}
                >
                  <CourseCard course={c} compact />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <WaveBottomWhite />
    </>
  )
}
