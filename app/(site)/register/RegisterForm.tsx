'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, MapPin } from 'lucide-react'
import AuthShell from '@/components/site/AuthShell'
import CourseRegistrationParticipantsForm from '@/components/register/CourseRegistrationParticipantsForm'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { checkPortalEmailExists, fetchCourse } from '@/lib/api'
import {
  COURSE_REGISTRATION_OPTIONS,
  defaultAttendeeCount,
  enrollPath,
  loginPathForCourse,
  multiplyFeeDisplay,
  parseCourseIdFromNext,
  parseUserType,
  registrationBackLink,
  roleForUserType,
  showsAttendeeCount,
  type CourseUserType,
} from '@/lib/courseRegistration'
import {
  buildParticipantsList,
  emptyPayer,
  emptyParticipant,
  needsParticipantsStep,
  needsPayerFields,
  participantFormCount,
  validateParticipants,
  type CourseParticipantDraft,
  type CoursePayerDraft,
} from '@/lib/courseRegistrationParticipants'
import { formatCourseWhenLabel } from '@/lib/usDate'
import { formatUsPhoneInput } from '@/lib/phoneUs'
import { resendVerificationEmail } from '@/lib/portalApi'
import type { CourseDTO } from '@/lib/types'

const API = () => process.env.NEXT_PUBLIC_MM_API || 'http://127.0.0.1:8080'

type Step = 'option' | 'account' | 'participants'

