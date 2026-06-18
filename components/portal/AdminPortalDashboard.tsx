'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  FolderOpen,
  GraduationCap,
  Inbox,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'
import type { MeUser } from '@/lib/portalApi'
import {
  loadAdminDashboardSnapshot,
  type AdminDashboardCounts,
  type AdminDashboardSnapshot,
} from '@/lib/adminDashboardStats'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type CardDef = {
  href: string
  title: string
  blurb: string
  icon: typeof BookOpen
  countKey?: keyof AdminDashboardCounts
  hideCount?: boolean
  /** Highlight card when count &gt; 0 (pending queues). */
  alertWhenPositive?: boolean
}

type SectionDef = {
  title: string
  description: string
  cards: CardDef[]
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Courses & events',
    description: 'Schedules, rosters, and pre-instructor events.',
    cards: [
      {
        href: '/portal/admin/courses',
        title: 'Courses',
        blurb: 'Roster, vacancies, catalog',
        icon: BookOpen,
        countKey: 'courses',
      },
      {
        href: '/portal/admin/events',
        title: 'Pre-instructor events',
        blurb: 'Events & fees',
        icon: BookOpen,
        countKey: 'events',
      },
    ],
  },
  {
    title: 'People',
    description: 'Students, instructors, applicants, and portal accounts.',
    cards: [
      {
        href: '/portal/admin/students',
        title: 'Students',
        blurb: 'Profiles & registrations',
        icon: GraduationCap,
        countKey: 'students',
      },
      {
        href: '/portal/admin/instructors',
        title: 'Instructors',
        blurb: 'Active, archived, payments',
        icon: Users,
        countKey: 'instructors',
      },
      {
        href: '/portal/admin/trainer-pipeline',
        title: 'Applicant pipeline',
        blurb: 'CRM applicant stages',
        icon: UserPlus,
        countKey: 'trainerApplicants',
      },
      {
        href: '/portal/admin/trainer-applications',
        title: 'Portal applications',
        blurb: 'Public trainer signups',
        icon: UserPlus,
        countKey: 'trainerPortalApplications',
      },
      {
        href: '/portal/admin/bg-verification',
        title: 'BG verification',
        blurb: 'Pending review queue',
        icon: Shield,
        countKey: 'pendingBackgroundChecks',
        alertWhenPositive: true,
      },
      {
        href: '/portal/admin/contractors',
        title: 'BG investigators',
        blurb: 'Contractor roster',
        icon: ShieldCheck,
        countKey: 'contractors',
      },
      {
        href: '/portal/admin/interviews',
        title: 'Interviews',
        blurb: 'Interview candidates',
        icon: MessageSquare,
        countKey: 'interviewCandidates',
      },
      {
        href: '/portal/admin/users',
        title: 'Portal users',
        blurb: 'JWT accounts & roles',
        icon: Users,
        countKey: 'portalUsers',
      },
    ],
  },
  {
    title: 'Money & expenses',
    description: 'Payments, class accounting, and approvals.',
    cards: [
      {
        href: '/portal/admin/transactions',
        title: 'Transactions',
        blurb: 'All payment records',
        icon: CreditCard,
        countKey: 'transactions',
      },
      {
        href: '/portal/admin/accounts',
        title: 'Class expenses',
        blurb: 'Approve & mark paid',
        icon: DollarSign,
        countKey: 'pendingClassExpenses',
        alertWhenPositive: true,
      },
      {
        href: '/portal/admin/reports',
        title: 'Reports & exports',
        blurb: 'CSV & Excel downloads',
        icon: BarChart3,
        countKey: 'courses',
      },
    ],
  },
  {
    title: 'CRM & communications',
    description: 'Mailing lists, groups, and email tools.',
    cards: [
      {
        href: '/portal/admin/subscribers',
        title: 'Subscribers',
        blurb: 'Types & parents',
        icon: Mail,
        countKey: 'subscriptions',
      },
      {
        href: '/portal/admin/group-applications',
        title: 'Group applications',
        blurb: 'Group & pre-group',
        icon: Layers,
        countKey: 'groupApplications',
      },
      {
        href: '/portal/admin/email-center',
        title: 'Email center',
        blurb: 'Templates & send',
        icon: Inbox,
        hideCount: true,
      },
      {
        href: '/portal/admin/email-history',
        title: 'Email history',
        blurb: 'Sent mail log',
        icon: Inbox,
        countKey: 'emailHistory',
      },
    ],
  },
  {
    title: 'Content & operations',
    description: 'Library, equipment, and regional settings.',
    cards: [
      {
        href: '/portal/admin/library-docs',
        title: 'Library & docs',
        blurb: 'Training & marketing',
        icon: FolderOpen,
        hideCount: true,
      },
      {
        href: '/portal/admin/equipment-center',
        title: 'Equipment',
        blurb: 'Requests & inventory',
        icon: Wrench,
        countKey: 'equipmentPending',
        alertWhenPositive: true,
      },
      {
        href: '/portal/admin/operations',
        title: 'Regions & donations',
        blurb: 'Locations & web gifts',
        icon: BarChart3,
        countKey: 'donations',
      },
    ],
  },
]

