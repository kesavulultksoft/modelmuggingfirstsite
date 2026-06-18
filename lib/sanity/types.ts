import type { PortableTextBlock } from '@portabletext/react'

import type { MensBasicImageLayoutId } from '@/lib/marketingPages/mensBasicImageLayout'

export type SanitySeo = {
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  canonicalUrl?: string
}

export type CmsNavLink = { label?: string; href?: string; order?: number }

export type CmsNavGroup = {
  label?: string
  overviewHref?: string
  links?: CmsNavLink[]
}

export type CmsNavigation = {
  groups?: CmsNavGroup[]
  flatLinks?: CmsNavLink[]
}

export type CmsFooterColumn = {
  heading?: string
  links?: CmsNavLink[]
}

export type CmsSiteFooter = {
  taglineTitle?: string
  taglineBody?: string
  columns?: CmsFooterColumn[]
}

export type CmsHeroSection = {
  _type: 'heroSection'
  _key?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  backLabel?: string
  backHref?: string
}

export type CmsRichTextSection = {
  _type: 'richTextSection'
  _key?: string
  heading?: string
  content?: PortableTextBlock[]
  /** Men’s Basic primary/body sections: paragraph rows with per-row images. */
  paragraphRows?: CmsMensBasicParagraphRow[]
  /** Optional footer image (e.g. Men’s Basic main story blocks). */
  image?: CmsImageField
  /** Men's Basic section image layout only; omit on other pages. */
  imageLayout?: MensBasicImageLayoutId
}

export type CmsMensBasicStoryBlock = {
  _key?: string
  editorLabel?: string
  heading?: string
  body?: PortableTextBlock[]
  image?: CmsImageField
  imageLayout?: MensBasicImageLayoutId
}

/** One slot inside `mensBasicMainStories` (plain text body, inline in Studio). */
export type CmsMensBasicStorySlot = {
  heading?: string
  bodyText?: string
  image?: CmsImageField
  imageLayout?: MensBasicImageLayoutId | string | null
}

/** Up to five fixed inline sections after References. */
export type CmsMensBasicMainStories = {
  section1?: CmsMensBasicStorySlot
  section2?: CmsMensBasicStorySlot
  section3?: CmsMensBasicStorySlot
  section4?: CmsMensBasicStorySlot
  section5?: CmsMensBasicStorySlot
}

export type CmsFaqSection = {
  _type: 'faqSection'
  _key?: string
  title?: string
  items?: { question?: string; answer?: string }[]
}

