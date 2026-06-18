import type { PortableTextBlock } from '@portabletext/react'

/** City location page content model (pilot: code defaults; Sanity `locationCityContent`). */

export type LocationCityFaqItem = {
  question: string
  answer?: PortableTextBlock[]
  /** Plain default answer — converted to `answer` at runtime. */
  answerPlain?: string
}

export type LocationCityGraduateStory = {
  anchorId?: string
  heading: string
  body: string
  enabled?: boolean
}

export type LocationCityInfoBucket = {
  heading: string
  content?: PortableTextBlock[]
  /** Plain seed paragraphs — converted to `content` at runtime. */
  paragraphs?: string[]
  /** Optional image path under /locations/ */
  imageSrc?: string
  imageAlt?: string
}

export type LocationCityRetreatLocation = {
  label: string
  href: string
  enabled?: boolean
}

export type LocationCityDonateButton = {
  label: string
  href: string
  description?: string
  /** Donor / payment brand image (replaces text button when set). */
  imageSrc?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
}

export type LocationCityPromoBox = {
  title: string
  body?: PortableTextBlock[]
  bodyPlain?: string
  href: string
  ctaLabel?: string
  imageSrc?: string
  imageAlt?: string
}

export type LocationCityElevenWay = {
  title: string
  description?: PortableTextBlock[]
  /** Plain default copy — converted to `description` at runtime. */
  descriptionPlain?: string
}

export type LocationCityMarketingSection = {
  heading: string
  content?: PortableTextBlock[]
  /** Plain default paragraphs — converted to `content` at runtime. */
  paragraphs?: string[]
  collapsedByDefault?: boolean
  imageSrc?: string
  imageAlt?: string
}

export type LocationCityTestimonial = {
  quote: string
  anchorId?: string
}

export type LocationCityPageContent = {
  routePath: string
  cityName: string
  scheduleLocationMatch: string
  seo: {
    metaTitle: string
    metaDescription: string
    keywords?: string[]
  }
  hero: {
    title: string
    subtitle?: string
    tagline?: string
    /** Shown above 11 Ways (e.g. "Change Fear Into Power"). */
    leadLine?: string
  }
  /** e.g. "Register Now. Spots are limited." */
  registerSpotsHeadline?: string
  elevenWays?: {
    title: string
    /** Shown under the section title (e.g. tagline moved from a former list item). */
    subtitle?: PortableTextBlock[]
    /** @deprecated Plain default — converted to `subtitle` at runtime. */
    subtitlePlain?: string
    items: LocationCityElevenWay[]
    collapsedByDefault?: boolean
  }
  /** Show all upcoming courses (live SD page lists retreat + other regions). */
  eventsScope?: 'city' | 'all'
  introVideo?: {
    youtubeId: string
    title?: string
    /** Shown under this video only (above Register Now). */
    quote?: string
  }
  /** @deprecated Use introVideo.quote */
  graduateQuote?: string
  eventsSectionTitle?: string
  eventsSubtitle?: string
  graduateTestimonialsTitle?: string
  workshopModules?: {
    title: string
    body: string
    collapsedByDefault?: boolean
  }
  events: {
    weekendTitle: string
    weekdayTitle: string
    emptyMessage: string
  }
  tagline?: string
  retreatBox?: {
    enabled: boolean
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    primaryLabel: string
    primaryHref: string
    locations?: LocationCityRetreatLocation[]
  }
  subscribeInvite: {
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    ctaLabel: string
    ctaHref: string
  }
  /** Modern marketing sections (replaces legacy five buckets when set). */
  marketingSections?: LocationCityMarketingSection[]
  infoBuckets: LocationCityInfoBucket[]
  midCta?: {
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel?: string
    secondaryHref?: string
  }
  retreatCta?: {
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    primaryLabel: string
    primaryHref: string
  }
  courseOverview: {
    heading: string
    paragraphs: string[]
    collapsedByDefault?: boolean
  }
  dayOne: {
    heading: string
    subheading?: string
    items: string[]
  }
  dayTwo: {
    heading: string
    subheading?: string
    items: string[]
  }
  secondVideo?: {
    youtubeId: string
    title?: string
    quote?: string
  }
  graduateStories: LocationCityGraduateStory[]
  graduateTestimonials?: LocationCityTestimonial[]
  reclaimPowerCta?: {
    title: string
    body?: PortableTextBlock[]
    primaryLabel: string
    primaryHref: string
  }
  whyUnique: {
    title: string
    body?: PortableTextBlock[]
    /** Plain lines — converted to `body` at runtime. */
    lines?: string[]
    registerLabel?: string
    registerHref?: string
  }
  localSeo: {
    heading: string
    body?: PortableTextBlock[]
    /** Plain paragraphs — converted to `body` at runtime. */
    paragraphs?: string[]
  }
  faq: LocationCityFaqItem[]
  faqPageHref?: string
  footerCta: {
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    primaryLabel: string
    primaryHref: string
  }
  donate: {
    title: string
    intro?: PortableTextBlock[]
    introPlain?: string
    /** Shown under title in sidebar (e.g. 501(c)(3) – NPO). */
    nonprofitSubtitle?: string
    /** e.g. PayPal vs Stripe note for client review */
    footnote?: PortableTextBlock[]
    footnotePlain?: string
    buttons: LocationCityDonateButton[]
  }
  bottomPromoBoxes?: {
    defendTimeAndMoney?: LocationCityPromoBox
    podcast?: LocationCityPromoBox
  }
  /** Sticky sidebar (template defaults; overridable per city in CMS later). */
  sidebar?: {
    registerLine1?: string
    registerLine2?: string
    podcastLinkLabel?: string
    guardians?: {
      title: string
      body?: PortableTextBlock[]
      bodyPlain?: string
      href: string
      ctaLabel?: string
    }
  }
  courseOutcomes?: {
    heading: string
    items: string[]
  }
  advantage?: {
    heading: string
    items: string[]
    closingParagraphs?: string[]
  }
}
