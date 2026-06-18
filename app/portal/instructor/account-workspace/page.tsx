'use client'

import InstructorAccountWorkspacePanel from '@/components/portal/InstructorAccountWorkspacePanel'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

export default function InstructorAccountWorkspacePage() {
  return (
    <>
      <PortalPageHeader
        title="Account workspace"
        subtitle="Manage profile, contact, and tax information in one place."
      />
      <InstructorAccountWorkspacePanel />
    </>
  )
}
