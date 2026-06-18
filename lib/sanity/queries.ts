import { cache } from 'react'
import { getSanityClient } from './client'
import type { CmsNavigation, CmsPageDocument, CmsSiteFooter } from './types'

/** Portable text blocks: inline link marks + image assets. */
const portableTextField = (field: string) => `${field}[]{
  ...,
  markDefs[]{
    _key,
    _type,
    href,
    openInNewTab
  },
  children[]{
    ...,
    marks
  },
  asset->{ _id, _ref, url }
}`

/** @deprecated Use portableTextField — kept for story blocks that only need images. */
const portableImages = portableTextField

/** Paragraph rows: title, text (`coalesce` includes legacy `body`), optional image + per-row layout. */
const paragraphRowsProjection = (field: string) => `${field}[]{
  _key,
  title,
  "text": coalesce(text, body),
  image {
    ...,
    asset->{ _id, _ref, url }
  },
  imageLayout
}`

/** Extra sections after References: five fixed slots, plain `bodyText` + optional image. */
const mensBasicMainStoriesProjection = `mensBasicMainStories {
    section1 {
      heading,
      bodyText,
      imageLayout,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    },
    section2 {
      heading,
      bodyText,
      imageLayout,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    },
    section3 {
      heading,
      bodyText,
      imageLayout,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    },
    section4 {
      heading,
      bodyText,
      imageLayout,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    },
    section5 {
      heading,
      bodyText,
      imageLayout,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    }
  }`

/** Prefer site-readable docs (UUID) over Studio-only `page.*` ids when duplicates share a route. */
const PAGE_DOCUMENT_PROJECTION = `{
  ...,
  mensBasicContent {
    ...,
    ${paragraphRowsProjection('fullForceRows')},
    ${portableTextField('fullForceBody')},
    fullForceParagraphs,
    fullForceImage {
      ...,
      asset->{ _id, _ref, url }
    }
  },
  mensBasicBodyContent {
    ...,
    ${paragraphRowsProjection('courseRows')},
    ${paragraphRowsProjection('shortIntenseRows')},
    ${paragraphRowsProjection('referencesRows')},
    ${portableTextField('courseBody')},
    courseParagraphs,
    ${portableTextField('shortIntenseContent')},
    shortIntenseBody,
    ${portableTextField('referencesBody')},
    referencesParagraphs,
    courseImage {
      ...,
      asset->{ _id, _ref, url }
    },
    shortIntenseImage {
      ...,
      asset->{ _id, _ref, url }
    },
    referencesImage {
      ...,
      asset->{ _id, _ref, url }
    }
  },
  ${mensBasicMainStoriesProjection},
  mensBasicMainStory[]{
    ...,
    body[]{
      ...,
      asset->{ _id, _ref, url }
    },
    image {
      ...,
      asset->{ _id, _ref, url }
    }
  },
  mensBasicPageSections[]{
    ...,
    cards[]{
      ...,
      image {
        ...,
        asset->{ _id, _ref, url }
      }
    }
  },
  donateToEmpowermentContent {
    ...,
    ${portableTextField('helpChangeLivesSubheading')},
    ${portableTextField('nonprofitNote')},
    ${portableTextField('openingBody')},
    ${portableTextField('whyPreventionBody')},
    ${portableTextField('preparednessBody')},
    ${portableTextField('directSupportIntro')},
    ${portableTextField('recipientAcknowledgmentIntro')},
    ${portableTextField('guardiansBody')},
    ${portableTextField('survivorsBody')},
    ${portableTextField('since1971Body')},
    ${portableTextField('gratitudeBody')},
    graduateImage {
      ...,
      asset->{ _id, _ref, url }
    },
    circleImage {
      ...,
      asset->{ _id, _ref, url }
    },
    supportDonateTitle,
    supportDonateIntro,
    supportDonateFootnote,
    paypalHostedButtonId,
    paypalImageSrc,
    paypalImageAlt,
    stripeHref,
    stripeLabel,
    stripeImageSrc,
    stripeImageAlt
  },
  locationCityContent {
    heroTagline,
    heroTitle,
    heroLeadLine,
    registerSpotsHeadline,
    introVideo { youtubeId, title, quote },
    secondVideo { youtubeId, title, quote },
    eventsSectionTitle,
    eventsSubtitle,
    weekendCourseTitle,
    weekdayCourseTitle,
    eventsEmptyMessage,
    courseOverviewHeading,
    dayOne { heading, items },
    dayTwo { heading, items },
    whyUnique {
      title,
      ${portableTextField('body')},
      lines,
      registerLabel,
      registerHref
    },
    retreatBoxEnabled,
    retreatBox {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref
    },
    subscribeInvite {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref
    },
    marketingSections[]{
      heading,
      ${portableTextField('body')},
      imageSrc,
      imageAlt
    },
    elevenWaysTitle,
    ${portableTextField('elevenWaysSubtitle')},
    elevenWaysItems[]{
      title,
      ${portableTextField('description')}
    },
    midCta {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref,
      secondaryLabel,
      secondaryHref
    },
    retreatCta {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref
    },
    reclaimPowerCta {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref
    },
    graduateTestimonialsTitle,
    graduateTestimonials[]{ quote, anchorId },
    localSeoHeading,
    ${portableTextField('localSeoBody')},
    footerCta {
      title,
      ${portableTextField('body')},
      primaryLabel,
      primaryHref
    },
    faq[]{
      question,
      ${portableTextField('answer')}
    },
    donate {
      title,
      nonprofitSubtitle,
      ${portableTextField('intro')},
      ${portableTextField('footnote')},
      paypalImageSrc,
      stripeImageSrc
    },
    defendTimeAndMoneyPromo {
      title,
      ${portableTextField('body')},
      href,
      ctaLabel
    },
    podcastPromo {
      title,
      ${portableTextField('body')},
      href,
      ctaLabel,
      imageSrc,
      imageAlt
    }
  }
}`

