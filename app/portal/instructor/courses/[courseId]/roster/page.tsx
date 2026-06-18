'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function InstructorRosterPage() {
  const params = useParams()
  const courseId = decodeURIComponent(String(params.courseId || ''))
  const router = useRouter()

  useEffect(() => {
    if (!courseId) return
    router.replace(`/portal/instructor/courses/${encodeURIComponent(courseId)}?tab=roster`)
  }, [router, courseId])

  return <div className="py-20 text-center text-slate-500">Opening course workspace…</div>
}
