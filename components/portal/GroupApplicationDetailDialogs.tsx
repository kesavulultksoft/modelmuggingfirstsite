'use client'

import type { GroupAppRow } from '@/lib/portalGroupApplicationsApi'
import { geoDisplayField } from '@/lib/groupCourseGeoDisplay'

function val(row: GroupAppRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return '—'
}

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-US')
}

function formatParticipantGender(v: unknown): string {
  const s = String(v ?? '').trim().toUpperCase()
  if (s === 'M' || s === 'MALE') return 'Male (M)'
  if (s === 'F' || s === 'FEMALE') return 'Female (F)'
  if (s === 'D') return 'Definite (legacy)'
  if (s === 'MAYBE') return 'Maybe (legacy)'
  return s || '—'
}

function yesNoAnswer(v: unknown): string {
  const s = String(v ?? '').trim()
  if (!s || s.toLowerCase() === 'null') return 'No'
  return s
}

function preGroupStatus(row: GroupAppRow): string {
  const raw = String(row.requestStatus || '').trim()
  return raw || 'Pending'
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">{title}</h4>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Qualified'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'NotQualified'
        ? 'bg-red-100 text-red-800'
        : 'bg-slate-100 text-slate-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{status}</span>
}

type PreGroupDialogProps = {
  row: GroupAppRow
  rowId: string
  busy: string | null
  geoLabels: Record<string, string>
  onClose: () => void
  onAct: (id: string, type: 'qualified' | 'not-qualified' | 'resend') => void
  onDelete: () => void
}

