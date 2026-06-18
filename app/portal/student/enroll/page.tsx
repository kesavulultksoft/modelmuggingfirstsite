import { Suspense } from 'react'
import StudentEnrollClient from './StudentEnrollClient'

export default function StudentEnrollPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading checkout…</div>}>
      <StudentEnrollClient />
    </Suspense>
  )
}
