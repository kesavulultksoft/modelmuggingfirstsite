'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMe, fetchMessagesInbox, fetchNotifications, getToken } from '@/lib/portalApi'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { Bell, Mail } from 'lucide-react'

type Doc = Record<string, unknown>

export default function InboxPage() {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  const [notifications, setNotifications] = useState<Doc[]>([])
  const [messages, setMessages] = useState<Doc[]>([])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/student/inbox')
      return
    }
    fetchMe().then((u) => {
      if (!u) {
        router.replace('/login')
        return
      }
      setOk(true)
      fetchNotifications().then((r) => setNotifications(Array.isArray(r) ? r : []))
      fetchMessagesInbox().then((r) => setMessages(Array.isArray(r) ? r : []))
    })
  }, [router])

  if (!ok) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Inbox"
        subtitle="Notifications broadcast to you and messages tied to your legacy account email."
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold">Notifications</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {notifications.length === 0 ? (
              <li className="text-slate-500">No notifications.</li>
            ) : (
              notifications.map((n, i) => (
                <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="font-medium text-slate-800">{String(n.name ?? n.type ?? 'Notice')}</p>
                  {n.sentOn != null && (
                    <p className="mt-1 text-xs text-slate-500">{String(n.sentOn)}</p>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <Mail className="h-5 w-5 text-[#0d9488]" />
            <h2 className="font-bold">Messages</h2>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Pulled from legacy Message collection when your portal email matches a User record.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {messages.length === 0 ? (
              <li className="text-slate-500">No messages.</li>
            ) : (
              messages.map((m, i) => (
                <li key={i} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-900">{String(m.subject ?? m.title ?? 'Message')}</p>
                  <p className="mt-1 text-slate-600">{String(m.description ?? '')}</p>
                  {m.sentOn != null && (
                    <p className="mt-2 text-xs text-slate-400">{String(m.sentOn)}</p>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </>
  )
}
