import type { CmsPageDocument } from '@/lib/sanity/types'
import { isPortableWithContent } from '@/lib/marketingPages/mensBasicPortable'
import { isTrainingCourseMarketingRoute } from '@/lib/marketingPages/trainingCourseMarketingRoutes'
import mensDefaults from './mens-basic.defaults.json'

type MensDefaultsShape = {
  mensBasicContent: { heroSubtitle: string; fullForceHeading: string }
  mensBasicBodyContent: { courseHeading: string; courseParagraphs: string[] }
}

const M = mensDefaults as MensDefaultsShape

const GENERIC_HERO = M.mensBasicContent.heroSubtitle.trim()
const GENERIC_FF_HEADING = M.mensBasicContent.fullForceHeading.trim()
const GENERIC_COURSE_HEADING = M.mensBasicBodyContent.courseHeading.trim()
const GENERIC_COURSE_FIRST = (M.mensBasicBodyContent.courseParagraphs[0] || '').slice(0, 48)

const SEED_PLAN_SUBTITLE = 'fully editable in Sanity'
const SEED_PLAN_TITLE_SUFFIX = 'plan your next step confidently'
const SEED_CARDS_SUBTITLE = 'Use these quick links while editing'
const SEED_MAIN_STORY = 'Replace this starter content with your final approved copy'

function planNextLooksSeeded(p: NonNullable<CmsPageDocument['mensBasicPlanNextStep']>): boolean {
  const st = p.subtitle?.trim() || ''
  const ti = p.title?.trim().toLowerCase() || ''
  if (st.includes(SEED_PLAN_SUBTITLE)) return true
  if (ti.endsWith(SEED_PLAN_TITLE_SUFFIX)) return true
  return false
}

function pageSectionsLookSeeded(sections: NonNullable<CmsPageDocument['mensBasicPageSections']>): boolean {
  return sections.some((s) => String(s?.subtitle || '').includes(SEED_CARDS_SUBTITLE))
}

function mainStoryJsonLooksSeeded(cms: CmsPageDocument): boolean {
  const blob = JSON.stringify([cms.mensBasicMainStory, cms.mensBasicMainStories])
  return blob.includes(SEED_MAIN_STORY)
}

function courseBodyStillGeneric(cms: CmsPageDocument): boolean {
  const mb = cms.mensBasicBodyContent
  if (!mb?.courseHeading?.trim() || mb.courseHeading.trim() !== GENERIC_COURSE_HEADING) return false
  const rows = mb.courseRows
  const firstRowText = rows?.[0] && 'text' in rows[0] ? String((rows[0] as { text?: string }).text || '').trim() : ''
  if (firstRowText && GENERIC_COURSE_FIRST && firstRowText.startsWith(GENERIC_COURSE_FIRST)) return true
  const paras = mb.courseParagraphs
  const firstP = paras?.[0] ? String(paras[0]).trim() : ''
  if (firstP && GENERIC_COURSE_FIRST && firstP.startsWith(GENERIC_COURSE_FIRST)) return true
  if (!firstRowText && !firstP && !mb.courseBody?.length) return true
  return false
}

/**
 * CMS marketing seeds copy men's `mensBasic*` placeholders onto every training URL.
 * For allowlisted course routes, drop those placeholders so merge falls back to
 * `getTrainingCourseSiteDefaults` (JSON + migrated paragraphs) instead of seed text.
 */
export function stripSeededMensBasicForTrainingMerge(cms: CmsPageDocument): CmsPageDocument {
  const path = cms.routePath?.trim()
  if (!path || !isTrainingCourseMarketingRoute(path)) return cms

  let out: CmsPageDocument = { ...cms }
  let mc = cms.mensBasicContent

  if (mc) {
    const patch = { ...mc }
    let touched = false
    if (mc.heroSubtitle?.trim() === GENERIC_HERO) {
      patch.heroSubtitle = undefined
      touched = true
    }
    if (mc.fullForceHeading?.trim() === GENERIC_FF_HEADING) {
      patch.fullForceHeading = undefined
      patch.fullForceRows = undefined
      patch.fullForceParagraphs = undefined
      if (!isPortableWithContent(mc.fullForceBody)) {
        patch.fullForceBody = undefined
      }
      touched = true
    }
    if (touched) out = { ...out, mensBasicContent: patch }
  }

  if (cms.mensBasicPlanNextStep && planNextLooksSeeded(cms.mensBasicPlanNextStep)) {
    out = { ...out, mensBasicPlanNextStep: undefined }
  }

  if (cms.mensBasicBodyContent && courseBodyStillGeneric(cms)) {
    const mb = cms.mensBasicBodyContent
    out = {
      ...out,
      mensBasicBodyContent: {
        ...mb,
        courseHeading: undefined,
        courseRows: undefined,
        courseParagraphs: undefined,
        shortIntenseHeading: undefined,
        shortIntenseRows: undefined,
        shortIntenseBody: undefined,
        referencesHeading: undefined,
        referencesRows: undefined,
        referencesParagraphs: undefined,
        ...(isPortableWithContent(mb.courseBody) ? {} : { courseBody: undefined }),
        ...(isPortableWithContent(mb.shortIntenseContent) ? {} : { shortIntenseContent: undefined }),
        ...(isPortableWithContent(mb.referencesBody) ? {} : { referencesBody: undefined }),
      },
    }
  }

  if (cms.mensBasicPageSections?.length && pageSectionsLookSeeded(cms.mensBasicPageSections)) {
    out = { ...out, mensBasicPageSections: undefined }
  }

  if (mainStoryJsonLooksSeeded(cms)) {
    out = { ...out, mensBasicMainStory: undefined, mensBasicMainStories: undefined }
  }

  return out
}
