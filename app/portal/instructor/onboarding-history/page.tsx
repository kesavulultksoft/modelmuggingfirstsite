'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorBackgroundVerification,
  fetchInstructorCrmProfile,
  fetchInstructorEquipmentMeasurement,
  fetchInstructorExpensePool,
  fetchInstructorPhysicalVerification,
  fetchInstructorTravelInfo,
  fetchMe,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Row = Record<string, unknown>

function normalizeStageStatusDisplay(v: unknown): string {
  if (v == null) return 'Pending'
  if (typeof v === 'boolean') return v ? 'Approved' : 'Pending'
  const raw = String(v).trim()
  if (!raw) return 'Pending'
  const lower = raw.toLowerCase()
  if (lower === 'true') return 'Approved'
  if (lower === 'false') return 'Pending'
  if (lower === 'successful') return 'Successful'
  if (lower === 'unsuccessful') return 'Unsuccessful'
  if (lower === 'submitted') return 'Submitted'
  if (lower === 'qualified') return 'Qualified'
  if (lower === 'notqualified' || lower === 'not qualified') return 'Not qualified'
  if (lower === 'completed') return 'Completed'
  if (lower === 'approved') return 'Approved'
  if (lower === 'rejected') return 'Rejected'
  return raw
}

function statusText(v: unknown) {
  return normalizeStageStatusDisplay(v)
}

function good(v: unknown) {
  return /approved|successful|completed|done|submitted|verified|qualified/i.test(statusText(v))
}

function StageBadge({ value }: { value: unknown }) {
  const ok = good(value)
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-bold ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {statusText(value)}
    </span>
  )
}

type StageRow = {
  key: string
  status: unknown
  note: string
  href?: string
}

export default function InstructorOnboardingHistoryPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profile, setProfile] = useState<Row>({})
  const [bg, setBg] = useState<Row>({})
  const [physical, setPhysical] = useState<Row>({})
  const [equipment, setEquipment] = useState<Row>({})
  const [travel, setTravel] = useState<Row>({})
  const [expensePool, setExpensePool] = useState<Row>({})

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/onboarding-history')
      return
    }
    fetchMe()
      .then((u) => {
        if (!u || u.role !== 'INSTRUCTOR') {
          router.replace('/portal')
          return
        }
        setMe(u)
      })
      .catch(() => router.replace('/portal'))
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchInstructorCrmProfile()
      .then((d) => setProfile(legacyAsRecord(d) || {}))
      .catch(() => setProfile({}))
    fetchInstructorBackgroundVerification()
      .then((d) => setBg(legacyAsRecord(d) || {}))
      .catch(() => setBg({}))
    fetchInstructorPhysicalVerification()
      .then((d) => setPhysical(legacyAsRecord(d) || {}))
      .catch(() => setPhysical({}))
    fetchInstructorEquipmentMeasurement()
      .then((d) => setEquipment(legacyAsRecord(d) || {}))
      .catch(() => setEquipment({}))
    fetchInstructorTravelInfo()
      .then((d) => setTravel(legacyAsRecord(d) || {}))
      .catch(() => setTravel({}))
    fetchInstructorExpensePool()
      .then((d) => setExpensePool(legacyAsRecord(d) || {}))
      .catch(() => setExpensePool({}))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const stages: StageRow[] = [
    {
      key: 'Contact information',
      status: profile.contactVerificationStatus ?? profile.contactInfoStatus,
      note: 'Saved profile syncs to Contact Information (legacy ContactInfo). Admin reviews from Applicant pipeline.',
      href: '/portal/instructor/onboarding-history/contact',
    },
    {
      key: 'Background',
      status: bg.status || profile.bgVerificationStatus,
      note: 'Background verification record',
      href: '/portal/instructor/verification',
    },
    {
      key: 'Physical',
      status: physical.status || profile.physicalVerificationStatus,
      note: 'Physicians clearance',
      href: '/portal/instructor/physical-verification',
    },
    {
      key: 'Shirts / uniform',
      status: profile.tShirtStatus || profile.tshirtStatus,
      note: 'Legacy Shirts/Uniform step',
      href: '/portal/instructor/t-shirt',
    },
    {
      key: 'Equipment',
      status: equipment.status || profile.equipmentStatus,
      note: 'Equipment measurement',
      href: '/portal/instructor/measurements',
    },
    {
      key: 'Travel',
      status: travel.status || profile.travelInfoStatus,
      note: 'Travel info',
      href: '/portal/instructor/travel',
    },
    {
      key: 'Basic course',
      status: profile.basicCourseStatus,
      note: 'Basic course prerequisite',
      href: '/portal/instructor/basic-course',
    },
    {
      key: 'Expense pool',
      status: expensePool.status || profile.expensePoolStatus,
      note: 'Expense pool enrollment',
      href: '/portal/instructor/expense-pool',
    },
  ]
  const complete = stages.filter((s) => good(s.status)).length
  const progress = Math.round((complete / stages.length) * 100)

  return (
    <>
      <PortalPageHeader
        title="Onboarding history"
        subtitle="Timeline from applicant to instructor (legacy Application Process). After admin converts you to an active instructor, these steps are read-only reference; use trainings and expenses for daily work."
      />

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">History summary</p>
            <p className="text-sm text-slate-600">Progress captured for audit; daily work uses trainings, expenses, and documents.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {complete}/{stages.length} complete
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Overall timeline completion</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{progress}%</p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ul>
          {stages.map((stage) => (
            <li
              key={stage.key}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                {stage.href ? (
                  <Link
                    href={stage.href}
                    className="font-semibold text-[#0d9488] hover:underline"
                  >
                    {stage.key}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">{stage.key}</span>
                )}
                <p className="text-xs text-slate-500">{stage.note}</p>
              </div>
              <StageBadge value={stage.status} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
