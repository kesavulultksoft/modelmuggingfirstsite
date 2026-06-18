import { courseIdFromRow, filterInstructorUpcomingCourses } from '@/lib/coursePortalDisplay'
import { legacyAsObjectArray, legacyAsRecord } from '@/lib/legacyHelpers'
import {
  fetchInstructorBackgroundVerification,
  fetchInstructorCourseRegistrationCounts,
  fetchInstructorCourses,
  fetchInstructorCrmProfile,
  fetchInstructorCrmView,
  fetchInstructorDocumentLists,
  fetchInstructorEmailHistory,
  fetchInstructorExpensePool,
  fetchInstructorExpenses,
  fetchInstructorPhysicalVerification,
  fetchInstructorTravelInfo,
  fetchInstructorVacancyCourses,
} from '@/lib/portalApi'

export type InstructorDashboardCounts = {
  assignedCourses: number | null
  vacancyCourses: number | null
  openExpenses: number | null
  transactions: number | null
  interviews: number | null
  equipmentRequests: number | null
  cartItems: number | null
  emailHistory: number | null
  certifications: number | null
  events: number | null
  documentFiles: number | null
  rosterSeats: number | null
}

export type InstructorOnboardingSnapshot = {
  profile: Record<string, unknown>
  background: Record<string, unknown>
  physical: Record<string, unknown>
  travel: Record<string, unknown>
  expensePool: Record<string, unknown>
  progressPercent: number
}

export type InstructorDashboardSnapshot = {
  counts: InstructorDashboardCounts
  courses: Record<string, unknown>[]
  onboarding: InstructorOnboardingSnapshot
}

function countRows(data: unknown): number {
  return legacyAsObjectArray(data).length
}

function isGoodStatus(v: unknown): boolean {
  return /approved|successful|completed|done|submitted|verified/i.test(String(v ?? ''))
}

function onboardingProgress(
  profile: Record<string, unknown>,
  bg: Record<string, unknown>,
  physical: Record<string, unknown>,
  travel: Record<string, unknown>,
  expensePool: Record<string, unknown>,
): number {
  const checks = [
    isGoodStatus(profile.basicCourseStatus),
    isGoodStatus(profile.tShirtStatus ?? profile.tshirtStatus),
    isGoodStatus(bg.status ?? bg.bgVerificationStatus),
    isGoodStatus(physical.status ?? profile.physicalVerificationStatus),
    isGoodStatus(travel.status ?? profile.travelInfoStatus),
    isGoodStatus(expensePool.status ?? profile.expensePoolStatus),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function openExpenseCount(rows: Record<string, unknown>[]): number {
  return rows.filter((e) => !/paid|admin_rejected/i.test(String(e.status ?? ''))).length
}

function sumRegistrationCounts(raw: Record<string, number>, activeCourseIds?: Set<string>): number {
  let n = 0
  for (const [key, v] of Object.entries(raw)) {
    if (activeCourseIds && !activeCourseIds.has(key)) continue
    if (typeof v === 'number' && Number.isFinite(v)) n += v
  }
  return n
}

/** Load instructor dashboard metrics (full ops bundle only when user is an active instructor). */
export async function loadInstructorDashboardSnapshot(
  includeOperations: boolean,
): Promise<InstructorDashboardSnapshot> {
  const [profileRaw, bgRaw, physicalRaw, travelRaw, poolRaw] = await Promise.all([
    fetchInstructorCrmProfile().catch(() => ({})),
    fetchInstructorBackgroundVerification().catch(() => ({})),
    fetchInstructorPhysicalVerification().catch(() => ({})),
    fetchInstructorTravelInfo().catch(() => ({})),
    fetchInstructorExpensePool().catch(() => ({})),
  ])

  const profile = legacyAsRecord(profileRaw) ?? {}
  const background = legacyAsRecord(bgRaw) ?? {}
  const physical = legacyAsRecord(physicalRaw) ?? {}
  const travel = legacyAsRecord(travelRaw) ?? {}
  const expensePool = legacyAsRecord(poolRaw) ?? {}

  const onboarding: InstructorOnboardingSnapshot = {
    profile,
    background,
    physical,
    travel,
    expensePool,
    progressPercent: onboardingProgress(profile, background, physical, travel, expensePool),
  }

  const emptyCounts: InstructorDashboardCounts = {
    assignedCourses: null,
    vacancyCourses: null,
    openExpenses: null,
    transactions: null,
    interviews: null,
    equipmentRequests: null,
    cartItems: null,
    emailHistory: null,
    certifications: null,
    events: null,
    documentFiles: null,
    rosterSeats: null,
  }

  if (!includeOperations) {
    return { counts: emptyCounts, courses: [], onboarding }
  }

  const [
    coursesRaw,
    vacanciesRaw,
    expensesRaw,
    transactionsRaw,
    interviewsRaw,
    equipmentRaw,
    cartRaw,
    emailHistoryRaw,
    certificationsRaw,
    eventsRaw,
    docListsRaw,
    regCountsRaw,
  ] = await Promise.all([
    fetchInstructorCourses().catch(() => []),
    fetchInstructorVacancyCourses().catch(() => []),
    fetchInstructorExpenses().catch(() => []),
    fetchInstructorCrmView('transactions').catch(() => []),
    fetchInstructorCrmView('interviews').catch(() => []),
    fetchInstructorCrmView('equipment-approval').catch(() => []),
    fetchInstructorCrmView('cart').catch(() => []),
    fetchInstructorEmailHistory().catch(() => []),
    fetchInstructorCrmView('certifications').catch(() => []),
    fetchInstructorCrmView('events').catch(() => []),
    fetchInstructorDocumentLists().catch(() => ({})),
    fetchInstructorCourseRegistrationCounts().catch(() => ({})),
  ])

  const courses = legacyAsObjectArray(coursesRaw)
  const activeCourses = filterInstructorUpcomingCourses(courses)
  const activeCourseIds = new Set(
    activeCourses.map((c, i) => courseIdFromRow(c, i)).filter(Boolean),
  )
  const expenses = legacyAsObjectArray(expensesRaw)

  let documentFiles = 0
  if (docListsRaw && typeof docListsRaw === 'object' && !Array.isArray(docListsRaw)) {
    for (const v of Object.values(docListsRaw as Record<string, unknown>)) {
      documentFiles += countRows(v)
    }
  }

  return {
    courses: activeCourses,
    onboarding,
    counts: {
      assignedCourses: activeCourses.length,
      vacancyCourses: countRows(vacanciesRaw),
      openExpenses: openExpenseCount(expenses),
      transactions: countRows(transactionsRaw),
      interviews: countRows(interviewsRaw),
      equipmentRequests: countRows(equipmentRaw),
      cartItems: countRows(cartRaw),
      emailHistory: countRows(emailHistoryRaw),
      certifications: countRows(certificationsRaw),
      events: countRows(eventsRaw),
      documentFiles,
      rosterSeats: sumRegistrationCounts(regCountsRaw, activeCourseIds),
    },
  }
}
