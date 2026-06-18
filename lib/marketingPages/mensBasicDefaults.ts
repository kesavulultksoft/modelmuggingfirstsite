import type { PortableTextBlock } from '@portabletext/react'

import type {
  CmsImageCardsSection,
  CmsMensBasicMainStories,
  CmsMensBasicParagraphRow,
  CmsMensBasicStoryBlock,
  CmsMensBasicStorySlot,
  CmsPageDocument,
} from '@/lib/sanity/types'
import { normalizeMensBasicImageLayout } from '@/lib/marketingPages/mensBasicImageLayout'
import {
  assetHasRef,
  coalesceParagraphRowsPreferRicher,
  isPortableWithContent,
  linesToParagraphRows,
  paragraphLinesToPortable,
  paragraphRowsHaveContent,
  portableToParagraphRows,
  stampParagraphRows,
} from '@/lib/marketingPages/mensBasicPortable'
import { getTrainingCourseSiteDefaults, type TrainingCourseSiteDefaults } from '@/lib/marketingPages/trainingCourseLegacyDefaults'
import siteDefaults from './mens-basic.defaults.json'

export type MensBasicSiteDefaults = typeof siteDefaults

/** Shipped men's defaults (same as `getTrainingCourseSiteDefaults('mens-basic-self-defense')`). */
export const MENS_BASIC_SITE_DEFAULTS: MensBasicSiteDefaults = siteDefaults

function siteFor(cms: CmsPageDocument | null | undefined): TrainingCourseSiteDefaults {
  return getTrainingCourseSiteDefaults(cms?.routePath)
}

function nonEmptyStrings(arr: string[] | undefined): string[] {
  return (arr || []).map((s) => String(s || '').trim()).filter(Boolean)
}

function defaultFullForceRowsFromSite(site: TrainingCourseSiteDefaults): CmsMensBasicParagraphRow[] {
  const d = site.mensBasicContent as unknown as {
    fullForceRows?: CmsMensBasicParagraphRow[]
    fullForceBody?: import('@portabletext/react').PortableTextBlock[]
    fullForceParagraphs?: string[]
  }
  const paras = nonEmptyStrings(d.fullForceParagraphs)
  if (paras.length > 0) return linesToParagraphRows(paras, 'defaults-ff')
  if (paragraphRowsHaveContent(d.fullForceRows)) return stampParagraphRows(d.fullForceRows!)
  if (isPortableWithContent(d.fullForceBody)) return portableToParagraphRows(d.fullForceBody)
  return []
}

/** Field-level merge: any empty CMS field falls back to site defaults (Studio matches frontend). */
export function mergeMensBasicContent(
  cms: CmsPageDocument | null | undefined
): NonNullable<CmsPageDocument['mensBasicContent']> {
  const site = siteFor(cms)
  const d = site.mensBasicContent
  const c = cms?.mensBasicContent
  const fullForceRows = (() => {
    const fromParas = nonEmptyStrings(c?.fullForceParagraphs)
    if (fromParas.length > 0) return linesToParagraphRows(fromParas, 'cms-ff')
    const merged = coalesceParagraphRowsPreferRicher(c?.fullForceRows, c?.fullForceBody)
    if (paragraphRowsHaveContent(merged)) return merged
    return defaultFullForceRowsFromSite(site)
  })()
  return {
    heroSubtitle: c?.heroSubtitle?.trim() || d.heroSubtitle,
    fullForceHeading: c?.fullForceHeading?.trim() || d.fullForceHeading,
    fullForceRows,
    fullForceImage: c?.fullForceImage,
    fullForceImageLayout: normalizeMensBasicImageLayout(c?.fullForceImageLayout),
  }
}

function defaultCourseRowsFromSite(site: TrainingCourseSiteDefaults): CmsMensBasicParagraphRow[] {
  const d = site.mensBasicBodyContent as unknown as {
    courseRows?: CmsMensBasicParagraphRow[]
    courseBody?: import('@portabletext/react').PortableTextBlock[]
    courseParagraphs?: string[]
  }
  const paras = nonEmptyStrings(d.courseParagraphs)
  if (paras.length > 0) return linesToParagraphRows(paras, 'defaults-course')
  if (paragraphRowsHaveContent(d.courseRows)) return stampParagraphRows(d.courseRows!)
  if (isPortableWithContent(d.courseBody)) return portableToParagraphRows(d.courseBody)
  return []
}

