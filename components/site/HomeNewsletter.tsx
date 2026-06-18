'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle2 } from 'lucide-react'

type HomeNewsletterContent = { title?: string; subtitle?: string; successMessage?: string }

export default function HomeNewsletter({ content }: { content?: HomeNewsletterContent }) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(false)
  const title = content?.title || 'Stay ahead. Stay safe.'
  const subtitle = content?.subtitle || 'Class dates & safety tips. Unsubscribe anytime.'
  const successMessage =
    content?.successMessage || "You're on the list — connect your email provider when ready."

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(true)
    setTimeout(() => setMsg(false), 5000)
  }

  return (
    <section
      id="newsletter"
      className="scroll-mt-[5.5rem] border-t border-[#00d4aa]/20 bg-[#070b14]"
      aria-labelledby="newsletter-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex shrink-0 items-start gap-3 lg:max-w-[280px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/20 text-[#00d4aa]">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2
                id="newsletter-heading"
                className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white sm:text-xl"
              >
                {title}
              </h2>
              <p className="mt-1 text-sm leading-snug text-white/55">
                {subtitle}
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#00d4aa]/50 focus:outline-none focus:ring-1 focus:ring-[#00d4aa]"
            />
            <button
              type="submit"
              className="min-h-[44px] shrink-0 rounded-xl bg-[#00d4aa] px-6 py-2.5 text-sm font-bold text-[#0f172a] transition hover:bg-teal-300 sm:px-8"
            >
              Subscribe
            </button>
          </form>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <Link
              href="/schedule"
              className="text-sm font-semibold text-white/70 transition hover:text-[#00d4aa]"
            >
              Schedule
            </Link>
            <span className="text-white/20" aria-hidden>
              ·
            </span>
            <Link
              href="/training"
              className="text-sm font-semibold text-white/70 transition hover:text-[#00d4aa]"
            >
              Training
            </Link>
          </div>
        </div>

        {msg && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-400/95">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {successMessage}
          </p>
        )}
      </div>
    </section>
  )
}
