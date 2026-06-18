import SiteMain from '@/components/site/SiteMain'
import { fetchUpcomingCourses } from '@/lib/api'
import ScheduleClient from './ScheduleClient'

export default async function ScheduleData() {
  const courses = await fetchUpcomingCourses()
  return (
    <SiteMain>
      <ScheduleClient initialCourses={courses} />
    </SiteMain>
  )
}
