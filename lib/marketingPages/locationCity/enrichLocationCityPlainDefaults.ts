import type { PortableTextBlock } from '@portabletext/react'

import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'
import { resolvePortableBody, resolvePortableFromPlain } from '@/lib/marketingPages/locationCity/portable'

function ctaBody(
  blocks: PortableTextBlock[] | undefined,
  plain: string | undefined,
  key: string,
): PortableTextBlock[] {
  return resolvePortableFromPlain(blocks, plain, key)
}

/** Turn code-default plain strings into portable text blocks for rendering. */
export function enrichLocationCityPlainDefaults(
  page: LocationCityPageContent,
): LocationCityPageContent {
  return {
    ...page,
    marketingSections: page.marketingSections?.map((s, i) => ({
      ...s,
      content: resolvePortableBody(s.content, s.paragraphs, `sd-mkt-${i}`),
    })),
    elevenWays: page.elevenWays
      ? {
          ...page.elevenWays,
          subtitle: resolvePortableFromPlain(
            page.elevenWays.subtitle,
            page.elevenWays.subtitlePlain,
            'sd-11-sub',
          ),
          items: page.elevenWays.items.map((item, i) => ({
            title: item.title,
            description: resolvePortableFromPlain(
              item.description,
              item.descriptionPlain,
              `sd-11-${i}`,
            ),
          })),
        }
      : page.elevenWays,
    retreatBox: page.retreatBox
      ? {
          ...page.retreatBox,
          body: ctaBody(page.retreatBox.body, page.retreatBox.bodyPlain, 'sd-retreat'),
        }
      : page.retreatBox,
    subscribeInvite: {
      ...page.subscribeInvite,
      body: ctaBody(page.subscribeInvite.body, page.subscribeInvite.bodyPlain, 'sd-sub'),
    },
    whyUnique: {
      ...page.whyUnique,
      body: resolvePortableBody(page.whyUnique.body, page.whyUnique.lines, 'sd-why'),
    },
    localSeo: {
      ...page.localSeo,
      body: resolvePortableBody(page.localSeo.body, page.localSeo.paragraphs, 'sd-seo'),
    },
    midCta: page.midCta
      ? { ...page.midCta, body: ctaBody(page.midCta.body, page.midCta.bodyPlain, 'sd-mid-cta') }
      : page.midCta,
    retreatCta: page.retreatCta
      ? {
          ...page.retreatCta,
          body: ctaBody(page.retreatCta.body, page.retreatCta.bodyPlain, 'sd-retreat-cta'),
        }
      : page.retreatCta,
    footerCta: {
      ...page.footerCta,
      body: ctaBody(page.footerCta.body, page.footerCta.bodyPlain, 'sd-footer-cta'),
    },
    donate: {
      ...page.donate,
      intro: resolvePortableFromPlain(page.donate.intro, page.donate.introPlain, 'sd-donate-intro'),
      footnote: page.donate.footnote
        ? resolvePortableFromPlain(page.donate.footnote, page.donate.footnotePlain, 'sd-donate-fn')
        : resolvePortableFromPlain(undefined, page.donate.footnotePlain, 'sd-donate-fn'),
    },
    faq: page.faq.map((item, i) => ({
      question: item.question,
      answer: resolvePortableFromPlain(item.answer, item.answerPlain, `sd-faq-${i}`),
    })),
    bottomPromoBoxes: page.bottomPromoBoxes
      ? {
          defendTimeAndMoney: page.bottomPromoBoxes.defendTimeAndMoney
            ? {
                ...page.bottomPromoBoxes.defendTimeAndMoney,
                body: ctaBody(
                  page.bottomPromoBoxes.defendTimeAndMoney.body,
                  page.bottomPromoBoxes.defendTimeAndMoney.bodyPlain,
                  'sd-promo-dtm',
                ),
              }
            : undefined,
          podcast: page.bottomPromoBoxes.podcast
            ? {
                ...page.bottomPromoBoxes.podcast,
                body: ctaBody(
                  page.bottomPromoBoxes.podcast.body,
                  page.bottomPromoBoxes.podcast.bodyPlain,
                  'sd-promo-pod',
                ),
              }
            : undefined,
        }
      : page.bottomPromoBoxes,
    infoBuckets: page.infoBuckets.map((b, i) => ({
      ...b,
      content: resolvePortableBody(b.content, b.paragraphs, `sd-bucket-${i}`),
    })),
    sidebar: page.sidebar?.guardians
      ? {
          ...page.sidebar,
          guardians: {
            ...page.sidebar.guardians,
            body: resolvePortableFromPlain(
              page.sidebar.guardians.body,
              page.sidebar.guardians.bodyPlain,
              'sd-sidebar-guardians',
            ),
          },
        }
      : page.sidebar,
  }
}
