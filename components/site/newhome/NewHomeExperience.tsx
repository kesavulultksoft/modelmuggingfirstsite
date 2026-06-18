'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Headphones, List, Menu, Mic2, X } from 'lucide-react'
import { hubHref } from '@/lib/siteHubRoutes'
import { urlForImage } from '@/lib/sanity/image'
import type { CmsHomeLandingContent, CmsImageField } from '@/lib/sanity/types'

/** Client brand guide (May 2025) */
const C = {
  lightBlue: '#1da1f2',
  darkBlue: '#1f497d',
  orange: '#ffa500',
} as const

/** Sticky nav + section ids (no card grid) */
const NAV_SECTIONS = [
  { id: 'training', short: 'Training', title: 'Types of training & locations' },
  { id: 'defending', short: 'Your time', title: 'Defending your time & money' },
  { id: 'podcast', short: 'Media', title: 'Self Defense Podcast/videos' },
  { id: 'circle', short: 'Support', title: 'Expanding the Circle' },
  { id: 'library', short: 'Library', title: 'Inside the Fight (MM library)' },
] as const

const BOTTOM_LINKS = [
  { href: hubHref('trainingProgramOverview'), label: 'Training' },
  { href: '/locations/', label: 'Locations' },
  { href: '/why-model-mugging-self-defense/', label: 'Why MM' },
  { href: '/self-defense-testimonials/', label: 'Stories' },
  { href: hubHref('mediaAndProducts'), label: 'Podcast / videos' },
  { href: hubHref('knowledgeCenter'), label: 'Library' },
  { href: '/crime-prevention/', label: 'Safety' },
  { href: '/contact/', label: 'Contact' },
] as const

const HERO_STATS = [
  { n: '100K+', l: 'Students taught' },
  { n: '50+', l: 'Years of curriculum' },
  { n: '97%', l: 'Success when attacked*' },
] as const

