'use client'

import { X } from 'lucide-react'
import { formatInstructorGenderDisplay } from '@/lib/gender'
import { formatUsPhoneDisplay } from '@/lib/phoneUs'

type Row = Record<string, unknown>

function formatDateTime(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function field(label: string, value: unknown) {
  const text =
    value == null || value === ''
      ? '—'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">{text}</dd>
    </div>
  )
}

export default function AdminInstructorDetailModal({
  row,
  loading,
  onClose,
}: {
  row: Row | null
  loading?: boolean
  onClose: () => void
}) {
  if (!row && !loading) return null

  const fn = String(row?.firstName ?? '').trim()
  const ln = String(row?.lastName ?? '').trim()
  const title = `${fn} ${ln}`.trim() || String(row?.fullName ?? 'Instructor')

  const phone = formatUsPhoneDisplay(
    row?.contactPhoneSnapshot ?? row?.contactNumber ?? row?.phone ?? row?.alternatePhoneNumber
  )

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructor-detail-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="instructor-detail-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="text-sm text-slate-600">Instructor profile</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Loading details…</p>
        ) : row ? (
          <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            {field('Email', row.emailId)}
            {field('Phone', phone || row.phone)}
            {field('Gender', formatInstructorGenderDisplay(row.gender))}
            {field('Status', row.status)}
            {field('Location', row.locationName)}
            {field('City', row.city)}
            {field('State', row.state)}
            {field('Country', row.country)}
            {field('Converted', formatDateTime(row.becameInstructorDate ?? row.applicationApprovedDate))}
            {field('Application approved', formatDateTime(row.applicationApprovedDate))}
            {field('User ID', row.userId)}
            {field('Archived', row.isArchieve ?? row.isArchive)}
            {field('Contact submitted', formatDateTime(row.contactInfoSubmittedDate))}
            {field('Background status', row.backgroundStatus ?? row.bgStatus)}
            {field('Physical status', row.physicalStatus)}
            {field('Equipment status', row.equipmentStatus)}
            {field('Travel status', row.travelStatus)}
            {field('Expense pool status', row.expensePoolStatus)}
            {field('T-shirt status', row.tshirtStatus)}
            {field('Interview status', row.interviewStatus)}
            {field('Application status', row.applicationStatus)}
            {field('Notes', row.notes ?? row.adminNotes)}
          </dl>
        ) : null}

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
