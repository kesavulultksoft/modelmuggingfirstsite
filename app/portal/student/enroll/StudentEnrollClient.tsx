'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, MapPin } from 'lucide-react'
import { fetchCourse } from '@/lib/api'
import {
  COURSE_REGISTRATION_OPTIONS,
  multiplyFeeDisplay,
  parseUserType,
} from '@/lib/courseRegistration'
import { formatCourseWhenLabel } from '@/lib/usDate'
import type { CourseDTO } from '@/lib/types'
import { removeStudentCartCourseId } from '@/lib/studentCart'
import { fetchCourseRegistrationDraft, fetchMe, getToken } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import StudentCourseEnrollButton from '@/components/portal/StudentCourseEnrollButton'

export default function StudentEnrollClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const courseId = sp.get('courseId')?.trim() || ''
  const userType = parseUserType(sp.get('userType'))
  const attendeeCount = Math.max(1, Math.min(20, Number(sp.get('attendees') || '1') || 1))

  const [course, setCourse] = useState<CourseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [draftParticipants, setDraftParticipants] = useState<
    { firstName?: string; lastName?: string; dob?: string }[]
  >([])

  const optionLabel = useMemo(
    () => COURSE_REGISTRATION_OPTIONS.find((o) => o.value === userType)?.label,
    [userType],
  )

  const tuitionLabel = useMemo(() => {
    if (!course?.feeDisplay) return '—'
    return attendeeCount > 1 ? multiplyFeeDisplay(course.feeDisplay, attendeeCount) : course.feeDisplay
  }, [course, attendeeCount])

  useEffect(() => {
    if (!getToken()) {
      const q = new URLSearchParams()
      if (courseId) q.set('courseId', courseId)
      if (userType) q.set('userType', userType)
      if (attendeeCount > 1) q.set('attendees', String(attendeeCount))
      router.replace(`/register?${q.toString()}`)
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
    })
    if (!courseId) {
      setLoading(false)
      setErr('Missing course. Choose a class from the schedule.')
      return
    }
    Promise.all([fetchCourse(courseId), fetchCourseRegistrationDraft(courseId).catch(() => null)])
      .then(([c, draft]) => {
        setCourse(c)
        if (!c) setErr('Class not found.')
        const parts = draft?.participants
        if (Array.isArray(parts)) {
          setDraftParticipants(
            parts.map((p) => {
              const row = p as Record<string, unknown>
              return {
                firstName: String(row.firstName ?? ''),
                lastName: String(row.lastName ?? ''),
                dob: String(row.dob ?? ''),
              }
            }),
          )
        }
      })
      .catch(() => setErr('Could not load class details.'))
      .finally(() => setLoading(false))
  }, [router, courseId, userType, attendeeCount])

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading checkout…</div>
  }

  if (!course) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">{err || 'Class unavailable.'}</p>
        <Link href="/schedule" className="mt-4 inline-block font-semibold text-[#0d9488] hover:underline">
          Back to schedule
        </Link>
      </div>
    )
  }

  const whenLabel = formatCourseWhenLabel(course.sessionStarts[0])

  return (
    <>
      <PortalPageHeader
        title="Complete registration"
        subtitle="You are almost done — review your class and pay tuition to secure your spot (legacy confirmation-page flow)."
      />

      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
          <p className="font-bold">You are enrolled in this class.</p>
          <Link href="/portal/student/courses" className="mt-3 inline-block font-semibold underline">
            View my classes
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">Class summary</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {course.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              {whenLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-teal-600" aria-hidden />
                  {whenLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-600" aria-hidden />
                {course.locationLabel}
              </span>
            </div>
            {optionLabel ? (
              <p className="mt-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Registration type:</span> {optionLabel}
                {attendeeCount > 1 ? (
                  <span className="text-slate-500"> · {attendeeCount} attendees</span>
                ) : null}
              </p>
            ) : null}
            <p className="mt-6 text-3xl font-black text-slate-900">{tuitionLabel}</p>
            {attendeeCount > 1 && course.feeDisplay ? (
              <p className="text-sm text-slate-500">
                {course.feeDisplay} × {attendeeCount} attendees
              </p>
            ) : null}
            <Link
              href={`/classes/${course.id}`}
              className="mt-6 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              View full class details
            </Link>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Continue with payment</h3>
            <p className="mt-2 text-sm text-slate-600">
              Pay tuition below to enroll all attendees in one transaction (legacy single checkout).
            </p>
            {draftParticipants.length > 0 ? (
              <ul className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                <li className="font-semibold text-slate-800">Registered attendees</li>
                {draftParticipants.map((p, i) => (
                  <li key={i} className="text-slate-600">
                    {p.firstName} {p.lastName}
                    {p.dob ? <span className="text-slate-400"> · DOB {p.dob}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6">
              <StudentCourseEnrollButton
                course={course}
                attendeeCount={attendeeCount}
                onEnrolled={() => {
                  removeStudentCartCourseId(course.id)
                  setDone(true)
                }}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
