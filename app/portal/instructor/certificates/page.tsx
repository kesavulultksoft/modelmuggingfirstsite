'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchInstructorCourses, fetchInstructorCrmView, fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { courseIdFromRow, formatCoursePickerLabel } from '@/lib/coursePortalDisplay'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { BookOpen } from 'lucide-react'

export default function InstructorCertificatesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [certs, setCerts] = useState<Record<string, unknown>[]>([])
  const [courses, setCourses] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/certificates')
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
    fetchInstructorCrmView('certifications')
      .then((d) => setCerts(legacyAsObjectArray(d)))
      .catch(() => setCerts([]))
    fetchInstructorCourses()
      .then((raw) => setCourses(Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []))
      .catch(() => setCourses([]))
  }, [me])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const completedCourses = courses.filter((c) => /complete|past/i.test(String(c.status || '')))

  return (
    <>
      <PortalPageHeader
        title="Certificates"
        subtitle="Certification records linked to your instructor profile (mm_certifications) plus context from your assigned courses."
      />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Certification records</h2>
        {certs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No certification documents are on file for your user id yet. When admin issues a certificate, it will list
            here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {certs.map((r, i) => {
              const title = String(
                r.certificateName || r.name || r.certificationName || r.type || r.title || 'Certificate'
              )
              const when = String(r.issuedDate || r.completedDate || r.createdDate || r.date || '')
              const status = String(r.status || r.certificateStatus || '—')
              return (
                <li
                  key={String(r._id || r.id || i)}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                >
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-slate-600">
                    {status}
                    {when ? ` · ${when}` : ''}
                  </p>
                  {String(r.documentUrl || r.url || r.fileName || '').trim() ? (
                    <p className="mt-2 text-xs text-[#0d9488]">
                      Document: {String(r.documentUrl || r.url || r.fileName)}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <BookOpen className="h-5 w-5 text-[#0d9488]" aria-hidden />
          <h2 className="text-lg font-bold">Related courses</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Courses in a completed state often align with certification milestones.
        </p>
        {completedCourses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No completed courses in your current assignment list.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {completedCourses.slice(0, 15).map((c, i) => {
              const id = courseIdFromRow(c, i)
              return (
                <li key={id}>
                  <Link href={`/portal/instructor/courses/${encodeURIComponent(id)}`} className="font-semibold text-[#0d9488] hover:underline">
                    {formatCoursePickerLabel(c)}
                  </Link>
                  <span className="text-slate-500"> · {String(c.status)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
