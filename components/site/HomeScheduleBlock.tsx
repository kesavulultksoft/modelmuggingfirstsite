import { fetchUpcomingCourses } from '@/lib/api'
import HomeSchedulePreview from '@/components/site/HomeSchedulePreview'

export default async function HomeScheduleBlock({ embedded = false }: { embedded?: boolean } = {}) {
  const courses = await fetchUpcomingCourses()
  return <HomeSchedulePreview courses={courses} embedded={embedded} />
}
