'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  downloadStudentCertificate,
  fetchMe,
  fetchStudentCoursesAttended,
  getToken,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { attendedCourseTitle, attendedRowToCourseLike } from '@/lib/studentAttendedCourse'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import StudentCourseDetailBlock from '@/components/portal/StudentCourseDetailBlock'

export default function StudentCertificatesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [attended, setAttended] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/certificates')
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
      .then((d) => setAttended(legacyAsObjectArray(d)))
      .catch(() => setAttended([]))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Certificates"
        subtitle="Download a PDF certificate for each completed class. The PDF uses the official course name, location, and session dates."
      />
      {attended.length === 0 ? (
        <p className="text-sm text-slate-600">
          Complete a class to see it listed here.{' '}
          <Link href="/portal/student/history" className="font-semibold text-[#0d9488] hover:underline">
            Courses attended
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {attended.map((c, i) => {
            const courseLike = attendedRowToCourseLike(c)
            const courseId = String(c.courseId || '')
            return (
              <li
                key={courseId || i}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-teal-50/30 p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900">{attendedCourseTitle(c)}</p>
                  <StudentCourseDetailBlock course={courseLike} className="mt-3" compact />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#00d4aa]/20 px-4 py-1 text-xs font-bold text-[#0f766e]">
                    Completed
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadStudentCertificate(courseId || 'course')}
                    disabled={!courseId}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#00d4aa] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download certificate
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
