/**
 * Full navigation parity with legacy Angular apps (adminApp, instructorApp, studentApp).
 * All authenticated workflows route through the Next.js portal.
 */

export type NavLink = { href: string; label: string }

export type NavGroup = { title: string; links: NavLink[] }

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    links: [
      { href: '/portal/admin', label: 'Overview' },
      { href: '/portal/admin/reports', label: 'Reports & exports' },
    ],
  },
  {
    title: 'Courses & events',
    links: [
      { href: '/portal/admin/courses', label: 'Course management' },
      { href: '/portal/admin/events', label: 'Pre-instructor events & fees' },
    ],
  },
  {
    title: 'People',
    links: [
      { href: '/portal/admin/students', label: 'Students' },
      { href: '/portal/admin/instructors', label: 'Instructors' },
      { href: '/portal/admin/trainer-pipeline', label: 'Applicant pipeline' },
      { href: '/portal/admin/trainer-applications', label: 'Portal trainer applications' },
      { href: '/portal/admin/bg-verification', label: 'BG verification' },
      { href: '/portal/admin/contractors', label: 'BG investigators' },
      { href: '/portal/admin/users', label: 'Portal users' },
    ],
  },
  {
    title: 'Money & expenses',
    links: [
      { href: '/portal/admin/transactions', label: 'Transactions' },
      { href: '/portal/admin/accounts', label: 'Class expenses' },
      { href: '/portal/admin/expense-types', label: 'Expense types' },
      { href: '/portal/admin/tshirt-orders', label: 'T-shirt orders' },
      { href: '/portal/admin/tshirt-prices', label: 'T-shirt & polo pricing' },
    ],
  },
  {
    title: 'CRM & comms',
    links: [
      { href: '/portal/admin/subscribers', label: 'Subscribers & parents' },
      { href: '/portal/admin/group-applications', label: 'Group applications' },
      { href: '/portal/admin/interview-questions', label: 'Interview Questions' },
      { href: '/portal/admin/email-center', label: 'Email management' },
      { href: '/portal/admin/email-history', label: 'Email history' },
    ],
  },
  {
    title: 'Content & library',
    links: [
      { href: '/portal/admin/library-docs', label: 'Library & documents' },
      { href: '/portal/admin/liability-docs', label: 'Liability & health (admin)' },
      { href: '/portal/admin/testimonials', label: 'Testimonials' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { href: '/portal/admin/equipment-center', label: 'Equipment' },
      { href: '/portal/admin/operations', label: 'Regions & donations' },
    ],
  },
]

export const INSTRUCTOR_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Home',
    links: [
      { href: '/portal/instructor', label: 'Dashboard' },
      { href: '/portal/instructor/cart', label: 'Cart' },
    ],
  },
  {
    title: 'Active work',
    links: [
      { href: '/portal/instructor/trainings', label: 'Course management' },
      { href: '/portal/instructor/vacancies', label: 'Vacancy courses' },
      { href: '/portal/instructor/expenses', label: 'Expenses' },
      { href: '/portal/instructor/transactions', label: 'Transactions' },
      { href: '/portal/instructor/interviews', label: 'Interview candidates' },
      { href: '/portal/instructor/equipment', label: 'Equipment requests' },
      { href: '/portal/instructor/calendar', label: 'Calendar' },
      { href: '/portal/instructor/email', label: 'Email & mass mail' },
      { href: '/portal/instructor/email-history', label: 'Email history' },
      { href: '/portal/instructor/certificates', label: 'Certificates' },
    ],
  },
  {
    title: 'Profile & account',
    links: [
      { href: '/portal/instructor/trainer-application', label: 'Trainer application' },
      { href: '/portal/instructor/account-workspace', label: 'Account workspace' },
    ],
  },
  {
    title: 'Documents',
    links: [
      { href: '/portal/instructor/documents?tab=overview', label: 'Forms overview' },
      { href: '/portal/instructor/documents?tab=training', label: 'Training documents' },
      { href: '/portal/instructor/documents?tab=general', label: 'General documents' },
      { href: '/portal/instructor/documents?tab=application', label: 'Application documents' },
      { href: '/portal/instructor/documents?tab=library', label: 'Library' },
      { href: '/portal/instructor/documents?tab=presentation', label: 'Presentations' },
      { href: '/portal/instructor/documents?tab=marketing', label: 'Marketing material' },
      { href: '/portal/instructor/documents?tab=liability', label: 'Liability & health' },
    ],
  },
  {
    title: 'Onboarding history (reference)',
    links: [
      { href: '/portal/instructor/onboarding-history', label: 'Onboarding timeline' },
      { href: '/portal/instructor/verification', label: 'Background verification' },
      { href: '/portal/instructor/physical-verification', label: 'Physical verification' },
      { href: '/portal/instructor/measurements', label: 'Equipment sizes' },
      { href: '/portal/instructor/travel', label: 'Travel info' },
      { href: '/portal/instructor/t-shirt', label: 'T-shirt & dress' },
      { href: '/portal/instructor/basic-course', label: 'Basic instructor course' },
      { href: '/portal/instructor/expense-pool', label: 'Expense pool' },
    ],
  },
]

export const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Home',
    links: [
      { href: '/portal/student', label: 'Dashboard' },
      { href: '/portal/student/courses', label: 'My classes' },
      { href: '/portal/student/history', label: 'Courses attended' },
      { href: '/portal/student/certificates', label: 'Certificates' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/portal/student/profile', label: 'Profile' },
      { href: '/portal/student/transactions', label: 'Transactions' },
      { href: '/portal/student/documents', label: 'Forms & prep' },
      { href: '/portal/student/pre-class', label: 'Pre-class instructions' },
      { href: '/portal/student/liability', label: 'Liability & health' },
      { href: '/portal/student/calendar', label: 'Calendar' },
      { href: '/portal/student/inbox', label: 'Inbox' },
    ],
  },
]

export function flattenNavGroups(groups: NavGroup[]): NavLink[] {
  const seen = new Set<string>()
  const out: NavLink[] = []
  for (const g of groups) {
    for (const l of g.links) {
      if (!seen.has(l.href)) {
        seen.add(l.href)
        out.push(l)
      }
    }
  }
  return out
}
