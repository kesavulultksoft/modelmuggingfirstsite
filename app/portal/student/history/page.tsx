'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMe, fetchStudentCoursesAttended, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { attendedCourseTitle, attendedRowToCourseLike } from '@/lib/studentAttendedCourse'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import StudentCourseDetailBlock from '@/components/portal/StudentCourseDetailBlock'

export default function StudentHistoryPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/history')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'STUDENT' && u.role !== 'PARENT')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    fetchStudentCoursesAttended()
      .then((d) => setRows(legacyAsObjectArray(d)))
      .catch((e) => setErr(String(e.message || e)))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Courses attended"
        subtitle="Classes you have completed, with dates and location for your records."
      />
      {err && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}
      {rows.length === 0 && !err ? (
        <p className="text-sm text-slate-600">
          No completed courses found yet. After you finish a class, it appears here once the course has ended. You can
          also view{' '}
          <Link href="/portal/student/courses" className="font-semibold text-[#0d9488] hover:underline">
            current enrollments
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((c, i) => {
            const courseLike = attendedRowToCourseLike(c)
            const courseId = String(c.courseId || '')
            return (
              <li
                key={courseId || i}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-lg font-bold text-slate-900">{attendedCourseTitle(c)}</p>
                  <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-700">
                    Completed
                  </span>
                </div>
                <StudentCourseDetailBlock course={courseLike} className="mt-3" />
                {courseId ? (
                  <p className="mt-3 text-sm">
                    <Link href={`/classes/${courseId}`} className="font-semibold text-[#0d9488] hover:underline">
                      View class page
                    </Link>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