export function PreGroupApplicationDetailDialog({
  row,
  rowId,
  busy,
  geoLabels,
  onClose,
  onAct,
  onDelete,
}: PreGroupDialogProps) {
  const status = preGroupStatus(row)
  const isPending = !String(row.requestStatus || '').trim() || status.toLowerCase() === 'pending'
  const orgName = val(row, 'organizationName', 'firstName') !== '—'
    ? val(row, 'organizationName')
    : `${val(row, 'firstName')} ${val(row, 'lastName')}`.trim() || '—'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-black/50 p-0 sm:p-4">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Group course application request</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              Status: <StatusBadge status={status} />
            </p>
          </div>
          <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DetailSection title="Organization details">
            <DetailField label="Name" value={orgName} />
            <DetailField label="Email" value={val(row, 'orgEmail', 'email')} />
            <DetailField label="Group / affiliation" value={val(row, 'groupAffiliation', 'groupOrAffiliation')} />
            <DetailField label="City" value={val(row, 'city')} />
            <DetailField
              label="State"
              value={geoDisplayField(row, geoLabels, ['stateName'], ['state'])}
            />
            <DetailField
              label="Country"
              value={geoDisplayField(row, geoLabels, ['countryName'], ['country'])}
            />
            <DetailField label="Created on" value={formatDate(row.createdDate)} />
            <DetailField label="Head count" value={val(row, 'headCount')} />
          </DetailSection>

          <DetailSection title="Co-organization details">
            <DetailField label="Name" value={val(row, 'coOrganizerName')} />
            <DetailField label="Email" value={val(row, 'coOrgEmail')} />
            <DetailField label="Group / affiliation" value={val(row, 'coOrgGroupOrAffiliation')} />
            <DetailField label="City" value={val(row, 'coOrgCity')} />
            <DetailField
              label="State"
              value={geoDisplayField(row, geoLabels, ['coOrgStateName'], ['coOrgState'])}
            />
            <DetailField
              label="Country"
              value={geoDisplayField(row, geoLabels, ['coOrgCountryName'], ['coOrgCountry'])}
            />
            <DetailField label="Phone" value={val(row, 'coOrgPhone')} />
          </DetailSection>

          <section className="mt-6">
            <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">Qualifying questions</h4>
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-800">
                  Q1. I am reaching out on behalf of a group of 10–15 people who intend on taking class?
                </p>
                <p className="mt-1 text-slate-700">{yesNoAnswer(row.question1)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  Q2. I have a teaching location with padded flooring where I would like my class to be held?
                </p>
                <p className="mt-1 text-slate-700">{yesNoAnswer(row.question2)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  Q3. My group is fully committed to training and is willing to pay tuition (group discounts may apply)?
                </p>
                <p className="mt-1 text-slate-700">{yesNoAnswer(row.question3)}</p>
              </div>
            </div>
          </section>

          {row.qualifiedBy ? (
            <p className="mt-4 text-xs text-slate-500">Reviewed by: {String(row.qualifiedBy)}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={onClose}
          >
            Close
          </button>
          {isPending ? (
            <>
              <button
                type="button"
                disabled={busy !== null}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => onAct(rowId, 'qualified')}
              >
                Approve (Qualified)
              </button>
              <button
                type="button"
                disabled={busy !== null}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                onClick={() => onAct(rowId, 'not-qualified')}
              >
                Reject (Not qualified)
              </button>
            </>
          ) : status === 'Qualified' ? (
            <button
              type="button"
              disabled={busy !== null}
              className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-bold text-indigo-700 disabled:opacity-50"
              onClick={() => onAct(rowId, 'resend')}
            >
              Send link
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy !== null}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

type FullDialogProps = {
  application: GroupAppRow
  students: GroupAppRow[]
  geoLabels: Record<string, string>
  onClose: () => void
}

export function FullGroupApplicationDetailDialog({
  application,
  students,
  geoLabels,
  onClose,
}: FullDialogProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-black/50 p-0 sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Group course application</h3>
            <p className="mt-1 text-sm text-slate-600">Submitted full application (legacy GroupCourse)</p>
          </div>
          <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DetailSection title="Organizer">
            <DetailField label="Name" value={val(application, 'name')} />
            <DetailField label="Email" value={val(application, 'email')} />
            <DetailField label="Phone" value={val(application, 'phoneNumber')} />
            <DetailField label="Group / affiliation" value={val(application, 'groupOrAffiliation')} />
            <DetailField label="City" value={val(application, 'city')} />
            <DetailField
              label="State"
              value={geoDisplayField(application, geoLabels, ['stateName'], ['state'])}
            />
            <DetailField
              label="Country"
              value={geoDisplayField(application, geoLabels, ['countryName'], ['country'])}
            />
            <DetailField
              label="Location"
              value={geoDisplayField(application, geoLabels, ['locationName'], ['location'])}
            />
            <DetailField label="Course type" value={val(application, 'selectedCourse')} />
            <DetailField label="Submitted" value={formatDate(application.createdDate)} />
          </DetailSection>

          <DetailSection title="Co-organizer">
            <DetailField label="Name" value={val(application, 'coOrganizerName')} />
            <DetailField label="Email" value={val(application, 'coOrgEmail')} />
            <DetailField label="Phone" value={val(application, 'coOrgPhone')} />
            <DetailField label="City" value={val(application, 'coOrgcity', 'coOrgCity')} />
          </DetailSection>

          <DetailSection title="Venue & facility">
            <DetailField label="Location name" value={val(application, 'locallocationName', 'locationName')} />
            <DetailField label="Address" value={val(application, 'locationAddress', 'address')} />
            <DetailField label="Floor size" value={val(application, 'floorSize')} />
            <DetailField label="Safety surface" value={val(application, 'safetySurface')} />
            <DetailField label="Mats" value={val(application, 'mats')} />
            <DetailField label="Parking" value={val(application, 'parking')} />
            <DetailField label="Notes" value={val(application, 'usToKnow', 'otherFacility')} />
          </DetailSection>

          <section className="mt-6">
            <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">
              Participants ({students.length})
            </h4>
            {students.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No participant rows recorded.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Gender</th>
                      <th className="p-2">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2">{val(s, 'participantName')}</td>
                        <td className="p-2">{val(s, 'participantEmail')}</td>
                        <td className="p-2">{val(s, 'participantPhone')}</td>
                        <td className="p-2">{formatParticipantGender(s.dm)}</td>
                        <td className="p-2">{val(s, 'teenAge')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
