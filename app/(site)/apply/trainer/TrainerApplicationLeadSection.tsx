'use client'

import Link from 'next/link'
import { useState } from 'react'
import { INSTRUCTOR_GENDER_OPTIONS } from '@/lib/gender'
import { formatUsPhoneInput } from '@/lib/phoneUs'
import { submitPublicInstructorSignup } from '@/lib/portalApi'

export default function TrainerApplicationLeadSection() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [locationIntent, setLocationIntent] = useState('')
  const [notes, setNotes] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [hp, setHp] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (password !== password2) {
      setErr('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    if (!agreedTerms) {
      setErr('Please accept the terms to continue')
      return
    }
    setBusy(true)
    try {
      await submitPublicInstructorSignup({
        firstName,
        lastName,
        email,
        phone: formatUsPhoneInput(phone).trim(),
        gender,
        locationIntent: locationIntent.trim() || undefined,
        notes: notes.trim() || undefined,
        password,
        agreedTerms: true,
        ...(hp ? { website: hp } : {}),
      })
      setDone(true)
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-teal-400 focus:outline-none'

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0f18] text-white">
        <div className="site-page-shell py-16 lg:py-24">
          <div className="site-page-inner-wide">
            <div className="max-w-2xl rounded-2xl border border-teal-500/30 bg-teal-950/20 p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-400">Check your email</p>
              <h2 className="mt-3 font-sans text-2xl font-bold">Verify your address</h2>
              <p className="mt-4 text-white/75">
                We sent a message to <strong>{email}</strong>. Open it and tap <strong>Verify your email</strong> to
                activate your instructor account and open the portal. The link expires in 48 hours.
              </p>
              <p className="mt-6 text-sm text-white/55">
                After verifying, sign in with this email and the password you chose. Detailed application questions
                continue in <span className="text-white/80">Trainer application</span> in the portal nav.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?next=/portal/instructor/trainer-application"
                  className="inline-flex rounded-xl bg-teal-400 px-6 py-3 text-sm font-bold text-[#0a0f18] hover:bg-teal-300"
                >
                  Go to log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white">
      <div className="site-page-shell py-16 lg:py-24">
        <div className="site-page-inner-wide">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-400">Become an instructor</p>
              <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight">Apply in one step</h1>
              <p className="mt-4 text-lg text-white/70">
                Enter your contact details, choose a password, and accept the terms. We will email you a verification
                link — after you confirm, you can sign in and complete the full trainer questionnaire in the private
                portal (same pattern as the legacy instructor signup, updated for the new site).
              </p>
              <ol className="mt-8 space-y-3 text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-[#0a0f18]">
                    1
                  </span>
                  <span>Submit this form once (account is created, pending email verification).</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-[#0a0f18]">
                    2
                  </span>
                  <span>Click the link in your email to verify.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-[#0a0f18]">
                    3
                  </span>
                  <span>Log in and continue under Trainer application.</span>
                </li>
              </ol>
            </div>

            <div>
              <form
                onSubmit={onSubmit}
                className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8"
              >
                <h2 className="text-lg font-bold text-white">Instructor application</h2>
                <p className="mt-2 text-sm text-white/55">All fields marked are required unless noted.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">First name</label>
                    <input required className={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Last name</label>
                    <input required className={input} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Email</label>
                    <input required type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Phone</label>
                    <input
                      required
                      type="tel"
                      className={input}
                      inputMode="tel"
                      placeholder="999-999-9999"
                      value={phone}
                      onChange={(e) => setPhone(formatUsPhoneInput(e.target.value))}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                      Gender <span className="text-rose-300">*</span>
                    </label>
                    <select
                      required
                      className={input}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Choose gender</option>
                      {INSTRUCTOR_GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                      City / region / country intent
                    </label>
                    <input
                      className={input}
                      value={locationIntent}
                      onChange={(e) => setLocationIntent(e.target.value)}
                      placeholder="e.g. Bay Area, Austin, Germany"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                      Anything else? (optional)
                    </label>
                    <textarea
                      className={`${input} min-h-[100px] resize-y`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief note — detailed answers come in the portal."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Password</label>
                    <input
                      required
                      type="password"
                      minLength={8}
                      className={input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Confirm password</label>
                    <input
                      required
                      type="password"
                      minLength={8}
                      className={input}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-teal-400 focus:ring-teal-400"
                  />
                  <span>I agree to the terms and understand that training and certification are subject to staff review.</span>
                </label>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute h-px w-px opacity-0"
                  aria-hidden
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                />
                {err ? <p className="mt-4 text-sm font-medium text-rose-300">{err}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-xl bg-teal-400 py-3.5 text-sm font-bold text-[#0a0f18] transition hover:bg-teal-300 disabled:opacity-60"
                >
                  {busy ? 'Creating account…' : 'Create account & send verification'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
