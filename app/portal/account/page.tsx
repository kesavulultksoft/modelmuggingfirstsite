'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { changeMyPassword, fetchMe, getToken, setToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function AccountPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/account')
      return
    }
    fetchMe().then(setMe)
  }, [router])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  async function submitChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    if (!currentPassword || !newPassword) {
      setMsg('Current and new password are required.')
      return
    }
    if (newPassword.length < 8) {
      setMsg('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMsg('New password and confirm password do not match.')
      return
    }
    setBusy(true)
    try {
      const res = await changeMyPassword({ currentPassword, newPassword })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to change password.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMsg('Password changed successfully.')
    } catch (e) {
      setMsg(String((e as Error).message || e))
    }
    setBusy(false)
  }

  return (
    <>
      <PortalPageHeader title="Account" subtitle="Your portal profile and session." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submitChangePassword}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-bold text-slate-900">Change password</h3>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">
              Current password
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              New password
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Confirm new password
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
          {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {me.firstName} {me.lastName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-900">{me.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Role</dt>
              <dd className="mt-1">
                <span className="rounded-full bg-[#00d4aa]/15 px-3 py-1 text-xs font-bold text-[#0f766e]">
                  {me.role}
                </span>
              </dd>
            </div>
            {me.userType && (
              <div>
                <dt className="font-medium text-slate-500">Signup type</dt>
                <dd className="mt-1 text-slate-900">{me.userType}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            onClick={() => {
              setToken(null)
              router.push('/login')
            }}
            className="mt-8 w-full rounded-xl border-2 border-red-100 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  )
}
