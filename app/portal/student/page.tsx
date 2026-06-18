'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchMe,
  fetchMyEnrollments,
  fetchStudentDashboardCounts,
  getToken,
  type MeUser,
  type StudentEnrollmentView,
} from '@/lib/portalApi'
import { fetchUpcomingCourses } from '@/lib/api'
import type { CourseDTO } from '@/lib/types'
import { addStudentCartCourseId } from '@/lib/studentCart'
import { enrollmentDisplayTitle, isEnrolledInCourse } from '@/lib/studentEnrollment'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import StudentCourseDetailBlock, {
  courseDisplayTitle,
  courseLikeFromEnrollment,
} from '@/components/portal/StudentCourseDetailBlock'
import { Calendar, GraduationCap, Sparkles, ArrowRight } from 'lucide-react'

export default function StudentPortalPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [enrollments, setEnrollments] = useState<StudentEnrollmentView[]>([])
  const [courses, setCourses] = useState<CourseDTO[]>([])
  const [msg, setMsg] = useState('')
  const [reg, setReg] = useState<number | null>(null)
  const [ongoing, setOngoing] = useState<number | null>(null)
  const [attended, setAttended] = useState<number | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
    fetchMyEnrollments().then(setEnrollments)
    fetchUpcomingCourses().then(setCourses)
  }, [router])

  useEffect(() => {
    if (!me?.id) return
    fetchStudentDashboardCounts()
      .then((c) => {
        setReg(Number(c.registered) || 0)
        setOngoing(Number(c.ongoing) || 0)
        setAttended(Number(c.attended) || 0)
      })
      .catch(() => {
        setReg(null)
        setOngoing(null)
        setAttended(null)
      })
  }, [me?.id])

  const openCourses = useMemo(
    () => courses.filter((c) => !isEnrolledInCourse(enrollments, c.id)),
    [courses, enrollments],
  )

  function addToCartAndCheckout(id: string) {
    if (isEnrolledInCourse(enrollments, id)) return
    addStudentCartCourseId(id)
    setMsg('Added to cart. Continue to payment to complete enrollment.')
    router.push('/portal/student/courses')
  }

  if (!me) {
    return <div className="py-20 text-center text-slate-500">Loading…</div>
  }

  const quick = [
    { href: '/portal/student/courses', label: 'My classes' },
    { href: '/portal/student/history', label: 'Courses attended' },
    { href: '/portal/student/certificates', label: 'Certificates' },
    { href: '/portal/student/profile', label: 'Profile' },
    { href: '/portal/student/transactions', label: 'Transactions' },
    { href: '/portal/student/documents', label: 'Forms & prep' },
  ]

  return (
    <>
      <PortalPageHeader
        title={`Hi, ${me.firstName}`}
        subtitle="Student / parent hub — courses, profile, transactions, certificates, prep."
      />

      {(reg != null || ongoing != null || attended != null) && (
        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#0d9488]">{reg ?? '—'}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#0d9488]">{ongoing ?? '—'}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ongoing</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#0d9488]">{attended ?? '—'}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attended</p>
          </div>
        </div>
      )}

      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quick.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#00d4aa]/50"
          >
            {q.label}
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
            <Calendar className="h-5 w-5 text-[#0d9488]" />
            Open enrollment
          </h2>
          {openCourses.length === 0 ? (
            <p className="text-sm text-slate-600">
              {courses.length === 0
                ? 'No upcoming public classes right now.'
                : 'You are enrolled in all currently listed classes, or none are open.'}
            </p>
          ) : (
            <ul className="space-y-4">
              {openCourses.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{courseDisplayTitle(c)}</p>
                      <StudentCourseDetailBlock course={c} compact className="mt-2" />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/classes/${c.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#00d4aa]"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => addToCartAndCheckout(c.id)}
                        className="rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
                      >
                        Enroll
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {msg && <p className="mt-4 text-sm text-emerald-800">{msg}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
            <GraduationCap className="h-5 w-5 text-[#0d9488]" />
            Your enrollments
          </h2>
          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-600">You’re not enrolled in any classes yet.</p>
          ) : (
            <ul className="space-y-4">
              {enrollments.map((e) => (
                <li key={e.id || e.courseId} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/classes/${e.courseId}`}
                      className="font-semibold text-slate-900 hover:text-[#0d9488] hover:underline"
                    >
                      {enrollmentDisplayTitle(e)}
                    </Link>
                    <span className="rounded-full bg-[#00d4aa]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f766e]">
                      {e.status}
                    </span>
                  </div>
                  <StudentCourseDetailBlock
                    course={courseLikeFromEnrollment(e)}
                    compact
                    className="mt-2"
                  />
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/portal/student/courses"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0d9488] hover:underline"
          >
            <Sparkles className="h-4 w-4" />
            Manage classes
          </Link>
        </section>
      </div>
    </>
  )
}
