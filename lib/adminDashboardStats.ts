import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import {
  fetchAdminBackgroundVerifications,
  fetchAdminCrmSubscriptions,
  fetchAdminCrmTable,
  fetchAdminEmailHistory,
  fetchAdminInterviewCandidates,
  fetchAdminReportSummary,
  fetchAdminTrainerApplicants,
  fetchAdminTrainerPortalApplications,
  fetchAdminTransactionsAll,
  fetchAdminUsers,
  fetchEquipPending,
  fetchPendingExpenses,
} from '@/lib/portalApi'

export type AdminDashboardCounts = {
  courses: number | null
  students: number | null
  instructors: number | null
  portalEnrollments: number | null
  registrations: number | null
  portalUsers: number | null
  transactions: number | null
  subscriptions: number | null
  groupApplications: number | null
  donations: number | null
  pendingClassExpenses: number | null
  pendingInstructorReceipts: number | null
  pendingBackgroundChecks: number | null
  trainerApplicants: number | null
  trainerPortalApplications: number | null
  interviewCandidates: number | null
  contractors: number | null
  equipmentPending: number | null
  events: number | null
  emailHistory: number | null
}

export type AdminDashboardSnapshot = {
  counts: AdminDashboardCounts
  summary: Record<string, unknown> | null
  generatedAt: string | null
}

function countRows(data: unknown): number {
  return legacyAsObjectArray(data).length
}

function summaryCount(summary: Record<string, unknown> | null, key: string): number | null {
  if (!summary) return null
  const v = summary[key]
  if (typeof v === 'number' && !Number.isNaN(v) && v >= 0) return v
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10)
  return null
}

/** Load all dashboard metrics in parallel (summary API + lightweight list counts). */
export async function loadAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [
    summary,
    users,
    transactions,
    subscriptions,
    groupCourseApps,
    preGroupApps,
    applicants,
    trainerPortalApps,
    interviews,
    contractors,
    equipPending,
    pendingExpenses,
    bgPending,
    events,
    emailHistory,
  ] = await Promise.all([
    fetchAdminReportSummary().catch(() => null),
    fetchAdminUsers().catch(() => []),
    fetchAdminTransactionsAll().catch(() => []),
    fetchAdminCrmSubscriptions().catch(() => []),
    fetchAdminCrmTable('group-course-applications').catch(() => []),
    fetchAdminCrmTable('pre-group-applications').catch(() => []),
    fetchAdminTrainerApplicants(false).catch(() => []),
    fetchAdminTrainerPortalApplications().catch(() => []),
    fetchAdminInterviewCandidates().catch(() => []),
    fetchAdminCrmTable('bg-agents').catch(() => []),
    fetchEquipPending().catch(() => []),
    fetchPendingExpenses().catch(() => []),
    fetchAdminBackgroundVerifications('pending').catch(() => []),
    fetchAdminCrmTable('events').catch(() => []),
    fetchAdminEmailHistory().catch(() => []),
  ])

  const s = summary && typeof summary === 'object' ? summary : null
  const pendingPortal = summaryCount(s, 'pendingPortalExpenses')
  const pendingReceipts = summaryCount(s, 'pendingInstructorExpenseDocs')
  const pendingClassExpenses =
    pendingPortal != null || pendingReceipts != null
      ? (pendingPortal ?? 0) + (pendingReceipts ?? 0)
      : countRows(pendingExpenses)

  const generatedRaw = s?.generatedAt
  const generatedAt =
    generatedRaw == null
      ? null
      : generatedRaw instanceof Date
        ? generatedRaw.toISOString()
        : String(generatedRaw)

  return {
    summary: s,
    generatedAt,
    counts: {
      courses: summaryCount(s, 'courses'),
      students: summaryCount(s, 'students'),
      instructors: summaryCount(s, 'instructors'),
      portalEnrollments: summaryCount(s, 'portalEnrollments'),
      registrations: summaryCount(s, 'studentCourseRegistrations'),
      portalUsers: countRows(users),
      transactions: countRows(transactions),
      subscriptions: countRows(subscriptions),
      groupApplications: countRows(groupCourseApps) + countRows(preGroupApps),
      donations: summaryCount(s, 'donationsCount'),
      pendingClassExpenses,
      pendingInstructorReceipts: pendingReceipts ?? null,
      pendingBackgroundChecks:
        summaryCount(s, 'pendingBackgroundVerification') ?? countRows(bgPending),
      trainerApplicants: countRows(applicants),
      trainerPortalApplications: countRows(trainerPortalApps),
      interviewCandidates: countRows(interviews),
      contractors: countRows(contractors),
      equipmentPending: countRows(equipPending),
      events: countRows(events),
      emailHistory: countRows(emailHistory),
    },
  }
}