/** Decorative tint over placeholder photo per section */
const IMAGE_TINT: Record<string, string> = {
  training: 'from-[#1f497d]/35 via-transparent to-[#1da1f2]/20',
  defending: 'from-amber-500/25 via-transparent to-[#1f497d]/20',
  podcast: 'from-[#0f2847]/40 via-transparent to-sky-400/15',
  circle: 'from-rose-500/20 via-transparent to-[#1f497d]/15',
  library: 'from-teal-700/25 via-transparent to-slate-500/15',
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Stacked quick links inside the left white box */
function QuickLinksInBox({ links }: { links: { href: string; label: string }[] }) {
  if (!links.length) return null
  return (
    <nav className="mt-5 border-t border-slate-200/70 pt-5" aria-label="Quick links">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Quick links</p>
      <ul className="flex flex-col gap-1">
        {links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link
              href={l.href}
              className="-mx-1 block rounded-lg px-1 py-1.5 text-sm font-semibold text-[#1f497d] transition hover:bg-sky-50/90 hover:text-[#1da1f2]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function PrimaryCta({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] min-w-[11rem] items-center justify-center rounded-xl bg-[#ffa500] px-8 py-3.5 text-base font-bold text-[#0f172a] shadow-md transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2] ${className}`}
    >
      {children}
    </Link>
  )
}

function SecondaryCtaOutline({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[48px] min-w-[11rem] items-center justify-center rounded-xl border-2 border-white/55 bg-white/10 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition hover:border-white/80 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </button>
  )
}

function SecondaryCtaLight({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[#1f497d]/25 bg-white px-6 py-2.5 text-sm font-bold text-[#1f497d] transition hover:border-[#1da1f2]/60 hover:bg-sky-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1da1f2]"
    >
      {children}
    </Link>
  )
}

/** Full-bleed section background (unique per block) */
const SECTION_BAND_BG: Record<keyof typeof IMAGE_TINT, string> = {
  training: 'bg-[#e8f2fa]',
  defending: 'bg-[#faf6f0]',
  podcast: 'bg-[#f0eef8]',
  circle: 'bg-[#fdf2f7]',
  library: 'bg-[#edf4ff]',
}

/** Same layout as training: full-width title + subtitle, white left box, image right */
function SectionBand({
  sectionKey,
  title,
  description,
  imageAlt,
  imageSrc = '/placeholder.svg',
  imagePriority,
  children,
}: {
  sectionKey: keyof typeof IMAGE_TINT
  title: string
  description: string
  imageAlt: string
  imageSrc?: string
  imagePriority?: boolean
  children: React.ReactNode
}) {
  const tint = IMAGE_TINT[sectionKey] ?? 'from-[#1f497d]/25 to-transparent'

  return (
    <div className="site-page-gutter-x mx-auto max-w-7xl pb-2 pt-10 sm:pt-12 lg:pb-4 lg:pt-14">
      <header className="text-left">
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.15rem,2.4vw,1.5rem)] font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.35rem] lg:text-[1.45rem]">
          {title}
        </h2>
        <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-[0.9375rem]">
          {description}
        </p>
      </header>

      <div className="mt-8 grid items-stretch gap-6 sm:mt-10 lg:grid-cols-2 lg:gap-8">
        <div className="flex min-h-[min(260px,48vw)] flex-col overflow-visible rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(31,73,125,0.1)] sm:min-h-[min(280px,45vw)] sm:p-8">
          {children}
        </div>

        <figure className="relative aspect-[4/3] min-h-[240px] w-full overflow-hidden rounded-3xl bg-slate-200 shadow-[0_8px_30px_-12px_rgba(31,73,125,0.2)] ring-1 ring-slate-200/80 sm:min-h-[280px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority={imagePriority}
          />
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tint}`}
            aria-hidden
          />
        </figure>
      </div>
    </div>
  )
}

function imageSrcFor(image?: CmsImageField) {
  return urlForImage(image, { width: 1200, height: 900, fit: 'crop' }) ?? '/placeholder.svg'
}

export default function NewHomeExperience({ content }: { content?: CmsHomeLandingContent }) {
  const [active, setActive] = useState<string>(NAV_SECTIONS[0].id)
  const [mobileBucketsOpen, setMobileBucketsOpen] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const ids = useMemo(() => NAV_SECTIONS.map((b) => b.id), [])

  useEffect(() => {
    const nodes = ids
      .map((id) => sectionRefs.current[id])
      .filter(Boolean) as HTMLElement[]
    if (!nodes.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActive(visible[0].target.id)
      },
      { rootMargin: '-38% 0px -38% 0px', threshold: [0, 0.12, 0.28] },
    )
    nodes.forEach((n) => obs.observe(n))
    return () => obs.disconnect()
  }, [ids])

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-[4.5rem] pb-12 sm:pb-16"
        style={{
          background: `linear-gradient(155deg, ${C.darkBlue} 0%, #152f52 42%, #0c223d 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 22%, ${C.lightBlue}55 0%, transparent 42%),
              radial-gradient(circle at 82% 58%, ${C.orange}18 0%, transparent 38%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="site-page-gutter-x relative mx-auto max-w-7xl">
          <p className="text-center text-sm font-semibold tracking-wide text-white/90 sm:text-base">
            {content?.heroEyebrow || 'Model Mugging® self-defense · since 1971'}
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-center font-[family-name:var(--font-display)] text-[clamp(2rem,5.2vw,3.2rem)] font-bold leading-[1.08] tracking-tight text-white">
            {content?.heroTitle || 'Turning fear into power — with full-force practice you can trust.'}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/85 sm:text-lg">
            {content?.heroSubtitle ||
              'Weekend courses, small classes, and padded-assailant training so your body remembers under stress — not just theory.'}
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-6 sm:max-w-2xl sm:gap-10">
            {(content?.heroStats?.length === 3 ? content.heroStats : HERO_STATS).map((s, i) => (
              <div key={`${'l' in s ? s.l : s.label}-${i}`} className="text-center">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white sm:text-3xl">
                  {'n' in s ? s.n : s.value}
                </p>
                <p className="mt-1 text-xs font-medium text-white/70 sm:text-sm">{'l' in s ? s.l : s.label}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-3 max-w-lg text-center text-[10px] text-white/45 sm:text-xs">
            {content?.heroFootnote || '*Reported outcomes vary; see our testimonials and research pages.'}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <PrimaryCta href="/schedule/">{content?.heroPrimaryCtaLabel || 'Get started'}</PrimaryCta>
            <SecondaryCtaOutline onClick={() => scrollToId('training')}>
              {content?.heroSecondaryCtaLabel || 'Explore topics'}
            </SecondaryCtaOutline>
          </div>
          <p className="mt-4 text-center">
            <Link
              href="/self-defense-videos/"
              className="text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 transition hover:text-white hover:decoration-white"
            >
              {content?.heroVideoLabel || 'Watch videos'} →
            </Link>
          </p>
        </div>
      </section>

      {/* In-page navigator */}
      <div
        className="sticky top-[4.5rem] z-40 border-b border-white/10 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.25)] backdrop-blur-md"
        style={{ backgroundColor: `${C.darkBlue}f0` }}
      >
        <div className="site-page-gutter-x mx-auto flex max-w-7xl items-center gap-2 py-2.5">
          <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 md:inline-flex">
            <List className="h-3.5 w-3.5 opacity-90" aria-hidden />
            On this page
          </span>
          <nav
            className="flex flex-1 gap-1 overflow-x-auto pb-0.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="On this page — jump to a section"
          >
            {NAV_SECTIONS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  scrollToId(b.id)
                  setMobileBucketsOpen(false)
                }}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                  active === b.id ? 'text-[#0f172a] shadow-md' : 'text-white/92 hover:bg-white/12'
                }`}
                style={active === b.id ? { backgroundColor: C.lightBlue } : undefined}
              >
                {b.short}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white md:hidden"
            onClick={() => setMobileBucketsOpen((o) => !o)}
            aria-expanded={mobileBucketsOpen}
          >
            {mobileBucketsOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Sections
          </button>
        </div>
        {mobileBucketsOpen ? (
          <div className="border-t border-white/10 bg-[#0f2847]/98 px-4 py-3 md:hidden">
            <ul className="flex flex-col gap-0.5">
              {NAV_SECTIONS.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-3 text-left text-base font-semibold text-white hover:bg-white/10"
                    onClick={() => {
                      scrollToId(b.id)
                      setMobileBucketsOpen(false)
                    }}
                  >
                    {b.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Training */}
      <section
        id="training"
        ref={setRef('training')}
        className={`scroll-mt-[9rem] border-t border-slate-200/80 ${SECTION_BAND_BG.training} pb-10 sm:pb-14`}
      >
        <SectionBand
          sectionKey="training"
          title={content?.training?.title || 'Types of training & course locations'}
          description={
            content?.training?.description ||
            'Browse what we teach, where we teach it, and real outcomes from graduates. Your next class is a few taps away.'
          }
          imageAlt={content?.training?.image?.alt || 'Women’s self-defense class training environment'}
          imageSrc={imageSrcFor(content?.training?.image)}
          imagePriority
        >
          <>
            <p className="text-base leading-relaxed text-slate-700">
              {content?.training?.body ||
                'Weekend intensives, small classes, and padded-assailant training so your body remembers under stress. The full program overview lists every course type and location in one place — no hover menus, just clear links.'}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <PrimaryCta href={hubHref('trainingProgramOverview')}>
                {content?.training?.primaryCtaLabel || 'Explore training & locations'}
              </PrimaryCta>
              <SecondaryCtaLight href="/schedule/">
                {content?.training?.secondaryCtaLabel || 'Class schedule'}
              </SecondaryCtaLight>
            </div>
          </>
        </SectionBand>
      </section>

      {/* Defending */}
      <section
        id="defending"
        ref={setRef('defending')}
        className={`scroll-mt-[9rem] border-t border-slate-200/80 ${SECTION_BAND_BG.defending} pb-10 sm:pb-14`}
      >
        <SectionBand
          sectionKey="defending"
          title={content?.defending?.title || 'Defending your time & money'}
          description={
            content?.defending?.description ||
            'A focused weekend — not a years-long belt path. Short videos and clear pricing help you decide before you register.'
          }
          imageAlt={content?.defending?.image?.alt || 'Planning your self-defense training investment'}
          imageSrc={imageSrcFor(content?.defending?.image)}
        >
          <>
            <div className="flex flex-wrap items-start gap-3">
              <Mic2 className="h-9 w-9 shrink-0 text-[#1f497d]" aria-hidden />
              <p className="text-base font-medium leading-relaxed text-slate-700">
                {content?.defending?.body ||
                  'Plan your training investment — short videos, FAQs, and course context on a dedicated page.'}
              </p>
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <PrimaryCta href={hubHref('defendTimeAndMoney')}>
                {content?.defending?.primaryCtaLabel || 'Defend your time & money'}
              </PrimaryCta>
              <SecondaryCtaLight href="/self-defense-videos/">
                {content?.defending?.secondaryCtaLabel || 'Watch videos'}
              </SecondaryCtaLight>
            </div>
          </>
        </SectionBand>
      </section>

      {/* Podcast */}
      <section
        id="podcast"
        ref={setRef('podcast')}
        className={`scroll-mt-[9rem] border-t border-slate-200/80 ${SECTION_BAND_BG.podcast} pb-10 sm:pb-14`}
      >
        <SectionBand
          sectionKey="podcast"
          title={content?.podcast?.title || 'Self Defense Podcast/videos'}
          description={
            content?.podcast?.description ||
            'Conversations behind the padded suit — training culture, graduate stories, and instructor perspective. Subscribe on your favorite app when links are ready.'
          }
          imageAlt={content?.podcast?.image?.alt || 'Self defense podcast and videos'}
          imageSrc={imageSrcFor(content?.podcast?.image)}
        >
          <>
            <div className="flex items-start gap-3">
              <Headphones className="mt-0.5 h-9 w-9 shrink-0 text-[#1f497d]" aria-hidden />
              <div>
                <p className="font-semibold text-slate-900">Podcasts & video</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {content?.podcast?.body ||
                    'Full media hub with videos, podcast links, and more — managed in Sanity.'}
                </p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <PrimaryCta href={hubHref('mediaAndProducts')}>
                {content?.podcast?.primaryCtaLabel || 'Open media & products'}
              </PrimaryCta>
              <SecondaryCtaLight href="/self-defense-videos/">
                {content?.podcast?.secondaryCtaLabel || 'Video hub'}
              </SecondaryCtaLight>
            </div>
          </>
        </SectionBand>
      </section>

      {/* Circle */}
      <section
        id="circle"
        ref={setRef('circle')}
        className={`scroll-mt-[9rem] border-t border-slate-200/80 ${SECTION_BAND_BG.circle} pb-10 sm:pb-14`}
      >
        <SectionBand
          sectionKey="circle"
          title={content?.circle?.title || 'Expanding the Circle'}
          description={
            content?.circle?.description ||
            'Donate, stay in touch, teach, or volunteer — every path strengthens the program and the people we serve.'
          }
          imageAlt={content?.circle?.image?.alt || 'Community support and courage — Model Mugging'}
          imageSrc={imageSrcFor(content?.circle?.image)}
        >
          <>
            <p className="text-base leading-relaxed text-slate-700">
              {content?.circle?.body ||
                'Scholarships, newsletters, instructor paths, and partnerships — explore how to join the personal safety collective on the hub page.'}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <PrimaryCta href={hubHref('safetyCollective')}>
                {content?.circle?.primaryCtaLabel || 'Become part of the collective'}
              </PrimaryCta>
              <SecondaryCtaLight href="/donate-to-empowerment/">
                {content?.circle?.secondaryCtaLabel || 'Donate'}
              </SecondaryCtaLight>
            </div>
          </>
        </SectionBand>
      </section>

      {/* Library */}
      <section
        id="library"
        ref={setRef('library')}
        className={`scroll-mt-[9rem] border-t border-slate-200/80 ${SECTION_BAND_BG.library} pb-10 sm:pb-14`}
      >
        <SectionBand
          sectionKey="library"
          title={content?.library?.title || 'Inside the Fight (MM library)'}
          description={
            content?.library?.description ||
            'Crime prevention, self-defense context, and Model Mugging history — organized so you can browse without getting lost.'
          }
          imageAlt={content?.library?.image?.alt || 'Library — articles and safety resources'}
          imageSrc={imageSrcFor(content?.library?.image)}
        >
          <>
            <p className="text-base leading-relaxed text-slate-700">
              {content?.library?.body ||
                'Crime prevention, context, history, and stories — browse the full knowledge center with every resource laid out on one page.'}
            </p>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <PrimaryCta href={hubHref('knowledgeCenter')}>
                {content?.library?.primaryCtaLabel || 'Open the MM library'}
              </PrimaryCta>
              <SecondaryCtaLight href="/crime-prevention/">
                {content?.library?.secondaryCtaLabel || 'Crime prevention'}
              </SecondaryCtaLight>
            </div>
          </>
        </SectionBand>
      </section>

      {/* Bottom quick menu */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/15 md:relative md:border-t md:border-slate-200"
        style={{ backgroundColor: C.darkBlue }}
      >
        <nav
          className="mx-auto flex max-w-7xl overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] md:justify-center md:px-6 md:py-3.5 [&::-webkit-scrollbar]:hidden"
          aria-label="Quick links"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {BOTTOM_LINKS.map((l) =>
            l.href.startsWith('#') ? (
              <button
                key={l.label}
                type="button"
                onClick={() => scrollToId(l.href.slice(1))}
                className="shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/10 sm:px-3 sm:text-xs md:text-sm"
              >
                {l.label}
              </button>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-lg px-2.5 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/10 sm:px-3 sm:text-xs md:text-sm"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  )
}
