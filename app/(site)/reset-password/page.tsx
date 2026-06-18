'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AuthShell from '@/components/site/AuthShell'
import { resetPassword } from '@/lib/portalApi'

function ResetInner() {
  const sp = useSearchParams()
  const token = sp.get('token') || ''
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    if (password !== password2) {
      setErr('Passwords do not match')
      return
    }
    if (!token) {
      setErr('Invalid reset link')
      return
    }
    const res = await resetPassword(token, password)
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr((j as { error?: string }).error || 'Reset failed')
      return
    }
    setMsg('Password updated. You can log in.')
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter a new password for your Model Mugging account."
    >
      {!token ? (
        <p className="text-sm text-red-600">Missing token. Use the link from your email.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">New password</label>
            <input
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Confirm password</label>
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#0f172a] py-3.5 font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
          >
            Update password
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-[#0d9488]">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading…</div>}>
      <ResetInner />
    </Suspense>
  )
}
