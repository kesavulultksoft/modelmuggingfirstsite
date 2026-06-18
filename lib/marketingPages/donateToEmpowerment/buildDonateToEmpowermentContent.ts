import type { PortableTextBlock } from '@portabletext/react'

import type { CmsDonateQuote, CmsDonateToEmpowermentContent, CmsImageField, CmsPageDocument } from '@/lib/sanity/types'
import { urlForImage } from '@/lib/sanity/image'
import { isPortableWithContent, paragraphLinesToPortable } from '@/lib/marketingPages/mensBasicPortable'
import { DONATE_TO_EMPOWERMENT_DEFAULTS } from './defaults'
import {
  portableToPlainParagraphs,
  portableToPlainText,
  resolvePortableBody,
  resolvePortableParagraph,
} from './portable'
import { DONATE_STRIPE_CHECKOUT_PATH } from '@/lib/donate/constants'
import type { DonateQuote, DonateSupportOption, DonateTier, DonateToEmpowermentContent } from './types'
import { DONATE_TO_EMPOWERMENT_ROUTE_PATH } from './types'

function normalizeStripeCheckoutHref(href: string | undefined): string {
  const t = (href ?? '').trim()
  if (!t || t === '/donate' || t === '/donate/' || t.startsWith('/donate?')) {
    return DONATE_STRIPE_CHECKOUT_PATH
  }
  return t
}

const PLAIN = DONATE_TO_EMPOWERMENT_DEFAULTS

function cmsDonateImage(
  image: CmsImageField | undefined,
  fallback: { src: string; alt: string; caption: string },
): { src: string; alt: string; caption: string } {
  const src = urlForImage(image, { width: 1200, fit: 'max' }) ?? fallback.src
  return {
    src,
    alt: image?.alt?.trim() || fallback.alt,
    caption: image?.caption?.trim() || fallback.caption,
  }
}

function mergeQuote(cms: CmsDonateQuote | undefined, fallback: DonateQuote): DonateQuote {
  if (!cms) return fallback
  return {
    text: cms.text?.trim() || fallback.text,
    attribution: cms.attribution?.trim() || fallback.attribution,
    note: cms.note?.trim() || fallback.note,
  }
}

function mergeTiers(cms: CmsDonateToEmpowermentContent['tiers'], fallback: DonateTier[]): DonateTier[] {
  if (!cms?.length) return fallback
  const merged = cms
    .map((t) => ({
      amount: t.amount?.trim() || '',
      title: t.title?.trim() || '',
      description: t.description?.trim() || '',
    }))
    .filter((t) => t.amount && t.title)
  return merged.length ? merged : fallback
}

function mergeSupportOptions(
  cms: CmsDonateToEmpowermentContent['directSupportOptions'],
  fallback: DonateSupportOption[],
): DonateSupportOption[] {
  if (!cms?.length) return fallback
  const merged = cms
    .map((o) => ({
      id: o.id?.trim() || '',
      label: o.label?.trim() || '',
      description: o.description?.trim() || '',
    }))
    .filter((o) => o.id && o.label)
  return merged.length ? merged : fallback
}

function mergeAckOptions(
  cms: CmsDonateToEmpowermentContent['recipientAcknowledgmentOptions'],
  fallback: string[],
): string[] {
  if (!cms?.length) return fallback
  const merged = cms
    .map((o) => (typeof o === 'string' ? o : o?.label)?.trim())
    .filter(Boolean) as string[]
  return merged.length ? merged : fallback
}

function preparednessPortableFromPlain(): PortableTextBlock[] {
  return [
    ...paragraphLinesToPortable([PLAIN.preparedness.intro], 'prep-intro'),
    ...PLAIN.preparedness.bullets.map((line, idx) => ({
      _type: 'block' as const,
      _key: `prep-bullet-${idx}`,
      style: 'normal' as const,
      listItem: 'bullet' as const,
      level: 1,
      markDefs: [],
      children: [{ _type: 'span' as const, text: line, marks: [] }],
    })),
    ...paragraphLinesToPortable([PLAIN.preparedness.closing], 'prep-close'),
  ]
}

