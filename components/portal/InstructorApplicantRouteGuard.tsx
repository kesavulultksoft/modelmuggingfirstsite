'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import {
  isInstructorOnboardingFormPath,
  isInstructorOperationsPath,
} from '@/lib/instructorPortalAccess'

export default function InstructorApplicantRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return
    }
    let cancelled = false
    fetchMe()
      .then((user: MeUser | null) => {
        if (cancelled) return
        setMe(user)
        if (!user || user.role !== 'INSTRUCTOR') {
          setReady(true)
          return
        }
        if (user.activeInstructor === true || !isInstructorOperationsPath(pathname)) {
          setReady(true)
          return
        }
        router.replace('/portal/instructor')
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>
    )
  }

  const onboardingLocked =
    me?.role === 'INSTRUCTOR' && me.activeInstructor === true && isInstructorOnboardingFormPath(pathname)

  if (!onboardingLocked) {
    return <>{children}</>
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-950 shadow-sm">
        <p className="font-semibold">Active instructor — onboarding forms are read-only</p>
        <p className="mt-1 text-indigo-900/90">
          You have been converted to an instructor (legacy status Completed). These steps are kept for reference
          only; use trainings, expenses, and documents for day-to-day work.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/portal/instructor/trainings"
            className="rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
          >
            Open trainings
          </Link>
          <Link
            href="/portal/instructor/onboarding-history"
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-900"
          >
            View history
          </Link>
        </div>
      </div>
      <fieldset disabled className="min-w-0 border-0 p-0 opacity-[0.92] [&_button]:cursor-not-allowed [&_input]:cursor-not-allowed [&_select]:cursor-not-allowed [&_textarea]:cursor-not-allowed">
        {children}
      </fieldset>
    </>
  )
}
