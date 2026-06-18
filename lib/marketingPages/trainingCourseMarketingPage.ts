import type { CmsImageCardsSection, CmsPageDocument, CmsSection } from '@/lib/sanity/types'
import {
  mergeMensBasicBottomSections,
  mergeMensBasicBodyContent,
  mergeMensBasicContent,
  mergeMensBasicMainStory,
  mergeMensBasicPlanNextStep,
  mergeMensBasicSeo,
} from '@/lib/marketingPages/mensBasicDefaults'
import { usesCourseStyleRichText } from '@/lib/marketingPages/courseStyleRichText'
import { resolveMensBasicRichTextSection } from '@/lib/marketingPages/mensBasicRichTextSection'
import { SHOW_MENS_BASIC_EMBEDDED_CTAS } from '@/lib/sanity/cmsVisibility'
import { normalizeMensBasicImageLayout } from '@/lib/marketingPages/mensBasicImageLayout'
import { getCourseStyleHeroEyebrow } from '@/lib/marketingPages/courseStyleEyebrow'
import { getTrainingCourseSiteDefaults } from '@/lib/marketingPages/trainingCourseLegacyDefaults'
import { stripSeededMensBasicForTrainingMerge } from '@/lib/marketingPages/mensBasicSeedSanitizer'

/**
 * Builds the same section stack as /mens-basic-self-defense for any route in
 * {@link import('./trainingCourseMarketingRoutes').TRAINING_COURSE_MARKETING_ROUTE_PATHS}.
 */
export function buildTrainingCourseMarketingPageDoc(
  cms: CmsPageDocument | null | undefined,
  routeFallback: string,
): CmsPageDocument {
  const routePath = (cms?.routePath || routeFallback).trim()
  const cmsForMerge = cms ? stripSeededMensBasicForTrainingMerge(cms) : cms
  const doc: CmsPageDocument = {
    ...(cmsForMerge || { _id: `fallback-${routePath}` }),
    routePath,
    title: cmsForMerge?.title?.trim() || getTrainingCourseSiteDefaults(routePath).seo.metaTitle,
  }

  const merged = mergeMensBasicContent(doc)
  const body = mergeMensBasicBodyContent(doc)
  const defaults = getTrainingCourseSiteDefaults(routePath)
  const title =
    doc.title?.trim() ||
    defaults.seo.metaTitle.replace(/\s*\|\s*Model Mugging\s*$/i, '').trim() ||
    'Training'

  const bottomSections = mergeMensBasicBottomSections(doc)
  const planNext = mergeMensBasicPlanNextStep(doc)
  const seo = mergeMensBasicSeo(doc)
  const mainStory = mergeMensBasicMainStory(doc)
  const useRichText = usesCourseStyleRichText(routePath)
  /** Rich text + links come from raw CMS; seed sanitizer must not strip populated bodies. */
  const cmsContent = cms?.mensBasicContent
  const cmsBody = cms?.mensBasicBodyContent

  const fullForceRich = useRichText
    ? resolveMensBasicRichTextSection({
        cmsPortable: cmsContent?.fullForceBody,
        cmsParagraphs: cmsContent?.fullForceParagraphs,
        mergedRows: merged.fullForceRows ?? [],
      })
    : { content: [], paragraphRows: merged.fullForceRows ?? [] }

  const courseRich = useRichText
    ? resolveMensBasicRichTextSection({
        cmsPortable: cmsBody?.courseBody,
        cmsParagraphs: cmsBody?.courseParagraphs,
        mergedRows: body.courseRows ?? [],
      })
    : { content: [], paragraphRows: body.courseRows ?? [] }

  const shortIntenseRich = useRichText
    ? resolveMensBasicRichTextSection({
        cmsPortable: cmsBody?.shortIntenseContent,
        cmsParagraphs: cmsBody?.shortIntenseBody ? [cmsBody.shortIntenseBody] : undefined,
        mergedRows: body.shortIntenseRows ?? [],
      })
    : { content: [], paragraphRows: body.shortIntenseRows ?? [] }

  const referencesRich = useRichText
    ? resolveMensBasicRichTextSection({
        cmsPortable: cmsBody?.referencesBody,
        cmsParagraphs: cmsBody?.referencesParagraphs,
        mergedRows: body.referencesRows ?? [],
      })
    : { content: [], paragraphRows: body.referencesRows ?? [] }

  const mainStorySections: CmsSection[] = mainStory.map((block, idx) => ({
    _type: 'richTextSection' as const,
    _key: block._key || `training-course-story-${idx}`,
    heading: block.heading?.trim() || '',
    content: block.body,
    image: block.image,
    imageLayout: normalizeMensBasicImageLayout(block.imageLayout),
  }))

  const planNextBand: CmsSection = {
    _type: 'mediaBannerSection',
    _key: 'plan-next',
    eyebrow: planNext.eyebrow || '',
    title: planNext.title || '',
    subtitle: planNext.subtitle || '',
    primaryLabel: planNext.primaryLabel || '',
    primaryHref: planNext.primaryHref || '',
    secondaryLabel: planNext.secondaryLabel || '',
    secondaryHref: planNext.secondaryHref || '',
  }

  const footerCta: CmsSection = {
    _type: 'ctaSection',
    _key: 'cta',
    title: 'Join Our Contact List For Workshops and Updates in Your City',
    body: 'Browse upcoming classes or reach out and we will notify you about workshop opportunities.',
    primaryLabel: 'View schedule',
    primaryHref: '/schedule',
    secondaryLabel: 'Contact us',
    secondaryHref: '/contact',
  }

  const sections: CmsSection[] = [
    {
      _type: 'heroSection',
      _key: 'hero',
      eyebrow: getCourseStyleHeroEyebrow(routePath),
      title,
      subtitle: merged.heroSubtitle || '',
    },
    {
      _type: 'richTextSection',
      _key: 'full-force',
      heading: merged.fullForceHeading || '',
      paragraphRows: fullForceRich.paragraphRows,
      content: fullForceRich.content,
      image: merged.fullForceImage,
      imageLayout: merged.fullForceImageLayout,
    },
    ...(SHOW_MENS_BASIC_EMBEDDED_CTAS ? [planNextBand] : []),
    {
      _type: 'richTextSection',
      _key: 'course-details',
      heading: body.courseHeading || '',
      paragraphRows: courseRich.paragraphRows,
      content: courseRich.content,
      image: body.courseImage,
      imageLayout: body.courseImageLayout,
    },
    {
      _type: 'richTextSection',
      _key: 'short-intense',
      heading: body.shortIntenseHeading || '',
      paragraphRows: shortIntenseRich.paragraphRows,
      content: shortIntenseRich.content,
      image: body.shortIntenseImage,
      imageLayout: body.shortIntenseImageLayout,
    },
    {
      _type: 'richTextSection',
      _key: 'references',
      heading: body.referencesHeading || '',
      paragraphRows: referencesRich.paragraphRows,
      content: referencesRich.content,
      image: body.referencesImage,
      imageLayout: body.referencesImageLayout,
    },
    ...mainStorySections,
    ...bottomSections,
    ...(SHOW_MENS_BASIC_EMBEDDED_CTAS ? [footerCta] : []),
  ]

  return {
    ...doc,
    title,
    routePath,
    pageType: 'training',
    seo,
    mensBasicContent: merged,
    mensBasicPlanNextStep: planNext,
    mensBasicBodyContent: body,
    mensBasicMainStory: mainStory,
    mensBasicPageSections: bottomSections as CmsImageCardsSection[],
    sections,
  }
}
