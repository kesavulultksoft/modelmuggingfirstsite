'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import { ageFromDob } from '@/lib/ageFromDob'
import { formatUsPhoneDisplay, telHref } from '@/lib/phoneUs'
import { extractSubscriberGeo } from '@/lib/subscriberGeo'
import { crmDateFieldToUs } from '@/lib/usDate'
import { postAdminEmailSend } from '@/lib/portalApi'

export type StudentTableVariant = 'profiles' | 'registrations'

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

/** Stable React list key — mongo id when present, else composite fields + source index. */
function studentRowKey(r: Record<string, unknown>, index: number): string {
  const mongo = coerceMongoIdFromRow(r)
  if (mongo) return mongo
  for (const key of ['studentId', 'id', 'enrollmentId', 'registrationId', 'studentRegistrationId']) {
    const v = pickString(r, [key])
    if (v) return `${key}:${v}`
  }
  const parts = [
    pickString(r, ['emailAddress', 'email', 'emailId', 'studentEmail']),
    pickString(r, ['firstName', 'lastName', 'studentFirstName', 'studentLastName', 'studentName']),
    pickString(r, ['dob', 'dateOfBirth', 'birthDate']),
    pickString(r, ['contactNumber', 'phoneNumber', 'phone', 'mobile']),
    pickString(r, ['userId', 'portalUserId', 'mainUserId']),
    pickString(r, ['courseId']),
    pickString(r, ['createdDate', 'createdAt', 'updatedAt', 'enrolledAt']),
    pickString(r, ['locationName', 'courseName']),
  ]
  const composite = parts.filter(Boolean).join('\u0001')
  return composite ? `row:${index}:${composite}` : `row:idx:${index}`
}

export type NormalizedStudentProfile = {
  rowKey: string
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  dob: string
  age: string
  city: string
  stateRegion: string
  addressLine: string
  userId: string
  createdOn: string
  raw: Record<string, unknown>
}

export type NormalizedStudentRegistration = {
  rowKey: string
  id: string
  studentName: string
  email: string
  phone: string
  courseId: string
  courseLabel: string
  status: string
  paymentStatus: string
  registeredOn: string
  attendeeCount: string
  userId: string
  raw: Record<string, unknown>
}

function normalizeProfileRow(r: Record<string, unknown>, index: number): NormalizedStudentProfile {
  const firstName = pickString(r, ['firstName'])
  const lastName = pickString(r, ['lastName'])
  const geo = extractSubscriberGeo(r, {})
  const dobRaw = pickString(r, ['dob', 'dateOfBirth', 'birthDate'])
  const dobUs = dobRaw ? crmDateFieldToUs(dobRaw) : ''
  const ageNum = dobUs ? ageFromDob(dobUs) : null
  return {
    rowKey: studentRowKey(r, index),
    id: coerceMongoIdFromRow(r),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ') || '—',
    email: pickString(r, ['emailAddress', 'email', 'emailId']),
    phone: formatUsPhoneDisplay(pickString(r, ['contactNumber', 'phoneNumber', 'phone', 'mobile'])),
    dob: dobUs,
    age: ageNum != null ? String(ageNum) : '',
    city: geo.city,
    stateRegion: geo.stateRegion,
    addressLine: geo.addressLine,
    userId: pickString(r, ['userId', 'portalUserId']),
    createdOn: crmDateFieldToUs(r.createdDate ?? r.createdAt ?? r.updatedAt),
    raw: r,
  }
}

function normalizeRegistrationRow(r: Record<string, unknown>, index: number): NormalizedStudentRegistration {
  const firstName = pickString(r, ['firstName', 'studentFirstName'])
  const lastName = pickString(r, ['lastName', 'studentLastName'])
  const location = pickString(r, ['locationName', 'courseName', 'classLocation'])
  const courseId = pickString(r, ['courseId'])
  const status = pickString(r, ['status', 'registrationStatus']) || pickString(r, ['paymentStatus'])
  return {
    rowKey: studentRowKey(r, index),
    id: coerceMongoIdFromRow(r) || pickString(r, ['enrollmentId']),
    studentName: [firstName, lastName].filter(Boolean).join(' ') || pickString(r, ['studentName']) || '—',
    email: pickString(r, ['email', 'emailId', 'emailAddress', 'studentEmail']),
    phone: formatUsPhoneDisplay(pickString(r, ['contactNumber', 'phoneNumber', 'phone'])),
    courseId,
    courseLabel: location || (courseId ? `Course ${courseId.slice(0, 8)}…` : '—'),
    status,
    paymentStatus: pickString(r, ['paymentStatus', 'status']),
    registeredOn: crmDateFieldToUs(r.createdDate ?? r.enrolledAt ?? r.updatedAt ?? r.createdAt),
    attendeeCount: pickString(r, ['attendeeCount']),
    userId: pickString(r, ['userId', 'mainUserId']),
    raw: r,
  }
}

