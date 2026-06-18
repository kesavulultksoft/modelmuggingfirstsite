import type { NavGroup } from '@/components/portal/portalNavGroups'

/** Paths only for fully converted CRM instructors (not applicants / pipeline). */
export const INSTRUCTOR_OPERATIONS_PATH_PREFIXES = [
  '/portal/instructor/trainings',
  '/portal/instructor/vacancies',
  '/portal/instructor/expenses',
  '/portal/instructor/transactions',
  '/portal/instructor/equipment',
  '/portal/instructor/calendar',
  '/portal/instructor/email',
  '/portal/instructor/email-history',
  '/portal/instructor/certificates',
  '/portal/instructor/documents',
  '/portal/instructor/courses',
] as const

export function isInstructorOperationsPath(pathname: string | null): boolean {
  if (!pathname?.startsWith('/portal/instructor')) return false
  return INSTRUCTOR_OPERATIONS_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Applicant onboarding forms — read-only after admin converts to active instructor (legacy status Completed). */
export const INSTRUCTOR_ONBOARDING_FORM_PATH_PREFIXES = [
  '/portal/instructor/onboarding-history',
  '/portal/instructor/contact',
  '/portal/instructor/verification',
  '/portal/instructor/physical-verification',
  '/portal/instructor/travel',
  '/portal/instructor/measurements',
  '/portal/instructor/t-shirt',
  '/portal/instructor/basic-course',
  '/portal/instructor/expense-pool',
  '/portal/instructor/trainer-application',
] as const

export function isInstructorOnboardingFormPath(pathname: string | null): boolean {
  if (!pathname?.startsWith('/portal/instructor')) return false
  return INSTRUCTOR_ONBOARDING_FORM_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

const APPLICANT_HIDDEN_NAV_TITLES = new Set(['Active work', 'Documents'])

export function filterInstructorNavGroupsForApplicant(groups: NavGroup[]): NavGroup[] {
  return groups.filter((g) => !APPLICANT_HIDDEN_NAV_TITLES.has(g.title))
}
