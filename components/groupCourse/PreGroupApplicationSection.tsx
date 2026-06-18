'use client'

import GroupApplicationProcessSteps from '@/components/groupCourse/GroupApplicationProcessSteps'
import PreGroupApplicationForm from '@/components/groupCourse/PreGroupApplicationForm'

type Props = {
  /** Anchor id for in-page links from hosting / training pages */
  anchorId?: string
  showProcessSteps?: boolean
}

export default function PreGroupApplicationSection({
  anchorId = 'group-application-request',
  showProcessSteps = true,
}: Props) {
  return (
    <div id={anchorId} className="scroll-mt-24 space-y-8">
      {showProcessSteps ? <GroupApplicationProcessSteps /> : null}
      <PreGroupApplicationForm />
    </div>
  )
}