type ProfileSortKey = 'fullName' | 'email' | 'phone' | 'city' | 'dob' | 'createdOn'
type RegistrationSortKey = 'studentName' | 'email' | 'courseLabel' | 'status' | 'registeredOn'

type ColDef<T> = {
  key: string
  sortKey?: string
  label: string
  sortable: boolean
  className?: string
  cell: (row: T) => ReactNode
}

const PAGE_SIZE = 25

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronDown className="ml-1 inline h-3.5 w-3.5 opacity-30" aria-hidden />
  return dir === 'asc' ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-[#0d9488]" aria-hidden />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-[#0d9488]" aria-hidden />
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (!status) return <span className="text-slate-400">—</span>
  if (/paid|complete|successful|registered/i.test(s) && !/unpaid|unsuccessful|fail/i.test(s)) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
        {status}
      </span>
    )
  }
  if (/pending|submitted|progress|draft/i.test(s)) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
        {status}
      </span>
    )
  }
  if (/cancel|fail|reject|unpaid/i.test(s)) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
        {status}
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
      {status}
    </span>
  )
}

function under18Badge(age: string) {
  if (!age) return null
  const n = Number(age)
  if (!Number.isFinite(n) || n >= 18) return null
  return (
    <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
      Under 18
    </span>
  )
}