export type CmsCtaSection = {
  _type: 'ctaSection'
  _key?: string
  title?: string
  body?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type CmsMediaBannerSection = {
  _type: 'mediaBannerSection'
  _key?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  image?: CmsImageField
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type CmsSplitMediaSection = {
  _type: 'splitMediaSection'
  _key?: string
  eyebrow?: string
  title?: string
  body?: string
  points?: string[]
  image?: CmsImageField
  imagePosition?: 'left' | 'right'
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type CmsImageCardsSection = {
  _type: 'imageCardsSection'
  _key?: string
  title?: string
  subtitle?: string
  cards?: {
    _key?: string
    title?: string
    description?: string
    image?: CmsImageField
    href?: string
    linkLabel?: string
  }[]
}

/** Curated link bundles for hub pages — add `hubLinksSection` in Sanity Studio */
export type HubLinksPreset =
  | 'trainingProgramOverview'
  | 'defendTimeAndMoney'
  | 'mediaAndProducts'
  | 'safetyCollective'
  | 'knowledgeCenter'

export type CmsHubLinksSection = {
  _type: 'hubLinksSection'
  _key?: string
  /** Optional heading above the grids */
  title?: string
  preset: HubLinksPreset
  /** Training program overview — three bucket headers */
  trainingOfferedImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  locationsScheduleImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  testimonialsImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  /** Defend time & money hub — two bucket headers */
  defendPlanningImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  defendSeriesImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  /** Media & products hub */
  mediaPodcastImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  mediaVideosImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  /** Personal safety collective hub */
  collectiveGiveImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  collectiveStayImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  collectiveContactImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  /** Knowledge center hub */
  knowledgeFoundationImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  knowledgeChoicesImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  knowledgeReadingImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
}

export type CmsSection =
  | CmsHeroSection
  | CmsMediaBannerSection
  | CmsSplitMediaSection
  | CmsImageCardsSection
  | CmsRichTextSection
  | CmsFaqSection
  | CmsCtaSection
  | CmsHubLinksSection

export type CmsImageField = {
  asset?: { _ref?: string; _id?: string; url?: string }
  alt?: string
  caption?: string
}

export type CmsDonateQuote = { text?: string; attribution?: string; note?: string }

export type CmsDonateTier = { amount?: string; title?: string; description?: string }

export type CmsDonateSupportOption = { id?: string; label?: string; description?: string }

export type CmsDonateAckOption = { label?: string }

export type CmsDonateToEmpowermentContent = {
  heroEyebrow?: string
  heroSubtitle?: string
  helpChangeLivesHeading?: string
  helpChangeLivesSubheading?: import('@portabletext/react').PortableTextBlock[]
  nonprofitNote?: import('@portabletext/react').PortableTextBlock[]
  openingQuote?: CmsDonateQuote
  openingBody?: import('@portabletext/react').PortableTextBlock[]
  whyPreventionHeading?: string
  whyPreventionQuote?: CmsDonateQuote
  whyPreventionBody?: import('@portabletext/react').PortableTextBlock[]
  preparednessHeading?: string
  preparednessBody?: import('@portabletext/react').PortableTextBlock[]
  preparednessQuote?: CmsDonateQuote
  preparednessTagline?: string
  tiers?: CmsDonateTier[]
  directSupportHeading?: string
  directSupportIntro?: import('@portabletext/react').PortableTextBlock[]
  directSupportOptions?: CmsDonateSupportOption[]
  recipientAcknowledgmentHeading?: string
  recipientAcknowledgmentIntro?: import('@portabletext/react').PortableTextBlock[]
  recipientAcknowledgmentOptions?: Array<string | CmsDonateAckOption>
  guardiansHeading?: string
  guardiansBody?: import('@portabletext/react').PortableTextBlock[]
  survivorsHeading?: string
  survivorsBody?: import('@portabletext/react').PortableTextBlock[]
  survivorsQuote?: CmsDonateQuote
  since1971Heading?: string
  since1971Body?: import('@portabletext/react').PortableTextBlock[]
  since1971Quote?: CmsDonateQuote
  graduateImage?: CmsImageField
  circleImage?: CmsImageField
  supportDonateTitle?: string
  supportDonateIntro?: string
  supportDonateFootnote?: string
  paypalHostedButtonId?: string
  paypalImageSrc?: string
  paypalImageAlt?: string
  stripeHref?: string
  stripeLabel?: string
  stripeImageSrc?: string
  stripeImageAlt?: string
  gratitudeHeading?: string
  gratitudeBody?: import('@portabletext/react').PortableTextBlock[]
  shareStoryHeading?: string
  shareStoryPrompt?: string
  shareStoryHref?: string
  shareStoryButtonLabel?: string
}

/** Men’s Basic: one paragraph + optional image directly beneath it in Studio. */
export type CmsMensBasicParagraphRow = {
  _type?: 'mensBasicParagraphRow'
  _key?: string
  /** Optional subheading above the paragraph. */
  title?: string
  /** Main paragraph copy. */
  text?: string
  /** Legacy field before rename to `text`. */
  body?: string
  image?: CmsImageField
  /** Row image placement; only meaningful when `image` is set. */
  imageLayout?: MensBasicImageLayoutId | string | null
}

export type CmsHomeLandingSection = {
  title?: string
  description?: string
  body?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  image?: CmsImageField
}

export type CmsHomeLandingContent = {
  heroEyebrow?: string
  heroTitle?: string
  heroSubtitle?: string
  heroPrimaryCtaLabel?: string
  heroSecondaryCtaLabel?: string
  heroVideoLabel?: string
  heroStats?: { value?: string; label?: string }[]
  heroFootnote?: string
  training?: CmsHomeLandingSection
  defending?: CmsHomeLandingSection
  podcast?: CmsHomeLandingSection
  circle?: CmsHomeLandingSection
  library?: CmsHomeLandingSection
}

export type CmsLocationCityCtaBox = {
  title?: string
  body?: PortableTextBlock[]
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type CmsLocationCityContent = {
  heroTagline?: string
  heroTitle?: string
  heroLeadLine?: string
  registerSpotsHeadline?: string
  introVideo?: { youtubeId?: string; title?: string; quote?: string }
  secondVideo?: { youtubeId?: string; title?: string; quote?: string }
  eventsSectionTitle?: string
  eventsSubtitle?: string
  weekendCourseTitle?: string
  weekdayCourseTitle?: string
  eventsEmptyMessage?: string
  courseOverviewHeading?: string
  dayOne?: { heading?: string; items?: string[] }
  dayTwo?: { heading?: string; items?: string[] }
  whyUnique?: {
    title?: string
    body?: PortableTextBlock[]
    lines?: string[]
    registerLabel?: string
    registerHref?: string
  }
  retreatBoxEnabled?: boolean
  retreatBox?: CmsLocationCityCtaBox
  subscribeInvite?: CmsLocationCityCtaBox
  marketingSections?: {
    heading?: string
    body?: PortableTextBlock[]
    imageSrc?: string
    imageAlt?: string
  }[]
  elevenWaysTitle?: string
  elevenWaysSubtitle?: PortableTextBlock[]
  elevenWaysItems?: { title?: string; description?: PortableTextBlock[] }[]
  midCta?: CmsLocationCityCtaBox
  retreatCta?: CmsLocationCityCtaBox
  reclaimPowerCta?: CmsLocationCityCtaBox
  graduateTestimonialsTitle?: string
  graduateTestimonials?: { quote?: string; anchorId?: string }[]
  localSeoHeading?: string
  localSeoBody?: PortableTextBlock[]
  footerCta?: CmsLocationCityCtaBox
  faq?: { question?: string; answer?: PortableTextBlock[] }[]
  donate?: {
    title?: string
    nonprofitSubtitle?: string
    intro?: PortableTextBlock[]
    footnote?: PortableTextBlock[]
    paypalImageSrc?: string
    stripeImageSrc?: string
  }
  defendTimeAndMoneyPromo?: {
    title?: string
    body?: PortableTextBlock[]
    href?: string
    ctaLabel?: string
  }
  podcastPromo?: {
    title?: string
    body?: PortableTextBlock[]
    href?: string
    ctaLabel?: string
    imageSrc?: string
    imageAlt?: string
  }
}

export type CmsPageDocument = {
  _id: string
  title: string
  routePath: string
  pageTemplate?: 'generic' | 'cityLocation' | 'trainingCourse' | 'donatePage' | string
  locationCityContent?: CmsLocationCityContent
  donateToEmpowermentContent?: CmsDonateToEmpowermentContent
  pageType?: string
  seo?: SanitySeo
  homeLandingContent?: CmsHomeLandingContent
  mensBasicContent?: {
    heroSubtitle?: string
    fullForceHeading?: string
    fullForceRows?: CmsMensBasicParagraphRow[]
    /** Rich text with inline links (Men's Basic pilot and legacy). */
    fullForceBody?: PortableTextBlock[]
    /** Legacy plain-text rows. */
    fullForceParagraphs?: string[]
    fullForceImage?: CmsImageField
    fullForceImageLayout?: MensBasicImageLayoutId
  }
  mensBasicPlanNextStep?: {
    eyebrow?: string
    title?: string
    subtitle?: string
    primaryLabel?: string
    primaryHref?: string
    secondaryLabel?: string
    secondaryHref?: string
  }
  mensBasicBodyContent?: {
    courseHeading?: string
    courseRows?: CmsMensBasicParagraphRow[]
    courseBody?: PortableTextBlock[]
    courseParagraphs?: string[]
    courseImage?: CmsImageField
    courseImageLayout?: MensBasicImageLayoutId
    shortIntenseHeading?: string
    shortIntenseRows?: CmsMensBasicParagraphRow[]
    /** Rich text with inline links (Men's Basic pilot). */
    shortIntenseContent?: PortableTextBlock[]
    /** Plain-text block (hidden on Men's Basic pilot). */
    shortIntenseBody?: string
    shortIntenseImage?: CmsImageField
    shortIntenseImageLayout?: MensBasicImageLayoutId
    referencesHeading?: string
    referencesRows?: CmsMensBasicParagraphRow[]
    referencesBody?: PortableTextBlock[]
    referencesParagraphs?: string[]
    referencesImage?: CmsImageField
    referencesImageLayout?: MensBasicImageLayoutId
  }
  mensBasicPageSections?: CmsImageCardsSection[]
  /** Inline extra sections (preferred); section1 renders first. */
  mensBasicMainStories?: CmsMensBasicMainStories
  /** Legacy drag list; used only when `mensBasicMainStories` has no content. */
  mensBasicMainStory?: CmsMensBasicStoryBlock[]
  sections?: CmsSection[]
}