function defaultsToContent(): DonateToEmpowermentContent {
  return {
    routePath: PLAIN.routePath,
    seo: PLAIN.seo,
    hero: PLAIN.hero,
    helpChangeLives: {
      heading: PLAIN.helpChangeLives.heading,
      subheading: PLAIN.helpChangeLives.subheading.trim()
        ? paragraphLinesToPortable([PLAIN.helpChangeLives.subheading], 'help-sub')
        : [],
      nonprofitNote: paragraphLinesToPortable([PLAIN.helpChangeLives.nonprofitNote], 'nonprofit'),
    },
    openingQuote: PLAIN.openingQuote,
    openingBody: paragraphLinesToPortable(PLAIN.openingParagraphs, 'opening'),
    whyPrevention: {
      heading: PLAIN.whyPrevention.heading,
      quote: PLAIN.whyPrevention.quote,
      body: paragraphLinesToPortable([PLAIN.whyPrevention.body], 'why-prev'),
    },
    preparedness: {
      heading: PLAIN.preparedness.heading,
      body: preparednessPortableFromPlain(),
      quote: PLAIN.preparedness.quote,
      tagline: PLAIN.preparedness.tagline,
    },
    tiers: PLAIN.tiers,
    guardians: {
      heading: PLAIN.guardians.heading,
      body: paragraphLinesToPortable([PLAIN.guardians.body], 'guardians'),
    },
    survivorsToThrivers: {
      heading: PLAIN.survivorsToThrivers.heading,
      body: paragraphLinesToPortable([PLAIN.survivorsToThrivers.body], 'survivors'),
      quote: PLAIN.survivorsToThrivers.quote,
    },
    since1971: {
      heading: PLAIN.since1971.heading,
      body: paragraphLinesToPortable([PLAIN.since1971.body], 'since1971'),
      quote: PLAIN.since1971.quote,
    },
    directSupport: {
      heading: PLAIN.directSupport.heading,
      intro: paragraphLinesToPortable([PLAIN.directSupport.intro], 'direct-intro'),
      options: PLAIN.directSupport.options,
    },
    recipientAcknowledgment: {
      heading: PLAIN.recipientAcknowledgment.heading,
      intro: paragraphLinesToPortable([PLAIN.recipientAcknowledgment.intro], 'recipient-intro'),
      options: PLAIN.recipientAcknowledgment.options,
    },
    gratitude: {
      heading: PLAIN.gratitude.heading,
      body: paragraphLinesToPortable(PLAIN.gratitude.paragraphs, 'gratitude'),
    },
    shareStory: PLAIN.shareStory,
    graduateImage: PLAIN.graduateImage,
    circleImage: PLAIN.circleImage,
    supportDonate: PLAIN.supportDonate,
    paypal: PLAIN.paypal,
    stripe: PLAIN.stripe,
  }
}

