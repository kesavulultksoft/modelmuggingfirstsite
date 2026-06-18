'use client'

import Link from 'next/link'
import InstructorProfilePanel from '@/components/portal/InstructorProfilePanel'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function OnboardingContactInformationPage() {
  return (
    <>
      <PortalPageHeader
        title="Contact information"
        subtitle={
          <span>
            Update your profile and mailing address for this onboarding step. For additional contact and tax fields, use{' '}
            <Link href="/portal/instructor/account-workspace" className="font-semibold text-[#0d9488] hover:underline">
              Account workspace
            </Link>
            . Return to{' '}
            <Link href="/portal/instructor/onboarding-history" className="font-semibold text-[#0d9488] hover:underline">
              Onboarding history
            </Link>{' '}
            when you are done.
          </span>
        }
      />
      <InstructorProfilePanel surfaceId="onboarding-contact" loginNextPath="/portal/instructor/onboarding-history/contact" />
    </>
  )
}
