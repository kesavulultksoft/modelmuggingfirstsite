'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import GroupApplicationProcessSteps from '@/components/groupCourse/GroupApplicationProcessSteps'
import GroupCourseFullApplicationForm from '@/components/groupCourse/GroupCourseFullApplicationForm'
import PreGroupApplicationForm from '@/components/groupCourse/PreGroupApplicationForm'
import {
  fetchGroupCourseApplicationAccess,
  type GroupCourseApplicationAccess,
} from '@/lib/groupCourseApi'

function InvalidLinkMessage({ message }: { message: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
      <div className="px-6 py-5">
        <p className="text-sm font-semibold text-amber-900">Personal application link</p>
        <p className="mt-2 text-sm text-amber-800">{message}</p>
        <p className="mt-3 text-sm text-amber-800">
          If you have not submitted a screening request yet, use the form below (Step 1). If you were approved, open
          the link from your email (it includes your personal groupCourseId in the URL).
        </p>
      </div>
    </div>
  )
}

export default function GroupCourseApplicationSection() {
  const searchParams = useSearchParams()
  const groupCourseId = (searchParams.get('groupCourseId') || '').trim()
  const [access, setAccess] = useState<GroupCourseApplicationAccess | null>(null)
  const [loading, setLoading] = useState(Boolean(groupCourseId))

  useEffect(() => {
    if (!groupCourseId) {
      setAccess(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchGroupCourseApplicationAccess(groupCourseId)
      .then(setAccess)
      .finally(() => setLoading(false))
  }, [groupCourseId])

  // —— Step 1: new groups (no approval link) ——
  if (!groupCourseId) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-7 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300">New group organizers</p>
          <h2 className="mt-2 text-2xl font-bold">Start your group course request</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Use the screening form below to apply. This is <strong className="text-white">Step 1</strong>. The full
            application opens only after our team reviews your request and sends you an approval email with your
            personal link.
          </p>
        </div>
        <GroupApplicationProcessSteps />
        <PreGroupApplicationForm />
      </div>
    )
  }

  // —— Step 2: approved link ——
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500">
        Verifying your application link…
      </div>
    )
  }

  if (!access?.valid) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <InvalidLinkMessage message={access?.error || 'This link is invalid or no longer active.'} />
        <GroupApplicationProcessSteps />
        <PreGroupApplicationForm />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <GroupCourseFullApplicationForm groupCourseId={groupCourseId} prefill={access} />
    </div>
  )
}
