'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AuthShell from '@/components/site/AuthShell'
import { registrationBackLink } from '@/lib/courseRegistration'
import { resendVerificationEmail } from '@/lib/portalApi'

function LoginInner() {
  const sp = useSearchParams()
  const nextUrl = sp.get('next') || '/portal'
  const courseIdParam = sp.get('courseId')?.trim() || ''
  const back = useMemo(() => registrationBackLink(courseIdParam || null, nextUrl), [courseIdParam, nextUrl])
  const api = process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendBusy, setResendBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setShowResend(false)
    setResendMsg('')
    const res = await fetch(`${api}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (res.status === 403 && (data as { code?: string }).code === 'EMAIL_NOT_VERIFIED') {
        setShowResend(true)
      }
      setErr((data as { error?: string }).error || 'Login failed')
      return
    }
    if ((data as { accessToken?: string }).accessToken) {
      localStorage.setItem('mm_token', (data as { accessToken: string }).accessToken)
    }
    window.location.href = nextUrl
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Access your student, instructor, or admin portal."
      backHref={back.href}
      backLabel={back.label}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Email</label>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#0d9488] focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <input
            required
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#0d9488] focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && <p className="text-sm font-medium text-red-600">{err}</p>}
        {showResend && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>Your account needs a verified email before you can use the portal.</p>
            <button
              type="button"
              disabled={resendBusy || !email}
              onClick={async () => {
                setResendBusy(true)
                setResendMsg('')
                try {
                  await resendVerificationEmail(email)
                  setResendMsg('If this account is pending verification, a new email was sent.')
                } catch (ex) {
                  setResendMsg(ex instanceof Error ? ex.message : 'Could not resend')
                } finally {
                  setResendBusy(false)
                }
              }}
              className="mt-2 font-semibold text-[#0d9488] underline disabled:opacity-50"
            >
              Resend verification email
            </button>
            {resendMsg ? <p className="mt-2 text-xs text-amber-800">{resendMsg}</p> : null}
          </div>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#0f172a] py-3.5 text-base font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a]"
        >
          Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{' '}
        <Link
          href={(() => {
            if (nextUrl.includes('/portal/instructor/trainer-application')) {
              return `/apply/trainer?next=${encodeURIComponent(nextUrl)}`
            }
            const m = nextUrl.match(/\/portal\/student\/enroll\?([^#]+)/)
            if (m) {
              const q = new URLSearchParams(m[1])
              const cid = q.get('courseId')
              const ut = q.get('userType')
              if (cid) {
                const reg = new URLSearchParams({ courseId: cid })
                if (ut) reg.set('userType', ut)
                const att = q.get('attendees')
                if (att) reg.set('attendees', att)
                return `/register?${reg.toString()}`
              }
            }
            const classM = nextUrl.match(/\/classes\/([a-fA-F0-9]{24})/)
            if (classM) return `/register?courseId=${classM[1]}`
            if (nextUrl && nextUrl !== '/portal') {
              return `/register?next=${encodeURIComponent(nextUrl)}`
            }
            return '/register'
          })()}
          className="font-semibold text-[#0d9488] hover:underline"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/reset-password" className="text-slate-500 hover:text-[#0d9488]">
          Forgot password?
        </Link>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading…</div>}>
      <LoginInner />
    </Suspense>
  )
}