function mergeFromCms(cms: CmsDonateToEmpowermentContent, base: DonateToEmpowermentContent): DonateToEmpowermentContent {
  return {
    ...base,
    hero: {
      ...base.hero,
      eyebrow: cms.heroEyebrow?.trim() || base.hero.eyebrow,
      subtitle: cms.heroSubtitle?.trim() || base.hero.subtitle,
    },
    helpChangeLives: {
      heading: cms.helpChangeLivesHeading?.trim() || base.helpChangeLives.heading,
      subheading: (() => {
        const heroSubtitle = cms.heroSubtitle?.trim() || base.hero.subtitle
        const sub = resolvePortableParagraph(
          cms.helpChangeLivesSubheading,
          PLAIN.helpChangeLives.subheading,
          'help-sub',
        )
        const subPlain = portableToPlainText(sub).trim()
        if (!subPlain || subPlain === heroSubtitle.trim()) return []
        return sub
      })(),
      nonprofitNote: resolvePortableParagraph(cms.nonprofitNote, PLAIN.helpChangeLives.nonprofitNote, 'nonprofit'),
    },
    openingQuote: mergeQuote(cms.openingQuote, base.openingQuote),
    openingBody: resolvePortableBody(
      cms.openingBody,
      portableToPlainParagraphs(cms.openingBody).length ? portableToPlainParagraphs(cms.openingBody) : PLAIN.openingParagraphs,
      'opening',
    ),
    whyPrevention: {
      heading: cms.whyPreventionHeading?.trim() || base.whyPrevention.heading,
      quote: mergeQuote(cms.whyPreventionQuote, base.whyPrevention.quote),
      body: resolvePortableParagraph(cms.whyPreventionBody, PLAIN.whyPrevention.body, 'why-prev'),
    },
    preparedness: {
      heading: cms.preparednessHeading?.trim() || base.preparedness.heading,
      body: isPortableWithContent(cms.preparednessBody) ? cms.preparednessBody! : base.preparedness.body,
      quote: mergeQuote(cms.preparednessQuote, base.preparedness.quote),
      tagline: cms.preparednessTagline?.trim() || base.preparedness.tagline,
    },
    tiers: mergeTiers(cms.tiers, base.tiers),
    directSupport: {
      heading: cms.directSupportHeading?.trim() || base.directSupport.heading,
      intro: resolvePortableParagraph(cms.directSupportIntro, PLAIN.directSupport.intro, 'direct-intro'),
      options: mergeSupportOptions(cms.directSupportOptions, base.directSupport.options),
    },
    recipientAcknowledgment: {
      heading: cms.recipientAcknowledgmentHeading?.trim() || base.recipientAcknowledgment.heading,
      intro: resolvePortableParagraph(
        cms.recipientAcknowledgmentIntro,
        PLAIN.recipientAcknowledgment.intro,
        'recipient-intro',
      ),
      options: mergeAckOptions(cms.recipientAcknowledgmentOptions, base.recipientAcknowledgment.options),
    },
    guardians: {
      heading: cms.guardiansHeading?.trim() || base.guardians.heading,
      body: resolvePortableParagraph(cms.guardiansBody, PLAIN.guardians.body, 'guardians'),
    },
    survivorsToThrivers: {
      heading: cms.survivorsHeading?.trim() || base.survivorsToThrivers.heading,
      body: resolvePortableParagraph(cms.survivorsBody, PLAIN.survivorsToThrivers.body, 'survivors'),
      quote: mergeQuote(cms.survivorsQuote, base.survivorsToThrivers.quote),
    },
    since1971: {
      heading: cms.since1971Heading?.trim() || base.since1971.heading,
      body: resolvePortableParagraph(cms.since1971Body, PLAIN.since1971.body, 'since1971'),
      quote: mergeQuote(cms.since1971Quote, base.since1971.quote),
    },
    graduateImage: cmsDonateImage(cms.graduateImage, base.graduateImage),
    circleImage: cmsDonateImage(cms.circleImage, base.circleImage),
    supportDonate: {
      title: cms.supportDonateTitle?.trim() || base.supportDonate.title,
      intro: cms.supportDonateIntro?.trim() || base.supportDonate.intro,
      footnote: cms.supportDonateFootnote?.trim() || base.supportDonate.footnote,
    },
    paypal: {
      hostedButtonId: cms.paypalHostedButtonId?.trim() || base.paypal.hostedButtonId,
      imageSrc: cms.paypalImageSrc?.trim() || base.paypal.imageSrc,
      imageAlt: cms.paypalImageAlt?.trim() || base.paypal.imageAlt,
      imageWidth: base.paypal.imageWidth,
      imageHeight: base.paypal.imageHeight,
    },
    stripe: {
      href: normalizeStripeCheckoutHref(cms.stripeHref?.trim() || base.stripe.href),
      label: cms.stripeLabel?.trim() || base.stripe.label,
      imageSrc: cms.stripeImageSrc?.trim() || base.stripe.imageSrc,
      imageAlt: cms.stripeImageAlt?.trim() || base.stripe.imageAlt,
      imageWidth: base.stripe.imageWidth,
      imageHeight: base.stripe.imageHeight,
    },
    gratitude: {
      heading: cms.gratitudeHeading?.trim() || base.gratitude.heading,
      body: resolvePortableBody(
        cms.gratitudeBody,
        portableToPlainParagraphs(cms.gratitudeBody).length
          ? portableToPlainParagraphs(cms.gratitudeBody)
          : PLAIN.gratitude.paragraphs,
        'gratitude',
      ),
    },
    shareStory: {
      heading: cms.shareStoryHeading?.trim() || base.shareStory.heading,
      prompt: cms.shareStoryPrompt?.trim() || base.shareStory.prompt,
      href: cms.shareStoryHref?.trim() || base.shareStory.href,
      buttonLabel: cms.shareStoryButtonLabel?.trim() || base.shareStory.buttonLabel,
    },
  }
}

/** Merge Sanity donateToEmpowermentContent with code defaults (Donation Plan Layout-3). */
export function buildDonateToEmpowermentContent(
  cms: CmsPageDocument | null | undefined,
): DonateToEmpowermentContent {
  const base = defaultsToContent()
  if (!cms) return base

  const docTitle = cms.title?.trim() || base.hero.title
  let content = base

  if (cms.donateToEmpowermentContent && Object.keys(cms.donateToEmpowermentContent).length > 0) {
    content = mergeFromCms(cms.donateToEmpowermentContent, base)
  }

  return {
    ...content,
    seo: {
      metaTitle:
        cms.seo?.metaTitle?.trim() ||
        (docTitle ? `${docTitle.replace(/\s*\|\s*Model Mugging\s*$/i, '')} | Model Mugging` : base.seo.metaTitle),
      metaDescription: cms.seo?.metaDescription?.trim() || base.seo.metaDescription,
      keywords: cms.seo?.keywords?.length ? cms.seo.keywords : base.seo.keywords,
    },
    hero: {
      ...content.hero,
      title: docTitle,
    },
  }
}

export { DONATE_TO_EMPOWERMENT_ROUTE_PATH }
