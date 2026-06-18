import type { MigratedPageDef } from '@/lib/migratedSitePages'
import { MIGRATED_SITE_PAGES } from '@/lib/migratedSitePages'
import { isCourseStyleMarketingRoute } from '@/lib/marketingPages/courseStyleMarketingRoutes'
import { getDefaultCourseStyleBottomSections } from '@/lib/marketingPages/courseStyleBottomSections'

import mensDefaults from './mens-basic.defaults.json'
import womensDefaults from './womens-basic.defaults.json'
import donateDefaults from './donate-to-empowerment.defaults.json'

export type TrainingCourseSiteDefaults = typeof mensDefaults

type MigratedSection = MigratedPageDef['sections'][number]

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function flattenMigratedTail(sections: MigratedSection[], fromIndex: number): string[] {
  const out: string[] = []
  for (let i = fromIndex; i < sections.length; i++) {
    const s = sections[i]
    const h = String(s?.heading || '').trim()
    if (h) out.push(h)
    for (const p of s?.paragraphs || []) {
      const t = String(p || '').trim()
      if (t) out.push(t)
    }
  }
  return out
}

function mapMigratedToDefaults(path: string, page: MigratedPageDef): TrainingCourseSiteDefaults {
  const base = deepClone(mensDefaults)
  const sections = page.sections || []
  const [s0, s1, s2, s3] = sections
  const shortTitle = page.title.split('|')[0]?.trim() || page.title
  const sparse = sections.length < 4

  base.seo = {
    metaTitle: page.title,
    metaDescription: page.description,
    keywords: page.keywords,
  }

  if (sections.length <= 1 && s0) {
    const paras = s0.paragraphs?.filter((p) => String(p).trim()).map((p) => String(p).trim()) || []
    base.mensBasicContent = {
      ...base.mensBasicContent,
      heroSubtitle: page.description,
      fullForceHeading: s0.heading?.trim() || shortTitle,
      fullForceParagraphs:
        paras.length > 0 ? paras : page.description ? [page.description] : base.mensBasicContent.fullForceParagraphs,
    }
    base.mensBasicBodyContent = {
      ...base.mensBasicBodyContent,
      courseHeading: 'What to expect',
      courseParagraphs: page.description ? [page.description] : paras,
      shortIntenseHeading: 'Schedule & support',
      shortIntenseBody:
        'Open the class schedule for upcoming dates in your area, or contact us to discuss hosting, retreats, and group options.',
      referencesHeading: '',
      referencesParagraphs: [],
    }
    base.mensBasicPlanNextStep = {
      ...base.mensBasicPlanNextStep,
      title: `${shortTitle} — plan your next step`,
    }
    base.mensBasicPageSections = getDefaultCourseStyleBottomSections(path) as typeof base.mensBasicPageSections
    return base
  }

  base.mensBasicContent = {
    ...base.mensBasicContent,
    heroSubtitle: page.description,
    fullForceHeading: s0?.heading?.trim() || page.title.split('|')[0]?.trim() || page.title,
    fullForceParagraphs:
      s0?.paragraphs?.filter((p) => String(p).trim()).map((p) => String(p).trim()) ||
      (page.description ? [page.description] : base.mensBasicContent.fullForceParagraphs),
  }

  const courseHeading = s1?.heading?.trim() || base.mensBasicBodyContent.courseHeading
  const courseParagraphs =
    s1?.paragraphs?.filter((p) => String(p).trim()).map((p) => String(p).trim()) ||
    base.mensBasicBodyContent.courseParagraphs

  const shortHeading =
    s2?.heading?.trim() ||
    (sparse ? 'Schedule & support' : base.mensBasicBodyContent.shortIntenseHeading)
  const shortBody =
    s2?.paragraphs?.filter((p) => String(p).trim()).join('\n\n') ||
    (sparse
      ? 'Open the class schedule for upcoming dates in your area, or contact us to discuss hosting and group options.'
      : base.mensBasicBodyContent.shortIntenseBody)

  const refHeading = s3?.heading?.trim() || (sparse ? '' : base.mensBasicBodyContent.referencesHeading)
  const refParas = [
    ...(s3?.paragraphs?.filter((p) => String(p).trim()).map((p) => String(p).trim()) || []),
    ...flattenMigratedTail(sections, 4),
  ]
  const referencesParagraphs =
    refParas.length > 0 ? refParas : sparse ? [] : base.mensBasicBodyContent.referencesParagraphs

  base.mensBasicBodyContent = {
    ...base.mensBasicBodyContent,
    courseHeading,
    courseParagraphs,
    shortIntenseHeading: shortHeading,
    shortIntenseBody: shortBody,
    referencesHeading: refHeading,
    referencesParagraphs,
  }

  base.mensBasicPlanNextStep = {
    ...base.mensBasicPlanNextStep,
    title: `${shortTitle} — plan your next step`,
  }

  base.mensBasicPageSections = getDefaultCourseStyleBottomSections(path) as typeof base.mensBasicPageSections

  return base
}