export default function AdminStudentsTable({
  rows,
  variant,
  loading = false,
  emptyMessage = 'No records match this filter.',
}: {
  rows: Record<string, unknown>[]
  variant: StudentTableVariant
  loading?: boolean
  emptyMessage?: string
}) {
  const [sortKey, setSortKey] = useState<string>(variant === 'profiles' ? 'fullName' : 'registeredOn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [detailProfile, setDetailProfile] = useState<NormalizedStudentProfile | null>(null)
  const [detailRegistration, setDetailRegistration] = useState<NormalizedStudentRegistration | null>(null)
  const [emailModal, setEmailModal] = useState<{ name: string; to: string; subject: string; body: string } | null>(
    null,
  )
  const [emailSending, setEmailSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')

  useEffect(() => {
    setPage(1)
    setDetailProfile(null)
    setDetailRegistration(null)
    setSortKey(variant === 'profiles' ? 'fullName' : 'registeredOn')
    setSortDir(variant === 'profiles' ? 'asc' : 'desc')
  }, [variant, rows.length])

  const profiles = useMemo(() => rows.map((r, i) => normalizeProfileRow(r, i)), [rows])
  const registrations = useMemo(() => rows.map((r, i) => normalizeRegistrationRow(r, i)), [rows])

  const sortedProfiles = useMemo(() => {
    const list = [...profiles]
    const key = sortKey as ProfileSortKey
    list.sort((a, b) => {
      const av = String(a[key] ?? '').toLowerCase()
      const bv = String(b[key] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [profiles, sortKey, sortDir])

  const sortedRegistrations = useMemo(() => {
    const list = [...registrations]
    const key = sortKey as RegistrationSortKey
    list.sort((a, b) => {
      const av = String(a[key] ?? '').toLowerCase()
      const bv = String(b[key] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [registrations, sortKey, sortDir])

  const sorted = variant === 'profiles' ? sortedProfiles : sortedRegistrations
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageProfiles = sortedProfiles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageRegistrations = sortedRegistrations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function toggleSort(key: string) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'registeredOn' || key === 'createdOn' ? 'desc' : 'asc')
    }
  }

  function openEmail(name: string, email: string) {
    if (!email) return
    setEmailMsg('')
    setEmailModal({
      name,
      to: email,
      subject: 'Model Mugging Self Defense',
      body: `Hello ${name.split(' ')[0] || name},\n\n`,
    })
  }

  async function sendEmail() {
    if (!emailModal) return
    const to = emailModal.to.trim()
    const subject = emailModal.subject.trim()
    const bodyText = emailModal.body.trim()
    if (!to || !subject || !bodyText) {
      setEmailMsg('To, subject, and body are required.')
      return
    }
    setEmailSending(true)
    setEmailMsg('')
    try {
      const res = await postAdminEmailSend({
        to,
        subject,
        text: bodyText,
        html: bodyText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>'),
        category: variant === 'profiles' ? 'student-profiles' : 'student-registrations',
      })
      const data = (await res.json().catch(() => ({}))) as { transportOk?: boolean }
      if (!res.ok) throw new Error('Send failed')
      setEmailMsg(data.transportOk === false ? 'Logged; SMTP may not be configured.' : 'Email sent.')
      setTimeout(() => {
        setEmailModal(null)
        setEmailMsg('')
      }, 1200)
    } catch (e) {
      setEmailMsg(String((e as Error).message || e))
    } finally {
      setEmailSending(false)
    }
  }

  const profileCols: ColDef<NormalizedStudentProfile>[] = [
    {
      key: 'student',
      sortKey: 'fullName',
      label: 'Student',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 text-xs font-bold text-teal-900 ring-2 ring-white">
            {initials(r.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.fullName}</p>
            {r.userId ? (
              <p className="truncate text-[11px] text-slate-500" title={r.userId}>
                Portal linked
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">CRM profile only</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      sortKey: 'email',
      label: 'Email',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (r) =>
        r.email ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openEmail(r.fullName, r.email)
            }}
            className="inline-flex max-w-[220px] items-center gap-1.5 truncate font-medium text-[#0d9488] hover:underline"
            title={`Send email to ${r.email}`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {r.email}
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'phone',
      sortKey: 'phone',
      label: 'Phone',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) =>
        r.phone ? (
          <a href={telHref(r.phone)} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#0d9488]">
            <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            {r.phone}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'location',
      sortKey: 'city',
      label: 'Location',
      sortable: true,
      cell: (r) => (
        <div className="flex items-start gap-1.5 text-slate-700">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="line-clamp-2 text-sm">
            {[r.city, r.stateRegion].filter(Boolean).join(', ') || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'dob',
      sortKey: 'dob',
      label: 'DOB / Age',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) => (
        <div className="flex flex-col gap-1">
          <span className="text-slate-700">{r.dob || '—'}</span>
          {r.age ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">{r.age} yrs</span>
              {under18Badge(r.age)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'createdOn',
      sortKey: 'createdOn',
      label: 'Profile date',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-slate-700">{r.createdOn || '—'}</span>,
    },
  ]

  const registrationCols: ColDef<NormalizedStudentRegistration>[] = [
    {
      key: 'student',
      sortKey: 'studentName',
      label: 'Student',
      sortable: true,
      className: 'min-w-[180px]',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-900 ring-2 ring-white">
            {initials(r.studentName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.studentName}</p>
            {r.attendeeCount ? (
              <p className="text-[11px] text-slate-500">{r.attendeeCount} attendee(s)</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      sortKey: 'email',
      label: 'Email',
      sortable: true,
      className: 'min-w-[180px]',
      cell: (r) =>
        r.email ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openEmail(r.studentName, r.email)
            }}
            className="inline-flex max-w-[200px] items-center gap-1.5 truncate font-medium text-[#0d9488] hover:underline"
            title={`Send email to ${r.email}`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {r.email}
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'course',
      sortKey: 'courseLabel',
      label: 'Course',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (r) =>
        r.courseId ? (
          <Link
            href={`/portal/admin/courses/${encodeURIComponent(r.courseId)}`}
            onClick={(e) => e.stopPropagation()}
            className="group block"
          >
            <p className="font-semibold text-[#0d9488] group-hover:underline">{r.courseLabel}</p>
            <p className="text-[11px] text-slate-500">Open course workspace</p>
          </Link>
        ) : (
          <span className="text-slate-700">{r.courseLabel}</span>
        ),
    },
    {
      key: 'status',
      sortKey: 'status',
      label: 'Status',
      sortable: true,
      cell: (r) => statusBadge(r.status || r.paymentStatus),
    },
    {
      key: 'registeredOn',
      sortKey: 'registeredOn',
      label: 'Registered',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-slate-700">{r.registeredOn || '—'}</span>,
    },
  ]

  const columns = variant === 'profiles' ? profileCols : registrationCols
  const detailEntries =
    detailProfile || detailRegistration
      ? Object.entries((detailProfile ?? detailRegistration)!.raw)
          .filter(([k]) => !k.startsWith('_') && k !== 'password')
          .sort(([a], [b]) => a.localeCompare(b))
      : []

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50/50 text-xs font-bold uppercase tracking-wide text-slate-500">
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                    {col.sortable && col.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey!)}
                        className="inline-flex items-center hover:text-slate-800"
                      >
                        {col.label}
                        <SortIcon active={sortKey === col.sortKey} dir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="animate-pulse">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3.5">
                          <div className="h-4 rounded-md bg-slate-100" />
                        </td>
                      ))}
                      <td className="px-4 py-3.5">
                        <div className="ml-auto h-8 w-16 rounded-md bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : variant === 'profiles'
                  ? pageProfiles.map((r) => (
                      <tr
                        key={r.rowKey}
                        className="cursor-pointer transition hover:bg-teal-50/40"
                        onClick={() => setDetailProfile(r)}
                      >
                        {profileCols.map((col) => (
                          <td key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                            {col.cell(r)}
                          </td>
                        ))}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailProfile(r)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-[#0d9488]/30 hover:text-[#0d9488]"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  : pageRegistrations.map((r) => (
                      <tr
                        key={r.rowKey}
                        className="cursor-pointer transition hover:bg-indigo-50/40"
                        onClick={() => setDetailRegistration(r)}
                      >
                        {registrationCols.map((col) => (
                          <td key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                            {col.cell(r)}
                          </td>
                        ))}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailRegistration(r)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-[#0d9488]/30 hover:text-[#0d9488]"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {!loading && !sorted.length && (
          <div className="px-6 py-16 text-center">
            {variant === 'profiles' ? (
              <User className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
            ) : (
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
            )}
            <p className="text-base font-semibold text-slate-800">No students in this view</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{emptyMessage}</p>
          </div>
        )}

        {sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of{' '}
              <span className="font-semibold text-slate-900">{sorted.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Prev
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {(detailProfile || detailRegistration) && (
        <div className="fixed inset-0 z-[280]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => {
              setDetailProfile(null)
              setDetailRegistration(null)
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#0d9488]">
                    {detailProfile ? 'Student profile' : 'Course registration'}
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">
                    {detailProfile?.fullName ?? detailRegistration?.studentName}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {detailProfile?.email ?? detailRegistration?.email ?? '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDetailProfile(null)
                    setDetailRegistration(null)
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {detailProfile ? (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['Email', detailProfile.email],
                      ['Phone', detailProfile.phone],
                      ['Date of birth', detailProfile.dob],
                      ['Age', detailProfile.age ? `${detailProfile.age} years` : ''],
                      ['City', detailProfile.city],
                      ['State / region', detailProfile.stateRegion],
                      ...(detailProfile.addressLine ? [['Address', detailProfile.addressLine] as const] : []),
                      ['Portal user id', detailProfile.userId],
                      ['Profile date', detailProfile.createdOn],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                        <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : detailRegistration ? (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['Email', detailRegistration.email],
                      ['Phone', detailRegistration.phone],
                      ['Course', detailRegistration.courseLabel],
                      ['Status', detailRegistration.status || detailRegistration.paymentStatus],
                      ['Registered', detailRegistration.registeredOn],
                      ['Attendees', detailRegistration.attendeeCount],
                      ['User id', detailRegistration.userId],
                      ...(detailRegistration.courseId
                        ? [
                            [
                              'Course workspace',
                              <Link
                                key="cw"
                                href={`/portal/admin/courses/${encodeURIComponent(detailRegistration.courseId)}`}
                                className="font-semibold text-[#0d9488] hover:underline"
                              >
                                Open course
                              </Link>,
                            ] as const,
                          ]
                        : []),
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                        <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500">
                    All stored fields
                  </summary>
                  <dl className="mt-2 grid gap-2 text-xs">
                    {detailEntries.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[minmax(0,140px)_1fr] gap-2 border-b border-slate-50 pb-2">
                        <dt className="font-mono text-slate-500">{k}</dt>
                        <dd className="break-all text-slate-800">
                          {v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
              {(detailProfile?.email || detailRegistration?.email) && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      openEmail(
                        detailProfile?.fullName ?? detailRegistration!.studentName,
                        detailProfile?.email ?? detailRegistration!.email,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    Send email
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {emailModal && (
        <div className="fixed inset-0 z-[290]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close send email"
            onClick={() => setEmailModal(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">Send email</h2>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{emailModal.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="grid gap-3 text-sm">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">To</span>
                    <input
                      type="email"
                      value={emailModal.to}
                      onChange={(e) => setEmailModal({ ...emailModal, to: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Subject</span>
                    <input
                      type="text"
                      value={emailModal.subject}
                      onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Body</span>
                    <textarea
                      rows={8}
                      value={emailModal.body}
                      onChange={(e) => setEmailModal({ ...emailModal, body: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </label>
                  {emailMsg ? (
                    <p
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        emailMsg.toLowerCase().includes('sent')
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      {emailMsg}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setEmailModal(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                  disabled={emailSending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void sendEmail()}
                  className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  disabled={emailSending}
                >
                  {emailSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
