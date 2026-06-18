'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell from '@/components/site/AuthShell'
import { verifyEmailToken } from '@/lib/portalApi'

function VerifyInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const token = sp.get('token') || ''
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!token) {
      setErr('Missing verification link. Use the link from your email.')
      setBusy(false)
      return
    }
    verifyEmailToken(token)
      .then((data) => {
        if (data.accessToken) {
          localStorage.setItem('mm_token', data.accessToken)
        }
        const dest =
          data.redirectPath?.trim() ||
          (data.user?.role === 'INSTRUCTOR'
            ? '/portal/instructor/trainer-application'
            : data.user?.role === 'STUDENT' || data.user?.role === 'PARENT'
              ? '/portal/student/courses'
              : '/portal')
        router.replace(dest)
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : 'Verification failed')
        setBusy(false)
      })
  }, [token, router])

  if (busy && !err) {
    return (
      <AuthShell title="Verifying email" subtitle="One moment…">
        <p className="text-center text-slate-600">Confirming your address…</p>
      </AuthShell>
    )
  }

  if (err) {
    return (
      <AuthShell title="Could not verify" subtitle="The link may be expired or invalid.">
        <p className="text-sm text-red-600">{err}</p>
        <p className="mt-4 text-sm text-slate-600">
          Request a new link from{' '}
          <Link href="/login" className="font-semibold text-[#0d9488] hover:underline">
            log in
          </Link>{' '}
          (resend verification), or{' '}
          <Link href="/register" className="font-semibold text-[#0d9488] hover:underline">
            register again
          </Link>{' '}
          if needed.
        </p>
      </AuthShell>
    )
  }

  return null
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  )
}
