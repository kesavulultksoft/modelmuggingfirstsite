import type { Metadata } from 'next'
import { Suspense } from 'react'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import ScheduleSkeleton from '@/components/site/ScheduleSkeleton'
import ScheduleData from './ScheduleData'

export const metadata: Metadata = {
  title: 'Class schedule',
  description:
    'Browse upcoming Model Mugging self-defense courses. Filter by location — weekend basics, teens, advanced, retreats.',
  openGraph: { title: 'Find a Model Mugging class' },
}

export default function SchedulePage() {
  return (
    <div className="min-h-[60vh]">
      <PageHero
        eyebrow="Schedule"
        title="Find a class"
        maxWidth="7xl"
        subtitle="Filter by city. Every card links to full details, tuition, and registration."
      />
      <Suspense
        fallback={
          <SiteMain>
            <ScheduleSkeleton />
          </SiteMain>
        }
      >
        <ScheduleData />
      </Suspense>
    </div>
  )
}