export default function RegisterForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/portal'
  const courseIdParam = sp.get('courseId')?.trim() || ''
  const courseId = courseIdParam || parseCourseIdFromNext(next) || ''
  const userTypeFromUrl = parseUserType(sp.get('userType'))

  const [step, setStep] = useState<Step>(courseId && !userTypeFromUrl ? 'option' : 'account')
  const [userType, setUserType] = useState<CourseUserType | null>(userTypeFromUrl)
  const [attendeeCount, setAttendeeCount] = useState(
    userTypeFromUrl ? defaultAttendeeCount(userTypeFromUrl) : 1,
  )
  const [course, setCourse] = useState<CourseDTO | null>(null)
  const [participants, setParticipants] = useState<CourseParticipantDraft[]>([emptyParticipant()])
  const [payer, setPayer] = useState<CoursePayerDraft>(emptyPayer())

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [awaitingVerify, setAwaitingVerify] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)

  const isCourseFlow = Boolean(courseId)
  const back = useMemo(() => registrationBackLink(courseId, next), [courseId, next])
  const isPayerFlow = needsPayerFields(userType)

  useEffect(() => {
    if (sp.get('intent') === 'trainer') {
      const q = next && next !== '/portal' ? `?next=${encodeURIComponent(next)}` : ''
      router.replace(`/apply/trainer${q}`)
    }
  }, [sp, next, router])

  useEffect(() => {
    if (!courseId) return
    fetchCourse(courseId).then(setCourse)
  }, [courseId])

  useEffect(() => {
    if (userTypeFromUrl) {
      setUserType(userTypeFromUrl)
      setAttendeeCount(defaultAttendeeCount(userTypeFromUrl))
      setStep('account')
    }
  }, [userTypeFromUrl])

  // Only resize participant slots when count changes — not on every render (avoids wiping in-progress forms).
  useEffect(() => {
    if (!userType || userType === 'UT3') return
    setParticipants((prev) => {
      const target = participantFormCount(userType, attendeeCount)
      if (prev.length === target) return prev
      return buildParticipantsList(target, prev)
    })
  }, [userType, attendeeCount])

  const tuitionDisplay = useMemo(() => {
    if (!course?.feeDisplay) return null
    return attendeeCount > 1 ? multiplyFeeDisplay(course.feeDisplay, attendeeCount) : course.feeDisplay
  }, [course, attendeeCount])

  const checkEmail = useCallback(async (value: string) => {
    const em = value.trim().toLowerCase()
    if (!em || !em.includes('@')) {
      setEmailExists(false)
      return
    }
    setCheckingEmail(true)
    const exists = await checkPortalEmailExists(em)
    setEmailExists(exists)
    setCheckingEmail(false)
  }, [])

  function selectOption(ut: CourseUserType) {
    setUserType(ut)
    setAttendeeCount((prev) => {
      if (showsAttendeeCount(ut) && prev > 1) return prev
      return defaultAttendeeCount(ut)
    })
  }

  function syncParticipantSlots(count: number) {
    const ut = userType
    if (!ut || ut === 'UT3') return
    setParticipants((prev) => buildParticipantsList(participantFormCount(ut, count), prev))
  }

  function continueFromAccount(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (password !== password2) {
      setErr('Passwords do not match')
      return
    }
    if (emailExists) {
      setErr('This email already has an account. Log in to continue registration for this class.')
      return
    }
    const ut = userType || 'UT3'
    if (ut === 'UT3') {
      if (!dob.trim() || !gender.trim() || !address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
        setErr('Date of birth, gender, and full address are required for class registration.')
        return
      }
      void submitRegistration()
      return
    }
    if (needsParticipantsStep(ut)) {
      const count = participantFormCount(ut, attendeeCount)
      const seeded = buildParticipantsList(count, participants)
      if (ut === 'UT2') {
        seeded[0] = {
          ...seeded[0],
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: formatUsPhoneInput(phone),
        }
      }
      setParticipants(seeded)
      setAttendeeCount(count)
      setStep('participants')
    }
  }

  async function submitRegistration() {
    setErr('')
    setMsg('')
    const ut = userType || 'UT3'
    if (isCourseFlow && !userType) {
      setErr('Please choose how you are registering.')
      setStep('option')
      return
    }
    if (password !== password2) {
      setErr('Passwords do not match')
      return
    }
    if (emailExists) {
      setErr('This email already has an account. Log in to continue registration for this class.')
      return
    }

    let participantPayload: CourseParticipantDraft[]
    if (needsParticipantsStep(ut)) {
      const expected = participantFormCount(ut, attendeeCount)
      const normalized = buildParticipantsList(expected, participants)
      const validationErr = validateParticipants(ut, normalized, expected)
      if (validationErr) {
        setErr(validationErr)
        return
      }
      participantPayload = normalized
    } else {
      participantPayload = [
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          dob: dob.trim(),
          phone: formatUsPhoneInput(phone),
          gender: gender.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
      ]
    }

    const payerPayload = isPayerFlow
      ? {
          parentFirstName: firstName.trim(),
          parentLastName: lastName.trim(),
          parentPhone: formatUsPhoneInput(phone),
          parentCity: payer.parentCity.trim() || city.trim(),
          parentState: payer.parentState.trim() || state.trim(),
          parentCountry: payer.parentCountry.trim() || 'USA',
        }
      : undefined

    const role = roleForUserType(ut)
    setBusy(true)
    const res = await fetch(`${API().replace(/\/$/, '')}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        role,
        userType: ut,
        phone: formatUsPhoneInput(phone).trim() || undefined,
        courseId: isCourseFlow && courseId ? courseId : undefined,
        attendeeCount: isCourseFlow ? attendeeCount : undefined,
        payer: payerPayload,
        participants: isCourseFlow ? participantPayload : undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      const message = (data as { error?: string }).error || 'Registration failed'
      if (res.status === 409 || /already exists/i.test(message)) {
        setEmailExists(true)
        setErr('An account with this email already exists. Please log in to register for this class.')
      } else {
        setErr(message)
      }
      return
    }
    const needsVerify =
      (data as { verificationRequired?: boolean }).verificationRequired === true ||
      !(data as { accessToken?: string }).accessToken
    if (needsVerify) {
      setAwaitingVerify(true)
      setMsg(
        isCourseFlow
          ? 'We sent a verification link to your email. After you confirm, you can continue to class payment.'
          : 'We sent a verification link to your email. Click it to activate your account, then log in.',
      )
      return
    }
    if (typeof window !== 'undefined' && (data as { accessToken?: string }).accessToken) {
      localStorage.setItem('mm_token', (data as { accessToken: string }).accessToken)
    }
    if (isCourseFlow && userType) {
      const path = enrollPath(courseId, userType)
      const q = `${path}&attendees=${attendeeCount}`
      setMsg('Account created. Continuing to payment…')
      setTimeout(() => {
        window.location.href = q
      }, 600)
      return
    }
    setMsg('Account created. Redirecting…')
    setTimeout(() => {
      window.location.href = next
    }, 800)
  }

  const input =
    'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/15'

  const loginHref = useMemo(() => {
    if (isCourseFlow && userType) {
      const base = loginPathForCourse(courseId, userType)
      return `${base}&attendees=${attendeeCount}`
    }
    if (next && next !== '/portal') return `/login?next=${encodeURIComponent(next)}`
    return '/login'
  }, [isCourseFlow, courseId, userType, attendeeCount, next])

  if (step === 'option' && isCourseFlow) {
    return (
      <AuthShell
        maxWidth="xl"
        backHref={back.href}
        backLabel={back.label}
        title="Register for class"
        subtitle="Choose the option that best describes you — same four paths as our legacy registration."
      >
        {course ? (
          <div className="mb-6 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 to-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Selected class</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
              {course.title}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
              {formatCourseWhenLabel(course.sessionStarts[0]) ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-teal-600" aria-hidden />
                  {formatCourseWhenLabel(course.sessionStarts[0])}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-600" aria-hidden />
                {course.locationLabel}
              </span>
            </div>
            {course.feeDisplay ? (
              <p className="mt-3 text-lg font-black text-slate-900">{course.feeDisplay}</p>
            ) : null}
          </div>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-bold text-slate-800">
            Choose one <span className="text-rose-600">*</span>
          </legend>
          {COURSE_REGISTRATION_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                userType === o.value
                  ? 'border-[#0d9488] bg-teal-50/60 ring-2 ring-[#0d9488]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="userType"
                className="mt-1 shrink-0"
                checked={userType === o.value}
                onChange={() => selectOption(o.value)}
              />
              <span>
                <span className="block font-semibold text-slate-900">{o.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{o.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {userType && showsAttendeeCount(userType) ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="block text-sm font-semibold text-slate-700">
              {userType === 'UT2' ? 'Number of attendees (including you)' : 'Number of students'}
            </label>
            <input
              type="number"
              min={1}
              max={15}
              required
              className={`${input} mt-1 max-w-[8rem]`}
              value={attendeeCount}
              onChange={(e) => {
                const n = Math.max(1, Math.min(15, Number(e.target.value) || 1))
                setAttendeeCount(n)
                syncParticipantSlots(n)
              }}
            />
            <p className="mt-2 text-xs text-slate-500">
              {userType === 'UT2'
                ? 'Default is 2 (parent/guardian + one student). Tuition is per attendee.'
                : 'Enter how many students you are registering. You will fill out each student’s form on the next steps.'}
            </p>
            {course?.feeDisplay && attendeeCount > 1 ? (
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Tuition: {multiplyFeeDisplay(course.feeDisplay, attendeeCount)}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!userType}
            onClick={() => {
              if (!userType) return
              if (showsAttendeeCount(userType)) {
                syncParticipantSlots(attendeeCount)
              }
              setStep('account')
            }}
            className="rounded-xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-40"
          >
            Continue
          </button>
          <Link
            href={`/classes/${courseId}`}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to class
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href={userType ? loginHref : `/login?next=${encodeURIComponent(`/classes/${courseId}`)}`} className="font-semibold text-[#0d9488] hover:underline">
            Log in
          </Link>
        </p>
      </AuthShell>
    )
  }

  const accountTitle = isPayerFlow
    ? 'Parent / guardian account'
    : isCourseFlow
      ? 'Create account & enroll'
      : 'Create account'

  return (
    <AuthShell
      maxWidth={isCourseFlow ? 'xl' : 'lg'}
      backHref={back.href}
      backLabel={back.label}
      title={step === 'participants' ? 'Student details' : accountTitle}
      subtitle={
        step === 'participants'
          ? 'Enter each attendee’s information (legacy participant block). Tuition is charged once for all attendees.'
          : isCourseFlow
            ? isPayerFlow
              ? 'Create your portal login as the paying parent or guardian. Student details come next.'
              : 'Create your portal account, then enter attendee details if needed.'
            : 'For class registration and your portal. Password at least 8 characters.'
      }
    >
      {isCourseFlow && course ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
          <p className="font-semibold text-slate-900">{course.title}</p>
          <p className="mt-1 text-slate-600">
            {formatCourseWhenLabel(course.sessionStarts[0]) || 'Dates posted soon'} · {course.locationLabel}
          </p>
          {userType ? (
            <p className="mt-2 text-slate-600">
              <span className="font-semibold text-slate-800">Type:</span>{' '}
              {COURSE_REGISTRATION_OPTIONS.find((o) => o.value === userType)?.label}
            </p>
          ) : null}
          {tuitionDisplay ? (
            <p className="mt-2 font-black text-slate-900">Tuition: {tuitionDisplay}</p>
          ) : null}
          {step !== 'option' ? (
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-[#0d9488] hover:underline"
              onClick={() => setStep('option')}
            >
              Change registration type
            </button>
          ) : null}
        </div>
      ) : null}

      {awaitingVerify ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-6 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">Check your email</p>
          <p className="mt-2 leading-relaxed">
            We sent a verification link to <strong>{email}</strong>. Open it within 48 hours to confirm you own
            this address. Until then you cannot log in or pay for a class.
          </p>
          {msg ? <p className="mt-3 text-teal-900">{msg}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={resendBusy}
              onClick={async () => {
                setResendBusy(true)
                setErr('')
                try {
                  await resendVerificationEmail(email)
                  setMsg('If your account is pending verification, a new email was sent.')
                } catch (ex) {
                  setErr(ex instanceof Error ? ex.message : 'Could not resend')
                } finally {
                  setResendBusy(false)
                }
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-[#0d9488] disabled:opacity-50"
            >
              {resendBusy ? 'Sending…' : 'Resend verification email'}
            </button>
            <Link
              href={loginHref}
              className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
            >
              Go to log in
            </Link>
          </div>
          {err ? <p className="mt-3 text-sm font-medium text-red-600">{err}</p> : null}
        </div>
      ) : step === 'participants' && userType ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submitRegistration()
          }}
          className="space-y-4"
        >
          {showsAttendeeCount(userType) ? (
            <div className="rounded-xl border border-teal-200/70 bg-teal-50/50 p-4 text-sm">
              <label className="block font-semibold text-slate-800">
                Students you are registering ({participants.length} of {attendeeCount})
              </label>
              <input
                type="number"
                min={1}
                max={15}
                className={`${input} mt-2 max-w-[8rem]`}
                value={attendeeCount}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(15, Number(e.target.value) || 1))
                  setAttendeeCount(n)
                  syncParticipantSlots(n)
                }}
              />
              <p className="mt-2 text-xs text-slate-600">
                Each student needs their own form below (legacy participant blocks).
              </p>
            </div>
          ) : null}
          <CourseRegistrationParticipantsForm
            userType={userType}
            participants={participants}
            onChange={setParticipants}
            payerEmail={email.trim()}
          />
          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setStep('account')}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#0f172a] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
            >
              {busy ? 'Creating account…' : 'Create account & continue'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={continueFromAccount} className="space-y-4">
          {isCourseFlow && userType && showsAttendeeCount(userType) ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700">Number of attendees</label>
              <input
                type="number"
                min={1}
                max={15}
                required
                className={input}
                value={attendeeCount}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(15, Number(e.target.value) || 1))
                  setAttendeeCount(n)
                  syncParticipantSlots(n)
                }}
              />
              <p className="mt-1 text-xs text-slate-500">
                {userType === 'UT2'
                  ? 'Include yourself plus each student under 18 (legacy default is 2).'
                  : 'Must match the number of student detail forms on the next step.'}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                {isPayerFlow ? 'Parent/guardian first name' : 'First name'}
              </label>
              <input
                required
                className={input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                {isPayerFlow ? 'Parent/guardian last name' : 'Last name'}
              </label>
              <input
                required
                className={input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              {isPayerFlow ? 'Parent/guardian email (portal login)' : 'Email'}
            </label>
            <input
              required
              type="email"
              className={input}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailExists(false)
              }}
              onBlur={(e) => void checkEmail(e.target.value)}
              autoComplete="email"
            />
            {checkingEmail ? <p className="mt-1 text-xs text-slate-500">Checking email…</p> : null}
            {emailExists ? (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                You already have an account with us.{' '}
                <Link href={loginHref} className="font-bold text-[#0d9488] underline">
                  Log in to register for this class
                </Link>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Phone</label>
            <input
              type="tel"
              className={input}
              inputMode="tel"
              placeholder="999-999-9999"
              value={phone}
              onChange={(e) => setPhone(formatUsPhoneInput(e.target.value))}
              autoComplete="tel"
            />
          </div>

          {isPayerFlow ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                City
                <input
                  className={input}
                  value={payer.parentCity}
                  onChange={(e) => setPayer((p) => ({ ...p, parentCity: e.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                State
                <input
                  className={input}
                  value={payer.parentState}
                  onChange={(e) => setPayer((p) => ({ ...p, parentState: e.target.value }))}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Country
                <select
                  className={input}
                  value={payer.parentCountry}
                  onChange={(e) => setPayer((p) => ({ ...p, parentCountry: e.target.value }))}
                >
                  <option value="USA">United States</option>
                </select>
              </label>
            </div>
          ) : null}

          {userType === 'UT3' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Date of birth
                <UsDatePicker
                  id="ut3-dob"
                  value={dob}
                  onChange={setDob}
                  buttonClassName={`${input} h-auto min-h-[2.75rem] justify-start shadow-none hover:bg-white`}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Gender
                <select required className={input} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select…</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Street address
                <input
                  required
                  className={input}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                City
                <input required className={input} value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                State
                <input required className={input} value={state} onChange={(e) => setState(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                ZIP code
                <input
                  required
                  className={input}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  autoComplete="postal-code"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
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
            <div>
              <label className="block text-sm font-semibold text-slate-700">Confirm password</label>
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

          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
          {msg && <p className="text-sm font-semibold text-teal-600">{msg}</p>}

          <button
            type="submit"
            disabled={busy || emailExists}
            className="w-full rounded-xl bg-[#0f172a] py-3.5 text-base font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
          >
            {busy
              ? 'Creating account…'
              : userType === 'UT3'
                ? 'Create account & continue'
                : 'Continue to student details'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href={loginHref} className="font-semibold text-[#0d9488] hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
