import type { Metadata } from 'next'
import NewHomeExperience from '@/components/site/newhome/NewHomeExperience'
import JsonLd from '@/components/site/JsonLd'
import { getCachedCmsPage } from '@/lib/sanity/queries'
import { buildCmsPageMetadata } from '@/lib/sanity/buildMetadata'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'
const routePath = 'home'
export const revalidate = 10

const fallbackMetadata: Metadata = {
  title: 'Model Mugging® | Full-Force Self Defense Classes',
  description:
    'Original full-force self defense since 1971. Weekend courses, small classes, padded-assailant training — learn to fight back with confidence.',
  robots: { index: true, follow: true },
}

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCachedCmsPage(routePath)
  if (cms) return buildCmsPageMetadata(cms, site)
  return fallbackMetadata
}

export default async function HomePage() {
  const cms = await getCachedCmsPage(routePath)
  // Home page is intentionally driven by homeLandingContent only.
  // Ignore generic page sections for /home to keep CMS editing predictable.

  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What makes Model Mugging different?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Small classes, a padded assailant, and full-force practice so your body remembers under stress — not just theory.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I register for a class?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Browse the schedule, choose your city and dates, open the course page, and complete registration and payment online.',
        },
      },
    ],
  }

  return (
    <>
      <JsonLd data={faqJson} />
      <NewHomeExperience content={cms?.homeLandingContent} />
    </>
  )
}
