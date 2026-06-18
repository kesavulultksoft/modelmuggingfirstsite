'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMe, getToken, type MeUser } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

const KNOWN = new Set([
  'STUDENT',
  'PARENT',
  'INSTRUCTOR',
  'ADMIN',
  'SUPERADMIN',
  'BGAGENT',
  'EQUIPSPECIALIST',
])

export default function PortalHomeGeneralPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/home')
      return
    }
    fetchMe().then((u) => {
      if (!u) {
        router.replace('/login')
        return
      }
      if (KNOWN.has(u.role)) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title={`Welcome, ${me.firstName}`}
        subtitle="Your account is active. Use the links below while your full portal role is being configured."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/schedule"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#00d4aa]/40"
        >
          <p className="font-bold text-slate-900">Find a class</p>
          <p className="mt-2 text-sm text-slate-600">Browse schedule and register.</p>
        </Link>
        <Link
          href="/portal/student/inbox"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#00d4aa]/40"
        >
          <p className="font-bold text-slate-900">Inbox</p>
          <p className="mt-2 text-sm text-slate-600">Messages and notices.</p>
        </Link>
        <Link
          href="/portal/account"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#00d4aa]/40"
        >
          <p className="font-bold text-slate-900">Account</p>
          <p className="mt-2 text-sm text-slate-600">Profile and settings.</p>
        </Link>
        <Link
          href="/contact"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#00d4aa]/40"
        >
          <p className="font-bold text-slate-900">Contact</p>
          <p className="mt-2 text-sm text-slate-600">Reach the office for access help.</p>
        </Link>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        Applying as a trainer? Complete steps at{' '}
        <Link href="/register" className="font-semibold text-[#0d9488] hover:underline">
          Create account
        </Link>{' '}
        (Instructor) or email the office.
      </p>
    </>
  )
}
