import InstructorApplicantRouteGuard from '@/components/portal/InstructorApplicantRouteGuard'

export default function InstructorPortalSectionLayout({ children }: { children: React.ReactNode }) {
  return <InstructorApplicantRouteGuard>{children}</InstructorApplicantRouteGuard>
}