/**
 * Site JSON defaults for merge helpers: men's shipped JSON, women's JSON, or
 * legacy migrated paragraphs mapped into the same shape.
 */
export function getTrainingCourseSiteDefaults(routePath: string | null | undefined): TrainingCourseSiteDefaults {
  const path = String(routePath || '').trim()
  if (!path || path === 'mens-basic-self-defense') {
    return mensDefaults as TrainingCourseSiteDefaults
  }
  if (path === 'basic-self-defense-class-for-women') {
    return womensDefaults as TrainingCourseSiteDefaults
  }
  if (path === 'donate-to-empowerment') {
    return donateDefaults as TrainingCourseSiteDefaults
  }
  if (!isCourseStyleMarketingRoute(path)) {
    return mensDefaults as TrainingCourseSiteDefaults
  }
  if (path === 'contact') {
    return {
      ...mensDefaults,
      seo: {
        metaTitle: 'Contact | Model Mugging',
        metaDescription:
          'Contact Model Mugging for class questions, workshops, group bookings, or trainer inquiries.',
        keywords: mensDefaults.seo.keywords,
      },
      mensBasicContent: {
        ...mensDefaults.mensBasicContent,
        heroSubtitle: 'We’ll point you to the right class, city, or program lead.',
        fullForceHeading: 'Get in touch',
        fullForceParagraphs: [
          'For a specific class, open that course page — email and phone are listed when available.',
          'Use the form on this page to send a message, or browse the schedule and training pages for next steps.',
        ],
      },
      mensBasicBodyContent: {
        courseHeading: 'Send a message',
        courseParagraphs: [
          'Prefer the form below for general questions, hosting interest, or help choosing a program.',
        ],
        shortIntenseHeading: 'Other ways to reach us',
        shortIntenseBody:
          'Visit modelmugging.org/contact-us for additional public contact options published on the legacy site.',
        referencesHeading: '',
        referencesParagraphs: [],
      },
      mensBasicPageSections: getDefaultCourseStyleBottomSections(path) as typeof mensDefaults.mensBasicPageSections,
    } as TrainingCourseSiteDefaults
  }
  if (path === 'group-course-application') {
    return {
      ...mensDefaults,
      seo: {
        metaTitle: 'Group course application | Model Mugging',
        metaDescription:
          'Bring Model Mugging to your school, workplace, or organization — group course application and next steps.',
        keywords: mensDefaults.seo.keywords,
      },
      mensBasicContent: {
        ...mensDefaults.mensBasicContent,
        heroSubtitle:
          'Host a weekend intensive or private group training with certified Model Mugging instructors.',
        fullForceHeading: 'Group & host course application',
        fullForceParagraphs: [
          'Model Mugging partners with universities, corporations, faith communities, and nonprofits to deliver regional or on-site courses.',
          'Hosting typically includes venue coordination, minimum enrollment, and scheduling through our instructor network.',
        ],
      },
      mensBasicBodyContent: {
        courseHeading: 'What to expect',
        courseParagraphs: [
          'Small classes with full-force padded-assailant training',
          'Trauma-informed coaching and clear graduation standards',
          'Coordination with your location and our instructor calendar',
        ],
        shortIntenseHeading: 'Next steps',
        shortIntenseBody:
          'Tell us about your group, city, and preferred timeframe — we’ll follow up with options and availability. Use Contact for questions before you apply.',
        referencesHeading: '',
        referencesParagraphs: [],
      },
      mensBasicPageSections: getDefaultCourseStyleBottomSections(path) as typeof mensDefaults.mensBasicPageSections,
    } as TrainingCourseSiteDefaults
  }
  const migrated = MIGRATED_SITE_PAGES[path]
  if (migrated?.sections?.length) {
    return mapMigratedToDefaults(path, migrated)
  }
  return {
    ...(mensDefaults as TrainingCourseSiteDefaults),
    mensBasicPageSections: getDefaultCourseStyleBottomSections(path) as typeof mensDefaults.mensBasicPageSections,
  }
}