function formatCount(value: number | null | undefined, loading: boolean): string {
  if (loading) return '—'
  if (value == null || value < 0) return '—'
  return value.toLocaleString()
}

function formatGeneratedAt(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function displayName(me: MeUser): string {
  const first = me.firstName?.trim()
  if (first) return first
  const email = me.email?.split('@')[0]
  return email || 'Admin'
}

export default function AdminPortalDashboard({ me }: { me: MeUser }) {
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    loadAdminDashboardSnapshot()
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
  }, [])

  const counts = snapshot?.counts

  const actionItems = useMemo(() => {
    if (!counts) return []
    const items: { label: string; count: number; href: string }[] = []
    if ((counts.pendingClassExpenses ?? 0) > 0) {
      items.push({
        label: 'Class expenses awaiting action',
        count: counts.pendingClassExpenses!,
        href: '/portal/admin/accounts',
      })
    }
    if ((counts.pendingBackgroundChecks ?? 0) > 0) {
      items.push({
        label: 'Background checks pending',
        count: counts.pendingBackgroundChecks!,
        href: '/portal/admin/bg-verification',
      })
    }
    if ((counts.equipmentPending ?? 0) > 0) {
      items.push({
        label: 'Equipment requests pending',
        count: counts.equipmentPending!,
        href: '/portal/admin/equipment-center',
      })
    }
    return items
  }, [counts])

  const kpiStrip = useMemo(
    () => [
      { label: 'Students', value: counts?.students, tone: 'teal' },
      { label: 'Courses', value: counts?.courses, tone: 'slate' },
      { label: 'Instructors', value: counts?.instructors, tone: 'indigo' },
      { label: 'Registrations', value: counts?.registrations, tone: 'violet' },
      { label: 'Subscribers', value: counts?.subscriptions, tone: 'emerald' },
      { label: 'Transactions', value: counts?.transactions, tone: 'amber' },
    ],
    [counts],
  )

  const toneClasses: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50',
    teal: 'border-teal-200 bg-teal-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    violet: 'border-violet-200 bg-violet-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
  }

  return (
    <>
      <PortalPageHeader
        title={`Welcome, ${displayName(me)}`}
        subtitle={`${me.role} workspace — live counts from your database${snapshot?.generatedAt ? ` · Updated ${formatGeneratedAt(snapshot.generatedAt)}` : ''}`}
      />

      {err ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>
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

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform snapshot</p>
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Refreshing…
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
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {formatCount(kpi.value, loading)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => (
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
              const countDisplay = card.hideCount ? null : formatCount(rawCount, loading)

              return (
                <Link
                  key={card.href + card.title}
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