function defaultReferencesRowsFromSite(site: TrainingCourseSiteDefaults): CmsMensBasicParagraphRow[] {
  const d = site.mensBasicBodyContent as unknown as {
    referencesRows?: CmsMensBasicParagraphRow[]
    referencesBody?: import('@portabletext/react').PortableTextBlock[]
    referencesParagraphs?: string[]
  }
  const paras = nonEmptyStrings(d.referencesParagraphs)
  if (paras.length > 0) return linesToParagraphRows(paras, 'defaults-refs')
  if (paragraphRowsHaveContent(d.referencesRows)) return stampParagraphRows(d.referencesRows!)
  if (isPortableWithContent(d.referencesBody)) return portableToParagraphRows(d.referencesBody)
  return []
}

function defaultShortIntenseRowsFromSite(site: TrainingCourseSiteDefaults): CmsMensBasicParagraphRow[] {
  const d = site.mensBasicBodyContent as unknown as {
    shortIntenseRows?: CmsMensBasicParagraphRow[]
    shortIntenseContent?: import('@portabletext/react').PortableTextBlock[]
    shortIntenseBody?: string
  }
  const plain = String(d.shortIntenseBody || '').trim()
  if (plain) return linesToParagraphRows([plain], 'defaults-si')
  if (paragraphRowsHaveContent(d.shortIntenseRows)) return stampParagraphRows(d.shortIntenseRows!)
  if (isPortableWithContent(d.shortIntenseContent)) return portableToParagraphRows(d.shortIntenseContent)
  return []
}

export function mergeMensBasicBodyContent(
  cms: CmsPageDocument | null | undefined
): NonNullable<CmsPageDocument['mensBasicBodyContent']> {
  const site = siteFor(cms)
  const d = site.mensBasicBodyContent
  const c = cms?.mensBasicBodyContent
  const legacy = (cms?.mensBasicContent || {}) as Record<string, unknown>

  const courseRows = (() => {
    const fromC = nonEmptyStrings(c?.courseParagraphs)
    if (fromC.length > 0) return linesToParagraphRows(fromC, 'cms-course')
    const merged = coalesceParagraphRowsPreferRicher(c?.courseRows, c?.courseBody)
    if (paragraphRowsHaveContent(merged)) return merged
    const fromLegacy = nonEmptyStrings(legacy.courseParagraphs as string[] | undefined)
    if (fromLegacy.length > 0) return linesToParagraphRows(fromLegacy, 'cms-course-legacy')
    return defaultCourseRowsFromSite(site)
  })()

  const shortIntenseRows = (() => {
    const bodyFirst =
      c?.shortIntenseBody?.trim() ||
      String(legacy.shortIntenseBody || '').trim()
    if (bodyFirst) return linesToParagraphRows([bodyFirst], 'cms-si')
    const merged = coalesceParagraphRowsPreferRicher(c?.shortIntenseRows, c?.shortIntenseContent)
    if (paragraphRowsHaveContent(merged)) return merged
    return defaultShortIntenseRowsFromSite(site)
  })()

  const referencesRows = (() => {
    const fromC = nonEmptyStrings(c?.referencesParagraphs)
    if (fromC.length > 0) return linesToParagraphRows(fromC, 'cms-refs')
    const merged = coalesceParagraphRowsPreferRicher(c?.referencesRows, c?.referencesBody)
    if (paragraphRowsHaveContent(merged)) return merged
    const fromLegacy = nonEmptyStrings(legacy.referencesParagraphs as string[] | undefined)
    if (fromLegacy.length > 0) return linesToParagraphRows(fromLegacy, 'cms-refs-legacy')
    return defaultReferencesRowsFromSite(site)
  })()

  return {
    courseHeading: c?.courseHeading?.trim() || String(legacy.courseHeading || '').trim() || d.courseHeading,
    courseRows,
    shortIntenseHeading:
      c?.shortIntenseHeading?.trim() ||
      String(legacy.shortIntenseHeading || '').trim() ||
      d.shortIntenseHeading,
    shortIntenseRows,
    referencesHeading:
      c?.referencesHeading?.trim() ||
      String(legacy.referencesHeading || '').trim() ||
      d.referencesHeading,
    referencesRows,
    courseImage: c?.courseImage,
    courseImageLayout: normalizeMensBasicImageLayout(c?.courseImageLayout),
    shortIntenseImage: c?.shortIntenseImage,
    shortIntenseImageLayout: normalizeMensBasicImageLayout(c?.shortIntenseImageLayout),
    referencesImage: c?.referencesImage,
    referencesImageLayout: normalizeMensBasicImageLayout(c?.referencesImageLayout),
  }
}

export function mergeMensBasicPlanNextStep(
  cms: CmsPageDocument | null | undefined
): NonNullable<CmsPageDocument['mensBasicPlanNextStep']> {
  const d = siteFor(cms).mensBasicPlanNextStep
  const p = cms?.mensBasicPlanNextStep
  return {
    eyebrow: p?.eyebrow?.trim() || d.eyebrow,
    title: p?.title?.trim() || d.title,
    subtitle: p?.subtitle?.trim() || d.subtitle,
    primaryLabel: p?.primaryLabel?.trim() || d.primaryLabel,
    primaryHref: p?.primaryHref?.trim() || d.primaryHref,
    secondaryLabel: p?.secondaryLabel?.trim() || d.secondaryLabel,
    secondaryHref: p?.secondaryHref?.trim() || d.secondaryHref,
  }
}

