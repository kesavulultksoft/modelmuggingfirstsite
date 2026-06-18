import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatHeroBackLabel } from '@/lib/formatTitleCase'

/**
 * Internal page hero — solid dark base + gradients so body white never shows through.
 * Text column is centered in the shell for balanced left/right whitespace.
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  tagline,
  maxWidth = '3xl',
  back,
  children,
  titleClassName = '',
  /** Omit category pill when it duplicates the back link (e.g. both "Training") */
  showEyebrow = true,
  /** Navy / orange / sky accents (logo palette) instead of teal-green hero styling */
  brandColors = false,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  /** e.g. "The ORIGINAL Full-Force Adrenaline Stress Training Since 1971" */
  tagline?: string
  maxWidth?: '3xl' | '6xl' | '7xl'
  back?: { href: string; label: string }
  children?: ReactNode
  titleClassName?: string
  showEyebrow?: boolean
  brandColors?: boolean
}) {
  const shell =
    maxWidth === '7xl'
      ? 'max-w-7xl'
      : maxWidth === '6xl'
        ? 'max-w-6xl'
        : 'max-w-5xl'
  /* Align hero text block with /locations body (same inner width) */
  const prose =
    maxWidth === '7xl' ? 'site-page-inner-wide' : 'max-w-4xl xl:max-w-[52rem]'
  return (
    <section className="mm-noise relative isolate overflow-hidden border-b border-white/[0.07] bg-[#050810] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: brandColors
            ? 'linear-gradient(165deg, #1f497d 0%, #0f172a 38%, #070b14 65%, #050810 100%)'
            : 'linear-gradient(165deg, #064e3b 0%, #0f172a 32%, #070b14 65%, #050810 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />
      <div
        className="pointer-events-none absolute -right-28 top-[-10%] h-[min(420px,50vw)] w-[min(420px,50vw)] rounded-full blur-3xl"
        aria-hidden
        style={{
          background: brandColors
            ? 'radial-gradient(circle, rgba(29,161,242,0.15) 0%, transparent 68%)'
            : 'radial-gradient(circle, rgba(0,212,170,0.2) 0%, transparent 68%)',
        }}
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-[-20%] h-[280px] w-[280px] rounded-full blur-3xl opacity-90"
        aria-hidden
        style={{
          background: brandColors
            ? 'radial-gradient(circle, rgba(31,73,125,0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(15,118,110,0.25) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050810]/80 to-transparent"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto w-full ${shell} px-4 py-16 sm:px-6 lg:px-10 lg:py-24 xl:px-12`}
      >
        <div className={`w-full ${prose}`}>
          <div className="flex flex-col gap-4">
            {back ? (
              <Link
                href={back.href}
                className={`inline-flex w-fit items-center gap-2 text-sm font-semibold transition hover:text-white ${
                  brandColors ? 'text-[#1da1f2]/95' : 'text-teal-300/95'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  ←
                </span>
                <span>{formatHeroBackLabel(back.label)}</span>
              </Link>
            ) : null}
            {showEyebrow && eyebrow ? (
              <span
                className={
                  brandColors
                    ? 'inline-flex w-fit rounded-full border border-white/25 bg-[#1f497d]/40 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/95'
                    : 'inline-flex w-fit rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5eead4]'
                }
              >
                {eyebrow}
              </span>
            ) : null}
          </div>
          {tagline ? (
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#1da1f2]/95 sm:text-base sm:tracking-[0.14em]">
              {tagline}
            </p>
          ) : null}
          <h1
            className={`${tagline ? 'mt-3' : 'mt-5'} font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl sm:leading-[1.06] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] ${titleClassName}`}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-5 w-full max-w-none text-pretty text-lg leading-relaxed text-slate-200/95 sm:text-xl">
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
