'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMe, fetchMyEnrollments, getToken, type MeUser, type StudentEnrollmentView } from '@/lib/portalApi'
import { fetchUpcomingCourses } from '@/lib/api'
import type { CourseDTO } from '@/lib/types'
import {
  addStudentCartCourseId,
  getStudentCartCourseIds,
  removeStudentCartCourseId,
  setStudentCartCourseIds,
} from '@/lib/studentCart'
import {
  enrolledCourseIds,
  enrollmentDisplayTitle,
  isActiveEnrollmentStatus,
  isCompletedEnrollmentStatus,
  isEnrolledInCourse,
} from '@/lib/studentEnrollment'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import StudentCourseDetailBlock, {
  courseDisplayTitle,
  courseLikeFromEnrollment,
} from '@/components/portal/StudentCourseDetailBlock'
import StudentCourseEnrollButton from '@/components/portal/StudentCourseEnrollButton'

export default function StudentCoursesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [enrollments, setEnrollments] = useState<StudentEnrollmentView[]>([])
  const [courses, setCourses] = useState<CourseDTO[]>([])
  const [cartIds, setCartIds] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/courses')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
    fetchMyEnrollments().then((list) => {
      setEnrollments(list)
      const enrolled = enrolledCourseIds(list)
      if (enrolled.size > 0) {
        const cur = getStudentCartCourseIds()
        const next = cur.filter((id) => !enrolled.has(id))
        if (next.length !== cur.length) {
          setStudentCartCourseIds(next)
          setCartIds(next)
        } else {
          setCartIds(cur)
        }
      } else {
        setCartIds(getStudentCartCourseIds())
      }
    })
    fetchUpcomingCourses().then(setCourses)
  }, [router])

  const currentEnrollments = useMemo(
    () => enrollments.filter((e) => isActiveEnrollmentStatus(e.status)),
    [enrollments],
  )
  const completedEnrollments = useMemo(
    () => enrollments.filter((e) => isCompletedEnrollmentStatus(e.status)),
    [enrollments],
  )

  const openCourses = useMemo(
    () => courses.filter((c) => !isEnrolledInCourse(enrollments, c.id)),
    [courses, enrollments],
  )

  function afterEnroll() {
    setMsg('You are enrolled in this class.')
    fetchMyEnrollments().then((list) => {
      setEnrollments(list)
      const enrolled = enrolledCourseIds(list)
      const next = getStudentCartCourseIds().filter((id) => !enrolled.has(id))
      setStudentCartCourseIds(next)
      setCartIds(next)
    })
  }

  function addToCart(id: string) {
    if (isEnrolledInCourse(enrollments, id)) return
    setCartIds(addStudentCartCourseId(id))
    setMsg('Class added to cart. Complete payment below to enroll.')
  }

  function removeFromCart(id: string) {
    setCartIds(removeStudentCartCourseId(id))
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const cartCourses = courses.filter((c) => cartIds.includes(c.id) && !isEnrolledInCourse(enrollments, c.id))

  return (
    <>
      <PortalPageHeader
        title="My classes"
        subtitle="Portal enrollments and open classes you can join (same flow as legacy student course dashboard)."
      />
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Current enrollments</h2>
        {currentEnrollments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">None yet — enroll below or on a class page.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {currentEnrollments.map((e) => (
              <li
                key={e.id || e.courseId + e.status}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/classes/${e.courseId}`}
                    className="font-semibold text-slate-900 hover:text-[#0d9488] hover:underline"
                  >
                    {enrollmentDisplayTitle(e)}
                  </Link>
                  <span className="rounded-full bg-[#00d4aa]/15 px-3 py-0.5 text-xs font-bold text-[#0f766e]">
                    {e.status}
                  </span>
                </div>
                <StudentCourseDetailBlock course={courseLikeFromEnrollment(e)} className="mt-3" />
                {e.attendees && e.attendees.length > 0 ? (
                  <ul className="mt-3 space-y-1 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
                    <li className="font-semibold text-slate-800">Class attendees</li>
                    {e.attendees.map((a, i) => (
                      <li key={`${a.firstName}-${a.lastName}-${i}`}>
                        {a.firstName} {a.lastName}
                        {a.dob ? <span className="text-slate-400"> · DOB {a.dob}</span> : null}
                        {a.primary ? (
                          <span className="ml-1 text-[10px] font-bold uppercase text-teal-700">
                            primary
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {completedEnrollments.length > 0 ? (
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">Completed classes</h2>
            <Link
              href="/portal/student/history"
              className="text-sm font-semibold text-[#0d9488] hover:underline"
            >
              View history & certificates →
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {completedEnrollments.map((e) => (
              <li
                key={e.id || `${e.courseId}-completed`}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/classes/${e.courseId}`}
                    className="font-semibold text-slate-900 hover:text-[#0d9488] hover:underline"
                  >
                    {enrollmentDisplayTitle(e)}
                  </Link>
                  <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-700">
                    Completed
                  </span>
                </div>
                <StudentCourseDetailBlock course={courseLikeFromEnrollment(e)} className="mt-3" />
                <p className="mt-3 text-xs">
                  <Link
                    href="/portal/student/certificates"
                    className="font-semibold text-[#0d9488] hover:underline"
                  >
                    Download certificate
                  </Link>
                  {' · '}
                  <Link href="/portal/student/history" className="font-semibold text-[#0d9488] hover:underline">
                    View in history
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">Cart</h2>
        {cartCourses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Your cart is empty. Add classes below, then pay to enroll.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {cartCourses.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{courseDisplayTitle(c)}</p>
                    <StudentCourseDetailBlock course={c} compact className="mt-2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(c.id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
                <StudentCourseEnrollButton
                  course={c}
                  onEnrolled={() => {
                    removeFromCart(c.id)
                    afterEnroll()
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {msg && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">{msg}</p>
      )}
      <section>
        <h2 className="mb-4 font-bold text-slate-900">Open classes</h2>
        {openCourses.length === 0 ? (
          <p className="text-sm text-slate-500">
            {courses.length === 0
              ? 'No upcoming classes listed.'
              : 'No additional classes available — you may already be enrolled in all listed classes.'}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openCourses.slice(0, 20).map((c) => {
              const inCart = cartIds.includes(c.id)
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{courseDisplayTitle(c)}</p>
                      <StudentCourseDetailBlock course={c} className="mt-3" />
                    </div>
                    <Link
                      href={`/classes/${c.id}`}
                      className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-[#00d4aa]"
                    >
                      Details
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={inCart}
                      onClick={() => addToCart(c.id)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#00d4aa] hover:text-[#0f766e] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {inCart ? 'In cart' : 'Add to cart'}
                    </button>
                    <p className="text-xs text-slate-500">Checkout from Cart section above</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {currentEnrollments.length > 0 ? (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-4 font-bold text-slate-900">Already enrolled</h2>
          <ul className="space-y-3">
            {currentEnrollments.map((e) => {
              const c = courses.find((row) => row.id === e.courseId)
              return (
                <li
                  key={e.id || e.courseId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {c ? courseDisplayTitle(c) : enrollmentDisplayTitle(e)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                    {e.status || 'Enrolled'}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </>
  )
}
