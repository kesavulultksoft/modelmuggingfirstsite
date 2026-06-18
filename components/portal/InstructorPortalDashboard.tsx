'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  FolderOpen,
  GraduationCap,
  Inbox,
  Loader2,
  Mail,
  Plane,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import type { MeUser } from '@/lib/portalApi'
import { formatCourseAddress } from '@/lib/coursePortalDisplay'
import {
  loadInstructorDashboardSnapshot,
  type InstructorDashboardCounts,
  type InstructorDashboardSnapshot,
} from '@/lib/instructorDashboardStats'
import { extractCourseDocumentHex, pickNextCourseDisplay } from '@/lib/instructorNextCourse'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type CardDef = {
  href: string
  title: string
  blurb: string
  icon: typeof BookOpen
  countKey?: keyof InstructorDashboardCounts
  hideCount?: boolean
  alertWhenPositive?: boolean
  /** Only show for active (converted) instructors. */
  requiresActive?: boolean
}

type SectionDef = {
  title: string
  description: string
  cards: CardDef[]
  activeOnly?: boolean
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Home',
    description: 'Quick access to cart and dashboard.',
    cards: [
      {
        href: '/portal/instructor/cart',
        title: 'Cart',
        blurb: 'Pending cart checkouts',
        icon: ShoppingCart,
        countKey: 'cartItems',
        alertWhenPositive: true,
        requiresActive: true,
      },
    ],
  },
  {
    title: 'Active work',
    description: 'Courses, expenses, interviews, and day-to-day instructor tools.',
    activeOnly: true,
    cards: [
      {
        href: '/portal/instructor/trainings',
        title: 'Course management',
        blurb: 'Assigned trainings & rosters',
        icon: BookOpen,
        countKey: 'assignedCourses',
      },
      {
        href: '/portal/instructor/vacancies',
        title: 'Vacancy courses',
        blurb: 'Open classes to pick up',
        icon: GraduationCap,
        countKey: 'vacancyCourses',
      },
      {
        href: '/portal/instructor/expenses',
        title: 'Expenses',
        blurb: 'Open items not paid/rejected',
        icon: DollarSign,
        countKey: 'openExpenses',
        alertWhenPositive: true,
      },
      {
        href: '/portal/instructor/transactions',
        title: 'Transactions',
        blurb: 'Your payment history',
        icon: CreditCard,
        countKey: 'transactions',
      },
      {
        href: '/portal/instructor/interviews',
        title: 'Interview candidates',
        blurb: 'Assigned applicant interviews',
        icon: Users,
        countKey: 'interviews',
      },
      {
        href: '/portal/instructor/equipment',
        title: 'Equipment requests',
        blurb: 'Approval queue',
        icon: Wrench,
        countKey: 'equipmentRequests',
        alertWhenPositive: true,
      },
      {
        href: '/portal/instructor/calendar',
        title: 'Calendar',
        blurb: 'Session schedule view',
        icon: Calendar,
        hideCount: true,
      },
      {
        href: '/portal/instructor/email',
        title: 'Email & mass mail',
        blurb: 'Templates and sending',
        icon: Mail,
        hideCount: true,
      },
      {
        href: '/portal/instructor/email-history',
        title: 'Email history',
        blurb: 'Messages you sent',
        icon: Inbox,
        countKey: 'emailHistory',
      },
      {
        href: '/portal/instructor/certificates',
        title: 'Certificates',
        blurb: 'Completed course certs',
        icon: GraduationCap,
        countKey: 'certifications',
      },
    ],
  },
  {
    title: 'Profile & account',
    description: 'Application status and account settings.',
    cards: [
      {
        href: '/portal/instructor/trainer-application',
        title: 'Trainer application',
        blurb: 'Applicant form & progress',
        icon: ClipboardCheck,
        hideCount: true,
      },
      {
        href: '/portal/instructor/account-workspace',
        title: 'Account workspace',
        blurb: 'Profile, contact, tax',
        icon: User,
        hideCount: true,
      },
    ],
  },
  {
    title: 'Documents',
    description: 'Training library, forms, and liability uploads.',
    activeOnly: true,
    cards: [
      {
        href: '/portal/instructor/documents',
        title: 'Documents & library',
        blurb: 'Files across all sections',
        icon: FolderOpen,
        countKey: 'documentFiles',
      },
    ],
  },
  {
    title: 'Onboarding history',
    description: 'Reference snapshots from your applicant path (read-only).',
    cards: [
      {
        href: '/portal/instructor/onboarding-history',
        title: 'Onboarding timeline',
        blurb: 'Overall completion',
        icon: ClipboardCheck,
      },
      {
        href: '/portal/instructor/verification',
        title: 'Background verification',
        blurb: 'BG status & notes',
        icon: ShieldCheck,
        hideCount: true,
      },
      {
        href: '/portal/instructor/physical-verification',
        title: 'Physical verification',
        blurb: 'Medical & emergency',
        icon: User,
        hideCount: true,
      },
      {
        href: '/portal/instructor/travel',
        title: 'Travel information',
        blurb: 'Travel history',
        icon: Plane,
        hideCount: true,
      },
      {
        href: '/portal/instructor/measurements',
        title: 'Equipment sizes',
        blurb: 'Shirt & gear sizing',
        icon: Ruler,
        hideCount: true,
      },
      {
        href: '/portal/instructor/t-shirt',
        title: 'T-shirt & dress',
        blurb: 'Dress code orders',
        icon: ShoppingCart,
        hideCount: true,
      },
      {
        href: '/portal/instructor/basic-course',
        title: 'Basic instructor course',
        blurb: 'Foundational training',
        icon: BookOpen,
        hideCount: true,
      },
      {
        href: '/portal/instructor/expense-pool',
        title: 'Expense pool',
        blurb: 'Pool fee status',
        icon: DollarSign,
        hideCount: true,
      },
    ],
  },
]

