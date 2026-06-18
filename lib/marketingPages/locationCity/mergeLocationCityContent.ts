import type { PortableTextBlock } from '@portabletext/react'

import type { CmsPageDocument } from '@/lib/sanity/types'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { isPortableWithContent } from '@/lib/marketingPages/mensBasicPortable'
import { resolvePortableBody, resolvePortableFromPlain } from '@/lib/marketingPages/locationCity/portable'

type CmsLocationCity = NonNullable<CmsPageDocument['locationCityContent']>

type CmsCta = {
  title?: string
  body?: PortableTextBlock[]
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

function mergeCtaBody(
  cmsBody: PortableTextBlock[] | undefined,
  baseBody: PortableTextBlock[] | undefined,
  basePlain: string | undefined,
  key: string,
): PortableTextBlock[] {
  return resolvePortableFromPlain(cmsBody, basePlain, key) || baseBody || []
}

function mapCtaBox(
  cms: CmsCta | null | undefined,
  base: {
    title: string
    body?: PortableTextBlock[]
    bodyPlain?: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel?: string
    secondaryHref?: string
  },
  key: string,
) {
  return {
    title: cms?.title ?? base.title,
    body: mergeCtaBody(cms?.body, base.body, base.bodyPlain, key),
    primaryLabel: cms?.primaryLabel ?? base.primaryLabel,
    primaryHref: cms?.primaryHref ?? base.primaryHref,
    secondaryLabel: cms?.secondaryLabel ?? base.secondaryLabel,
    secondaryHref: cms?.secondaryHref ?? base.secondaryHref,
  }
}

/** Merge CMS overrides onto code defaults for city location pages. */
export function mergeLocationCityContent(
  base: LocationCityPageContent,
  cms?: CmsLocationCity | null,
): LocationCityPageContent {
  if (!cms) return base

  const merged: LocationCityPageContent = { ...base }

  if (cms.heroTagline || cms.heroTitle || cms.heroLeadLine) {
    merged.hero = {
      ...base.hero,
      tagline: cms.heroTagline ?? base.hero.tagline,
      title: cms.heroTitle ?? base.hero.title,
      leadLine: cms.heroLeadLine ?? base.hero.leadLine,
    }
  }

  if (cms.registerSpotsHeadline) merged.registerSpotsHeadline = cms.registerSpotsHeadline

  if (cms.introVideo?.youtubeId) {
    merged.introVideo = {
      ...base.introVideo,
      youtubeId: cms.introVideo.youtubeId,
      title: cms.introVideo.title ?? base.introVideo?.title,
      quote: cms.introVideo.quote ?? base.introVideo?.quote,
    }
  }

  if (cms.secondVideo?.youtubeId) {
    merged.secondVideo = {
      ...base.secondVideo,
      youtubeId: cms.secondVideo.youtubeId,
      title: cms.secondVideo.title ?? base.secondVideo?.title,
      quote: cms.secondVideo.quote ?? base.secondVideo?.quote,
    }
  }

  if (cms.eventsSectionTitle) merged.eventsSectionTitle = cms.eventsSectionTitle
  if (cms.eventsSubtitle) merged.eventsSubtitle = cms.eventsSubtitle
  if (cms.weekendCourseTitle || cms.weekdayCourseTitle || cms.eventsEmptyMessage) {
    merged.events = {
      ...base.events,
      weekendTitle: cms.weekendCourseTitle ?? base.events.weekendTitle,
      weekdayTitle: cms.weekdayCourseTitle ?? base.events.weekdayTitle,
      emptyMessage: cms.eventsEmptyMessage ?? base.events.emptyMessage,
    }
  }

  if (
    cms.courseOverviewHeading ||
    cms.dayOne?.heading ||
    cms.dayOne?.items?.length ||
    cms.dayTwo?.heading ||
    cms.dayTwo?.items?.length
  ) {
    merged.courseOverview = {
      ...base.courseOverview,
      heading: cms.courseOverviewHeading ?? base.courseOverview.heading,
    }
    if (cms.dayOne?.items?.length) {
      merged.dayOne = {
        heading: cms.dayOne.heading ?? base.dayOne.heading,
        items: cms.dayOne.items,
      }
    }
    if (cms.dayTwo?.items?.length) {
      merged.dayTwo = {
        heading: cms.dayTwo.heading ?? base.dayTwo.heading,
        items: cms.dayTwo.items,
      }
    }
  }

  if (cms.whyUnique?.title || cms.whyUnique?.body?.length || cms.whyUnique?.lines?.length) {
    merged.whyUnique = {
      title: cms.whyUnique.title ?? base.whyUnique.title,
      body: resolvePortableBody(
        cms.whyUnique.body,
        cms.whyUnique.lines?.length ? cms.whyUnique.lines : base.whyUnique.lines,
        'cms-why-unique',
      ),
      registerLabel: cms.whyUnique.registerLabel ?? base.whyUnique.registerLabel,
      registerHref: cms.whyUnique.registerHref ?? base.whyUnique.registerHref,
    }
  }

  if (cms.retreatBox || cms.retreatBoxEnabled !== undefined) {
    merged.retreatBox = {
      enabled: cms.retreatBoxEnabled ?? base.retreatBox?.enabled ?? false,
      title: cms.retreatBox?.title ?? base.retreatBox?.title ?? '',
      body: mergeCtaBody(
        cms.retreatBox?.body,
        base.retreatBox?.body,
        base.retreatBox?.bodyPlain,
        'cms-retreat-box',
      ),
      primaryLabel: cms.retreatBox?.primaryLabel ?? base.retreatBox?.primaryLabel ?? '',
      primaryHref: cms.retreatBox?.primaryHref ?? base.retreatBox?.primaryHref ?? '',
      locations: base.retreatBox?.locations,
    }
  }

  if (cms.subscribeInvite?.title) {
    merged.subscribeInvite = {
      title: cms.subscribeInvite.title,
      body: mergeCtaBody(
        cms.subscribeInvite.body,
        base.subscribeInvite.body,
        base.subscribeInvite.bodyPlain,
        'cms-subscribe',
      ),
      ctaLabel: cms.subscribeInvite.primaryLabel ?? base.subscribeInvite.ctaLabel,
      ctaHref: cms.subscribeInvite.primaryHref ?? base.subscribeInvite.ctaHref,
    }
  }

  if (cms.marketingSections?.length) {
    const baseSections = base.marketingSections ?? []
    merged.marketingSections = cms.marketingSections.map((s, i) => {
      const baseSec =
        baseSections.find((b) => b.heading && b.heading === s.heading) ?? baseSections[i]
      const content = resolvePortableBody(
        isPortableWithContent(s.body) ? s.body : undefined,
        baseSec?.paragraphs,
        `cms-mkt-${i}`,
      )
      return {
        heading: s.heading ?? baseSec?.heading ?? '',
        content,
        paragraphs: baseSec?.paragraphs,
        collapsedByDefault: baseSec?.collapsedByDefault,
        imageSrc: s.imageSrc ?? baseSec?.imageSrc,
        imageAlt: s.imageAlt ?? baseSec?.imageAlt,
      }
    })
  }

  if (cms.elevenWaysTitle || cms.elevenWaysSubtitle?.length || cms.elevenWaysItems?.length) {
    const baseItems = base.elevenWays?.items ?? []
    merged.elevenWays = {
      title: cms.elevenWaysTitle ?? base.elevenWays?.title ?? '',
      subtitle: resolvePortableFromPlain(
        cms.elevenWaysSubtitle,
        base.elevenWays?.subtitlePlain,
        'cms-11-sub',
      ),
      collapsedByDefault: base.elevenWays?.collapsedByDefault,
      items:
        cms.elevenWaysItems?.map((item, i) => ({
          title: item.title ?? '',
          description: resolvePortableFromPlain(
            item.description,
            baseItems[i]?.descriptionPlain,
            `cms-11-${i}`,
          ),
        })) ?? baseItems,
    }
  }

  if (cms.midCta?.title && base.midCta) {
    merged.midCta = mapCtaBox(cms.midCta, base.midCta, 'cms-mid-cta')
  }

  if (cms.retreatCta?.title && base.retreatCta) {
    merged.retreatCta = mapCtaBox(cms.retreatCta, base.retreatCta, 'cms-retreat-cta')
  }

  if (cms.reclaimPowerCta?.title && base.reclaimPowerCta) {
    const rp = mapCtaBox(cms.reclaimPowerCta, { ...base.reclaimPowerCta, bodyPlain: undefined }, 'cms-reclaim')
    merged.reclaimPowerCta = {
      title: rp.title,
      body: rp.body,
      primaryLabel: rp.primaryLabel,
      primaryHref: rp.primaryHref,
    }
  }

  if (cms.graduateTestimonialsTitle) {
    merged.graduateTestimonialsTitle = cms.graduateTestimonialsTitle
  }
  if (cms.graduateTestimonials?.length) {
    merged.graduateTestimonials = cms.graduateTestimonials
      .filter((t) => t.quote)
      .map((t) => ({ quote: t.quote!, anchorId: t.anchorId }))
  }

  if (cms.localSeoHeading || cms.localSeoBody?.length) {
    merged.localSeo = {
      heading: cms.localSeoHeading ?? base.localSeo.heading,
      body: resolvePortableBody(cms.localSeoBody, base.localSeo.paragraphs, 'cms-local-seo'),
    }
  }

  if (cms.footerCta?.title) {
    merged.footerCta = mapCtaBox(cms.footerCta, base.footerCta, 'cms-footer-cta')
  }

  if (cms.faq?.length) {
    merged.faq = cms.faq
      .filter((item) => item.question)
      .map((item, i) => ({
        question: item.question!,
        answer: resolvePortableFromPlain(item.answer, base.faq[i]?.answerPlain, `cms-faq-${i}`),
      }))
  }

  if (cms.donate) {
    const paypal = base.donate.buttons.find(
      (b) => b.imageSrc?.includes('paypal') || b.label.toLowerCase().includes('paypal'),
    )
    const stripe = base.donate.buttons.find((b) => b.label.toLowerCase().includes('stripe'))
    merged.donate = {
      ...base.donate,
      title: cms.donate.title ?? base.donate.title,
      nonprofitSubtitle: cms.donate.nonprofitSubtitle ?? base.donate.nonprofitSubtitle,
      intro: resolvePortableFromPlain(cms.donate.intro, base.donate.introPlain, 'cms-donate-intro'),
      footnote: cms.donate.footnote?.length
        ? resolvePortableFromPlain(cms.donate.footnote, base.donate.footnotePlain, 'cms-donate-fn')
        : base.donate.footnote,
      buttons: [
        paypal
          ? {
              ...paypal,
              imageSrc: cms.donate.paypalImageSrc ?? paypal.imageSrc,
            }
          : base.donate.buttons[0],
        stripe
          ? {
              ...stripe,
              imageSrc: cms.donate.stripeImageSrc ?? stripe.imageSrc,
            }
          : base.donate.buttons[1],
      ].filter(Boolean) as LocationCityPageContent['donate']['buttons'],
    }
  }

  if (cms.defendTimeAndMoneyPromo?.href || cms.podcastPromo?.href) {
    merged.bottomPromoBoxes = {
      defendTimeAndMoney: cms.defendTimeAndMoneyPromo?.href
        ? {
            title: cms.defendTimeAndMoneyPromo.title ?? '',
            body: resolvePortableFromPlain(
              cms.defendTimeAndMoneyPromo.body,
              base.bottomPromoBoxes?.defendTimeAndMoney?.bodyPlain,
              'cms-promo-dtm',
            ),
            href: cms.defendTimeAndMoneyPromo.href,
            ctaLabel: cms.defendTimeAndMoneyPromo.ctaLabel,
          }
        : base.bottomPromoBoxes?.defendTimeAndMoney,
      podcast: cms.podcastPromo?.href
        ? {
            title: cms.podcastPromo.title ?? '',
            body: resolvePortableFromPlain(
              cms.podcastPromo.body,
              base.bottomPromoBoxes?.podcast?.bodyPlain,
              'cms-promo-pod',
            ),
            href: cms.podcastPromo.href,
            ctaLabel: cms.podcastPromo.ctaLabel,
            imageSrc: cms.podcastPromo.imageSrc,
            imageAlt: cms.podcastPromo.imageAlt,
          }
        : base.bottomPromoBoxes?.podcast,
    }
  }

  return merged
}
