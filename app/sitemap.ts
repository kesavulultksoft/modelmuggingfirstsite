import type { MetadataRoute } from 'next'
import { fetchUpcomingCourses } from '@/lib/api'
import { allMigratedPaths } from '@/lib/migratedSitePages'
import { fetchAllCmsRoutePaths } from '@/lib/sanity/queries'

function dedupeSitemapByUrl(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  return entries.filter((e) => {
    if (seen.has(e.url)) return false
    seen.add(e.url)
    return true
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/schedule',
    '/training',
    '/about',
    '/locations',
    '/trainers',
    '/contact',
    '/register',
    '/login',
    '/terms',
    '/privacy',
    '/faq',
    '/group-course-application',
    '/donate-to-empowerment',
    '/donate-to-empowerment/card-payment',
    '/apply/trainer',
    '/basic-self-defense-class-for-women',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/schedule' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))

  const migrated: MetadataRoute.Sitemap = allMigratedPaths().map((path) => ({
    url: `${base}/${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  let cmsPaths: MetadataRoute.Sitemap = []
  try {
    const paths = await fetchAllCmsRoutePaths()
    cmsPaths = paths.map((path) => ({
      url: `${base}/${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  } catch {
    cmsPaths = []
  }

  try {
    const courses = await fetchUpcomingCourses()
    const courseUrls: MetadataRoute.Sitemap = courses.map((c) => ({
      url: `${base}/classes/${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))
    return dedupeSitemapByUrl([...staticPages, ...migrated, ...cmsPaths, ...courseUrls])
  } catch {
    return dedupeSitemapByUrl([...staticPages, ...migrated, ...cmsPaths])
  }
}