function formatCount(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—'
  if (value == null || value < 0) return '—'
  return value.toLocaleString()
}

function displayName(me: MeUser): string {
  const first = me.firstName?.trim()
  if (first) return first
  return me.email?.split('@')[0] || 'Instructor'
}

function NextCourseBlock({ courses }: { courses: Record<string, unknown>[] }) {
  const next = useMemo(() => pickNextCourseDisplay(courses), [courses])
  const courseCount = courses.length

  if (!next) {
    return (
      <p className="mt-2 text-sm text-slate-600">
        No upcoming session dates on assigned courses.
        {courseCount > 0 ? (
          <>
            {' '}
            Open{' '}
            <Link href="/portal/instructor/trainings" className="font-semibold text-[#0d9488] hover:underline">
              Course management
            </Link>{' '}
            for upcoming classes, or check Past Courses for completed trainings.
          </>
        ) : (
          <>
            {' '}
            <Link href="/portal/instructor/vacancies" className="font-semibold text-[#0d9488] hover:underline">
              Vacancy courses
            </Link>{' '}
            lists classes you can pick up.
          </>
        )}
      </p>
    )
  }

  const hex = extractCourseDocumentHex(next.c)
  const title = String(
    next.c.templateId ?? next.c.courseName ?? next.c.locationName ?? next.c.venueName ?? 'Assigned course',
  )
  const locationLabel = String(next.c.locationName ?? next.c.venueName ?? '')

  return (
    <div className="mt-2">
      {hex ? (
        <Link
          href={`/portal/instructor/courses/${encodeURIComponent(hex)}`}
          className="text-base font-bold text-slate-900 hover:text-[#0d9488] hover:underline"
        >
          {title}
        </Link>
      ) : (
        <p className="text-base font-bold text-slate-900">{title}</p>
      )}
      {next.isPast ? (
        <p className="mt-1 text-sm text-amber-800">
          Listed sessions are in the past — earliest was{' '}
          {next.dt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Next session: {next.dt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
      {locationLabel ? <p className="mt-1 text-sm text-slate-500">{locationLabel}</p> : null}
      <p className="mt-1 text-sm text-slate-500">{formatCourseAddress(next.c)}</p>
      {typeof next.c.registrationCount === 'number' ? (
        <p className="mt-2 text-xs font-semibold text-teal-800">
          {next.c.registrationCount} registered on this course
        </p>
      ) : null}
    </div>
  )
}

export default function InstructorPortalDashboard({ me }: { me: MeUser }) {
  const isActiveInstructor = me.activeInstructor === true
  const [snapshot, setSnapshot] = useState<InstructorDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    loadInstructorDashboardSnapshot(isActiveInstructor)
      .then((data) => {
        if (!cancelled) setSnapshot(data)
      })
      .catch((e) => {
        if (!cancelled) setErr(String((e as Error).message || e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isActiveInstructor])

  const counts = snapshot?.counts
  const courses = snapshot?.courses ?? []
  const onboarding = snapshot?.onboarding

  const actionItems = useMemo(() => {
    if (!isActiveInstructor || !counts) return []
    const items: { label: string; count: number; href: string }[] = []
    if ((counts.openExpenses ?? 0) > 0) {
      items.push({ label: 'Open expenses', count: counts.openExpenses!, href: '/portal/instructor/expenses' })
    }
    if ((counts.equipmentRequests ?? 0) > 0) {
      items.push({
        label: 'Equipment requests',
        count: counts.equipmentRequests!,
        href: '/portal/instructor/equipment',
      })
    }
    if ((counts.cartItems ?? 0) > 0) {
      items.push({ label: 'Cart items', count: counts.cartItems!, href: '/portal/instructor/cart' })
    }
    return items
  }, [counts, isActiveInstructor])

  const kpiStrip = useMemo(() => {
    if (!isActiveInstructor) return []
    return [
      { label: 'Assigned courses', value: counts?.assignedCourses, tone: 'slate' },
      { label: 'Roster seats', value: counts?.rosterSeats, tone: 'teal' },
      { label: 'Open expenses', value: counts?.openExpenses, tone: 'amber', alert: true },
      { label: 'Interview queue', value: counts?.interviews, tone: 'indigo' },
      { label: 'Transactions', value: counts?.transactions, tone: 'violet' },
      { label: 'Onboarding ref.', value: onboarding?.progressPercent, tone: 'emerald', suffix: '%' },
    ]
  }, [counts, isActiveInstructor, onboarding?.progressPercent])

  const toneClasses: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50',
    teal: 'border-teal-200 bg-teal-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    violet: 'border-violet-200 bg-violet-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
  }

  const visibleSections = SECTIONS.filter((s) => !s.activeOnly || isActiveInstructor).map((section) => ({
    ...section,
    cards: section.cards.filter((c) => !c.requiresActive || isActiveInstructor),
  }))

  return (
    <>
      <PortalPageHeader
        title={`Welcome, ${displayName(me)}`}
        subtitle={
          isActiveInstructor
            ? 'Your active instructor workspace — live counts from courses, expenses, interviews, and CRM data.'
            : 'Applicant path — complete trainer application and onboarding. Course management unlocks after staff converts you to an active instructor.'
        }
      />

      {err ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>
      ) : null}

      {!isActiveInstructor ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50/80 px-4 py-4 shadow-sm">
          <p className="font-semibold text-teal-950">Applicant access</p>
          <p className="mt-1 text-sm text-teal-900/90">
            Operational areas are hidden until an admin marks you as an active instructor. Continue your application
            and onboarding steps below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/portal/instructor/trainer-application"
              className="inline-flex rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d9488]"
            >
              Trainer application
            </Link>
            <Link
              href="/portal/instructor/onboarding-history"
              className="inline-flex rounded-xl border border-teal-300 bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:border-[#0d9488]"
            >
              Onboarding timeline
            </Link>
          </div>
          {!loading && onboarding ? (
            <p className="mt-3 text-sm font-semibold text-teal-800">
              Onboarding reference: {onboarding.progressPercent}% complete
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && actionItems.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-800" aria-hidden />
            <h2 className="text-sm font-bold text-amber-950">Needs attention</h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {actionItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-white px-3 py-1.5 text-sm font-semibold text-amber-950 shadow-sm hover:border-amber-400"
                >
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                    {item.count.toLocaleString()}
                  </span>
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isActiveInstructor ? (
        <>
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Operations snapshot</p>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Loading…
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {kpiStrip.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-xl border p-3 ${toneClasses[kpi.tone] ?? toneClasses.slate}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{kpi.label}</p>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums ${
                      kpi.alert && (kpi.value ?? 0) > 0 ? 'text-amber-900' : 'text-slate-900'
                    }`}
                  >
                    {formatCount(kpi.value, loading)}
                    {kpi.suffix && !loading && kpi.value != null ? kpi.suffix : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/portal/instructor/trainings"
              className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488]"
            >
              Open course management
            </Link>
            <Link
              href="/portal/instructor/expenses"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#0d9488]"
            >
              Submit expense
            </Link>
            <Link
              href="/portal/instructor/vacancies"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#0d9488]"
            >
              Browse vacancies
            </Link>
          </div>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#0d9488]" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next course</p>
            </div>
            {loading ? (
              <div className="mt-3 h-16 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <NextCourseBlock courses={courses} />
            )}
          </section>
        </>
      ) : null}

      {visibleSections.map((section) => (
        <section key={section.title} className="mb-8">
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
            <p className="text-sm text-slate-600">{section.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.cards.map((card) => {
              const Icon = card.icon
              const rawCount = card.countKey ? counts?.[card.countKey] : null
              const isAlert = card.alertWhenPositive && (rawCount ?? 0) > 0
              const countDisplay = card.hideCount
                ? null
                : card.href === '/portal/instructor/onboarding-history' && onboarding
                  ? `${onboarding.progressPercent}%`
                  : formatCount(rawCount, loading)

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    isAlert
                      ? 'border-amber-300 ring-1 ring-amber-200/80 hover:border-amber-400'
                      : 'border-slate-200 hover:border-[#0d9488]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isAlert ? 'bg-amber-100 text-amber-900' : 'bg-teal-50 text-[#0d9488]'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    {card.hideCount ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Open
                      </span>
                    ) : (
                      <span
                        className={`font-[family-name:var(--font-portal-display)] text-2xl font-bold tabular-nums ${
                          loading ? 'text-slate-300' : isAlert ? 'text-amber-900' : 'text-slate-900'
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="ml-auto h-6 w-6 animate-spin text-slate-300" aria-hidden />
                        ) : (
                          countDisplay
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 font-bold text-slate-900">{card.title}</p>
                  <p className="mt-1 flex-1 text-sm text-slate-500">{card.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0d9488]">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
