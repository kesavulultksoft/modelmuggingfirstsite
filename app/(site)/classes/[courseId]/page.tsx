import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchCourse, fetchUpcomingCourses } from '@/lib/api'
import { formatUsPhoneDisplay, telHref } from '@/lib/phoneUs'
import { formatCourseWhenLabel, formatSessionTimestamp } from '@/lib/usDate'
import JsonLd from '@/components/site/JsonLd'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import {
  ArrowRight,
  Calendar,
  Car,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UtensilsCrossed,
} from 'lucide-react'

type Props = { params: Promise<{ courseId: string }> }

export async function generateStaticParams() {
  try {
    const courses = await fetchUpcomingCourses()
    return courses.slice(0, 100).map((c) => ({ courseId: c.id }))
  } catch {
    return []
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params
  const c = await fetchCourse(courseId)
  if (!c) return { title: 'Class not found' }
  return {
    title: `${c.title} — ${c.locationLabel}`,
    description: `${c.title} in ${c.locationLabel}. ${formatCourseWhenLabel(c.sessionStarts[0])} Tuition ${c.feeDisplay}. Register online.`,
    openGraph: { title: c.title, description: c.description?.slice(0, 160) },
  }
}

function SectionHeading({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
        {children}
      </h2>
      {sub ? <p className="mt-1.5 text-sm text-slate-500">{sub}</p> : null}
    </div>
  )
}

export default async function ClassPage({ params }: Props) {
  const { courseId } = await params
  const c = await fetchCourse(courseId)
  if (!c) notFound()

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const whenLabel = formatCourseWhenLabel(c.sessionStarts[0])
  const registerHref = `/register?courseId=${c.id}`
  const sessionCount = c.sessionStarts.length
  const phoneDisplay = formatUsPhoneDisplay(c.contactPhone)

  const eventJson = {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: c.title,
    description: c.description || c.title,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: c.venueName || c.locationLabel,
      address: c.address || c.locationLabel,
    },
    organizer: { '@type': 'Organization', name: 'Model Mugging', url: site },
    offers: c.feeDisplay
      ? {
          '@type': 'Offer',
          price: c.feeDisplay.replace(/[^0-9.]/g, '') || undefined,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${site}/classes/${c.id}`,
        }
      : undefined,
  }

  return (
    <>
      <JsonLd data={eventJson} />
      <article className="min-h-[70vh]">
        <PageHero
          maxWidth="7xl"
          eyebrow={c.weekendLabel || 'Upcoming class'}
          title={c.title}
          back={{ href: '/schedule', label: 'Back to schedule' }}
          titleClassName="text-3xl sm:text-4xl md:text-[2.75rem] leading-tight"
          subtitle={
            c.venueName
              ? `${c.venueName} · ${c.locationLabel}`
              : `${c.locationLabel}${c.address ? ` — ${c.address}` : ''}`
          }
        >
          <div className="mt-6 flex flex-wrap gap-2.5">
            {whenLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-[#00d4aa]" aria-hidden />
                {whenLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-[#00d4aa]" aria-hidden />
              {c.locationLabel}
            </span>
            {sessionCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-[#00d4aa]" aria-hidden />
                {sessionCount} session{sessionCount !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </PageHero>

        <SiteMain className="relative z-10 -mt-10 pb-16 sm:-mt-12">
          {/* Quick facts — overlap hero */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">When</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                {whenLabel || 'Dates posted soon'}
              </p>
              {c.graduationDisplay ? (
                <p className="mt-2 text-sm text-slate-500">{c.graduationDisplay}</p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">Where</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                {c.venueName || c.locationLabel}
              </p>
              {(c.address || c.locationLabel) && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {c.address || c.locationLabel}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-white p-5 shadow-[0_8px_30px_rgba(13,148,136,0.12)] sm:col-span-2 lg:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Tuition</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-slate-900">
                {c.feeDisplay || 'Contact for pricing'}
              </p>
              <Link
                href={registerHref}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 lg:hidden"
              >
                Register now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] lg:items-start lg:gap-10 xl:gap-12">
            {/* Main column */}
            <div className="min-w-0 space-y-10">
              <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
                <SectionHeading sub="All session times for this course">Class schedule</SectionHeading>
                {c.sessionStarts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    Session times will be posted soon.
                  </p>
                ) : (
                  <ol className="relative space-y-0">
                    {c.sessionStarts.map((start, i) => (
                      <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
                        {i < c.sessionStarts.length - 1 ? (
                          <span
                            className="absolute left-5 top-11 bottom-0 w-px bg-gradient-to-b from-teal-300 to-teal-100"
                            aria-hidden
                          />
                        ) : null}
                        <span
                          className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 text-sm font-bold text-white shadow-md shadow-teal-600/25"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4">
                          <p className="font-semibold text-slate-900">{formatSessionTimestamp(start)}</p>
                          {c.sessionEnds[i] ? (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
                              Ends {formatSessionTimestamp(c.sessionEnds[i])}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {c.graduationDisplay ? (
                  <div className="mt-6 flex items-start gap-4 rounded-xl border border-teal-200/70 bg-teal-50/50 p-4 sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Graduation / demo</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.graduationDisplay}</p>
                    </div>
                  </div>
                ) : null}
              </section>

              {c.description ? (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
                  <SectionHeading sub="What to expect in this course">About this class</SectionHeading>
                  <div className="prose-site max-w-none">
                    <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">{c.description}</p>
                  </div>
                </section>
              ) : null}

              {(c.directions || c.parkingInfo || c.lunchInfo) ? (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
                  <SectionHeading sub="Plan your arrival">Venue &amp; logistics</SectionHeading>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {c.directions ? (
                      <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:col-span-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80">
                          <MapPin className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Directions</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.directions}</p>
                        </div>
                      </div>
                    ) : null}
                    {c.parkingInfo ? (
                      <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80">
                          <Car className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Parking</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.parkingInfo}</p>
                        </div>
                      </div>
                    ) : null}
                    {c.lunchInfo ? (
                      <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80">
                          <UtensilsCrossed className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Lunch</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.lunchInfo}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="mt-10 space-y-5 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
                <div className="bg-gradient-to-br from-[#0f172a] via-[#0c1222] to-[#064e3b] px-6 py-6 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5eead4]">Secure your spot</p>
                  {c.feeDisplay ? (
                    <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black tracking-tight">
                      {c.feeDisplay}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-white/75">
                    Create an account or sign in, then complete payment to register.
                  </p>
                </div>
                <div className="space-y-4 p-6">
                  <Link
                    href={registerHref}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00d4aa] px-6 py-4 text-base font-bold text-[#0f172a] shadow-[0_0_28px_rgba(0,212,170,0.35)] transition hover:bg-teal-300"
                  >
                    Register for this class
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                      Full-force adrenaline stress training
                    </li>
                    <li className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                      {whenLabel || 'See schedule for dates'}
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                      {c.locationLabel}
                    </li>
                  </ul>
                  <Link
                    href="/schedule"
                    className="block text-center text-sm font-semibold text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline"
                  >
                    Browse other classes
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Questions?</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {c.instructorName ? (
                    <li className="flex items-center gap-3 text-slate-700">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-teal-700">
                        <User className="h-4 w-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Lead contact
                        </span>
                        {c.instructorName}
                      </span>
                    </li>
                  ) : null}
                  {c.contactEmail ? (
                    <li>
                      <a
                        href={`mailto:${c.contactEmail}`}
                        className="flex items-center gap-3 rounded-lg border border-transparent p-1 text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-teal-700">
                          <Mail className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 break-all font-medium text-teal-800 hover:underline">
                          {c.contactEmail}
                        </span>
                      </a>
                    </li>
                  ) : null}
                  {phoneDisplay ? (
                    <li>
                      <a
                        href={telHref(c.contactPhone)}
                        className="flex items-center gap-3 rounded-lg border border-transparent p-1 text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-teal-700">
                          <Phone className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="font-medium text-teal-800 hover:underline">{phoneDisplay}</span>
                      </a>
                    </li>
                  ) : null}
                  {!c.contactEmail && !phoneDisplay ? (
                    <li>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-900"
                      >
                        Contact the office
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            </aside>
          </div>
        </SiteMain>
      </article>
    </>
  )
}