function storyBlockHasContent(block: CmsMensBasicStoryBlock): boolean {
  if (block.heading?.trim()) return true
  if (assetHasRef(block.image?.asset)) return true
  return Array.isArray(block.body) && block.body.length > 0
}

const MAIN_STORY_SLOT_KEYS = ['section1', 'section2', 'section3', 'section4', 'section5'] as const

function storySlotHasContent(slot: CmsMensBasicStorySlot | undefined): boolean {
  if (!slot) return false
  if (String(slot.heading || '').trim()) return true
  if (assetHasRef(slot.image?.asset)) return true
  return Boolean(String(slot.bodyText || '').trim())
}

function bodyTextToPortableBlocks(text: string | undefined, keyPrefix: string): PortableTextBlock[] {
  const raw = String(text ?? '')
  if (!raw.trim()) return []
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paragraphLinesToPortable(paragraphs, keyPrefix)
}

function inlineMainStoriesToBlocks(slots: CmsMensBasicMainStories | undefined): CmsMensBasicStoryBlock[] {
  if (!slots) return []
  const out: CmsMensBasicStoryBlock[] = []
  for (const key of MAIN_STORY_SLOT_KEYS) {
    const slot = slots[key]
    if (!storySlotHasContent(slot)) continue
    out.push({
      _key: `inline-${key}`,
      heading: String(slot!.heading || '').trim() || undefined,
      body: bodyTextToPortableBlocks(slot!.bodyText, `main-story-${key}`),
      image: slot!.image,
      imageLayout: normalizeMensBasicImageLayout(slot!.imageLayout),
    })
  }
  return out
}

/**
 * CMS-only blocks; no site JSON defaults — empty array when unset.
 * Prefers inline `mensBasicMainStories` (sections 1–5); falls back to legacy `mensBasicMainStory` array.
 */
export function mergeMensBasicMainStory(
  cms: CmsPageDocument | null | undefined
): CmsMensBasicStoryBlock[] {
  const fromInline = inlineMainStoriesToBlocks(cms?.mensBasicMainStories)
  if (fromInline.length > 0) return fromInline.filter((b) => b && storyBlockHasContent(b))

  const raw = cms?.mensBasicMainStory
  if (!Array.isArray(raw) || raw.length === 0) return []
  return raw.filter((b) => b && storyBlockHasContent(b))
}

function imageCardHasEditorSignals(card: {
  title?: string
  description?: string
  href?: string
  linkLabel?: string
  image?: { asset?: unknown }
}): boolean {
  if (String(card.title || '').trim()) return true
  if (String(card.description || '').trim()) return true
  if (String(card.href || '').trim()) return true
  if (String(card.linkLabel || '').trim()) return true
  return assetHasRef(card.image?.asset)
}

function imageCardsSectionHasEditorSignals(section: {
  title?: string
  subtitle?: string
  cards?: { title?: string; description?: string; href?: string; linkLabel?: string; image?: { asset?: unknown } }[]
}): boolean {
  if (String(section.title || '').trim()) return true
  if (String(section.subtitle || '').trim()) return true
  return (section.cards || []).some((c) => imageCardHasEditorSignals(c))
}

export function mergeMensBasicBottomSections(
  cms: CmsPageDocument | null | undefined
): CmsImageCardsSection[] {
  const sections = cms?.mensBasicPageSections
  if (sections?.length && sections.some((s) => imageCardsSectionHasEditorSignals(s))) {
    return sections as CmsImageCardsSection[]
  }
  return siteFor(cms).mensBasicPageSections as unknown as CmsImageCardsSection[]
}

const GENERIC_SEO_DESC = 'cms-managed marketing page'

export function mergeMensBasicSeo(cms: CmsPageDocument | null | undefined): NonNullable<CmsPageDocument['seo']> {
  const d = siteFor(cms).seo
  const s = cms?.seo
  const metaDescription = (() => {
    const cur = s?.metaDescription?.trim() || ''
    if (!cur || cur.toLowerCase().includes(GENERIC_SEO_DESC)) return d.metaDescription
    return cur
  })()
  const metaTitle = (() => {
    const cur = s?.metaTitle?.trim() || ''
    if (!cur) return d.metaTitle
    return cur
  })()

  return {
    ...s,
    metaTitle,
    metaDescription,
    keywords: s?.keywords && s.keywords.length > 0 ? s.keywords : d.keywords,
  }
}