const PAGE_QUERY = `coalesce(
  *[_type == "page" && routePath == $path && !(_id match "page.*")][0]${PAGE_DOCUMENT_PROJECTION},
  *[_type == "page" && routePath == $path][0]${PAGE_DOCUMENT_PROJECTION}
)`

const ALL_PAGE_PATHS = `*[_type == "page" && defined(routePath)].routePath`

const NAV_QUERY = `*[_type == "navigation"][0]{
  groups[]{
    label,
    overviewHref,
    links[]{ label, href, order }
  },
  flatLinks[]{ label, href, order }
}`

const FOOTER_QUERY = `*[_type == "siteFooter"][0]{
  taglineTitle,
  taglineBody,
  columns[]{
    heading,
    links[]{ label, href, order }
  }
}`

export async function fetchCmsPageByPath(path: string): Promise<CmsPageDocument | null> {
  const c = getSanityClient()
  if (!c) return null
  const doc = await c.fetch<CmsPageDocument | null>(
    PAGE_QUERY,
    { path },
    { cache: 'no-store' },
  )
  return doc ?? null
}

/**
 * In development, skip React `cache()` so each request refetches Sanity (easier to verify images/copy).
 * In production, dedupe `generateMetadata` + page in the same render.
 */
export const getCachedCmsPage =
  process.env.NODE_ENV === 'development' ? fetchCmsPageByPath : cache(fetchCmsPageByPath)

export async function fetchAllCmsRoutePaths(): Promise<string[]> {
  const c = getSanityClient()
  if (!c) return []
  const paths = await c.fetch<string[]>(ALL_PAGE_PATHS)
  return Array.isArray(paths) ? paths.filter(Boolean) : []
}

export async function fetchCmsNavigation(): Promise<CmsNavigation | null> {
  const c = getSanityClient()
  if (!c) return null
  return c.fetch<CmsNavigation | null>(NAV_QUERY)
}

export async function fetchCmsFooter(): Promise<CmsSiteFooter | null> {
  const c = getSanityClient()
  if (!c) return null
  return c.fetch<CmsSiteFooter | null>(FOOTER_QUERY)
}

function sortLinks<T extends { order?: number }>(items: T[] | undefined): T[] {
  if (!items?.length) return []
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function normalizeNavigation(raw: CmsNavigation | null): CmsNavigation | null {
  if (!raw?.groups?.length) return null
  return {
    groups: raw.groups.map((g) => ({
      ...g,
      links: sortLinks(g.links).map(({ label, href }) => ({ label, href })),
    })),
    flatLinks: sortLinks(raw.flatLinks).map(({ label, href }) => ({ label, href })),
  }
}

export function normalizeFooter(raw: CmsSiteFooter | null): CmsSiteFooter | null {
  if (!raw) return null
  const hasCols = Boolean(raw.columns?.length)
  const hasTag = Boolean(raw.taglineTitle?.trim() || raw.taglineBody?.trim())
  if (!hasCols && !hasTag) return null
  return {
    ...raw,
    columns: hasCols
      ? raw.columns!.map((col) => ({
          ...col,
          links: sortLinks(col.links).map(({ label, href }) => ({ label, href })),
        }))
      : undefined,
  }
}
