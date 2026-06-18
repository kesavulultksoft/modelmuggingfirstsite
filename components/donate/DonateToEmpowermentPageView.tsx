import Image from 'next/image'
import Link from 'next/link'
import { ArticleFooterNav } from '@/components/site/ArticleFooterNav'
import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'
import JsonLd from '@/components/site/JsonLd'
import { canonicalPageUrl } from '@/lib/canonicalUrl'
import type { DonateToEmpowermentContent } from '@/lib/marketingPages/donateToEmpowerment/types'
import { isPortableWithContent } from '@/lib/marketingPages/mensBasicPortable'
import { DonatePortableBody } from './DonatePortableBody'
import { DonateQuoteBlock } from './DonateQuoteBlock'
import { DonateContributionTiers } from './DonateContributionTiers'

export function DonateToEmpowermentPageView({
  content,
  siteUrl,
}: {
  content: DonateToEmpowermentContent
  siteUrl: string
}) {
  const path = content.routePath
  const url = canonicalPageUrl(siteUrl, path)

  const articleJson = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: content.hero.title,
    description: content.seo.metaDescription,
    url,
    publisher: { '@type': 'Organization', name: 'Model Mugging', url: siteUrl },
  }

  return (
    <div>
      <JsonLd data={articleJson} />
      <PageHero
        maxWidth="7xl"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        subtitle={content.hero.subtitle}
        back={content.hero.back}
        showEyebrow={Boolean(content.hero.eyebrow.trim())}
      />
      <SiteMain>
        <article itemScope itemType="https://schema.org/WebPage" className="max-w-4xl">
          <meta itemProp="name" content={content.hero.title} />

          <section className="mb-10 scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 sm:text-3xl">
              {content.helpChangeLives.heading}
            </h2>
            {isPortableWithContent(content.helpChangeLives.subheading) ? (
              <DonatePortableBody
                value={content.helpChangeLives.subheading}
                className="prose-site mt-3 max-w-none text-base text-slate-700"
              />
            ) : null}
            <DonatePortableBody
              value={content.helpChangeLives.nonprofitNote}
              className="prose-site mt-3 max-w-none text-base text-slate-700"
            />
            <DonateQuoteBlock quote={content.openingQuote} />
            <DonatePortableBody value={content.openingBody} />
          </section>

          <section className="mb-10 scroll-mt-24">
            <div className="grid gap-8 md:grid-cols-2 md:items-start">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                  {content.whyPrevention.heading}
                </h2>
                <DonateQuoteBlock quote={content.whyPrevention.quote} />
                <DonatePortableBody value={content.whyPrevention.body} className="prose-site max-w-none text-slate-700" />
              </div>
              <figure className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:p-4">
                <div className="flex justify-center">
                  <Image
                    src={content.graduateImage.src}
                    alt={content.graduateImage.alt}
                    width={400}
                    height={533}
                    className="h-auto w-full max-w-[min(100%,320px)] object-contain sm:max-w-[360px]"
                    sizes="(max-width: 768px) 320px, 360px"
                  />
                </div>
                <figcaption className="mt-3 px-1 text-center text-sm italic text-slate-600">
                  {content.graduateImage.caption}
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="mb-10 scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {content.preparedness.heading}
            </h2>
            <DonatePortableBody value={content.preparedness.body} className="prose-site mt-3 max-w-none text-slate-700" />
            <p className="mt-4 font-semibold text-[#1f497d]">{content.preparedness.tagline}</p>
            <DonateQuoteBlock quote={content.preparedness.quote} />
          </section>

          <DonateContributionTiers
            tiers={content.tiers}
            directSupport={content.directSupport}
            recipientAcknowledgment={content.recipientAcknowledgment}
            supportDonate={content.supportDonate}
            paypal={content.paypal}
            stripe={content.stripe}
          />

          <section
            id="guardians"
            className="mb-10 scroll-mt-24 rounded-xl border border-[#1f497d]/15 bg-slate-50/90 p-5 sm:p-6"
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {content.guardians.heading}
            </h2>
            <DonatePortableBody value={content.guardians.body} className="prose-site mt-3 max-w-none text-slate-700" />
          </section>

          <section className="mb-10 scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {content.survivorsToThrivers.heading}
            </h2>
            <DonatePortableBody value={content.survivorsToThrivers.body} className="prose-site mt-3 max-w-none text-slate-700" />
            <DonateQuoteBlock quote={content.survivorsToThrivers.quote} />
          </section>

          <section className="mb-10 scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {content.since1971.heading}
            </h2>
            <DonatePortableBody value={content.since1971.body} className="prose-site mt-3 max-w-none text-slate-700" />
            <DonateQuoteBlock quote={content.since1971.quote} />
          </section>

          <section className="mb-10 flex justify-center scroll-mt-24">
            <figure className="max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="relative aspect-[4/3] w-full min-w-[280px]">
                <Image
                  src={content.circleImage.src}
                  alt={content.circleImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 576px"
                />
              </div>
              <figcaption className="px-4 py-3 text-center text-sm italic text-slate-600">
                {content.circleImage.caption}
              </figcaption>
            </figure>
          </section>

          <section className="mb-10 scroll-mt-24 rounded-xl border border-[#1f497d]/15 bg-slate-50/90 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {content.gratitude.heading}
            </h2>
            <DonatePortableBody value={content.gratitude.body} className="prose-site mt-3 max-w-none text-slate-700" />
          </section>

          <section className="mb-12 scroll-mt-24 rounded-2xl border border-[#1da1f2]/30 bg-gradient-to-br from-sky-50/90 to-white p-6 text-center shadow-sm sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900 sm:text-2xl">
              {content.shareStory.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-700">{content.shareStory.prompt}</p>
            <Link
              href={content.shareStory.href}
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#1f497d] px-8 py-3 text-base font-bold text-white shadow-md transition hover:bg-[#163a61]"
            >
              {content.shareStory.buttonLabel}
            </Link>
          </section>

          <ArticleFooterNav includeTrainerApplication={false} />
        </article>
      </SiteMain>
    </div>
  )
}
