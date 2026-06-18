import Link from 'next/link'
import { formatTitleCase } from '@/lib/formatTitleCase'
import { HubLinksPresetContent } from '@/components/site/HubLinksPreset'
import { urlForImage } from '@/lib/sanity/image'
import { SHOW_PAGE_CTA_SECTION } from '@/lib/sanity/cmsVisibility'
import type { CmsHubLinksSection, CmsSection } from '@/lib/sanity/types'
import { RichTextSectionWithOptionalImage } from './RichTextSectionWithOptionalImage'

export function CmsSectionBlocks({ sections }: { sections: CmsSection[] }) {
  return (
    <>
      {sections.map((section, idx) => {
        const k = section._key || `${section._type}-${idx}`
        switch (section._type) {
          case 'mediaBannerSection': {
            const imageUrl = section.image ? urlForImage(section.image, { width: 1600, height: 700, fit: 'crop' }) : undefined
            return (
              <section key={k} className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white">
                <div
                  className="relative bg-cover bg-center px-6 py-12 sm:px-10 sm:py-16"
                  style={
                    imageUrl
                      ? {
                          backgroundImage: `linear-gradient(120deg, rgba(2,6,23,0.78), rgba(15,23,42,0.55)), url(${imageUrl})`,
                        }
                      : undefined
                  }
                >
                  {section.eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">{section.eyebrow}</p>
                  ) : null}
                  <h2 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
                    {section.title}
                  </h2>
                  {section.subtitle ? <p className="mt-3 max-w-2xl text-sm text-slate-100 sm:text-base">{section.subtitle}</p> : null}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {section.primaryLabel && section.primaryHref ? (
                      <Link
                        href={section.primaryHref}
                        className="inline-flex rounded-xl bg-[#00d4aa] px-5 py-2.5 text-sm font-bold text-[#06211a] hover:bg-[#52e7c6]"
                      >
                        {section.primaryLabel}
                      </Link>
                    ) : null}
                    {section.secondaryLabel && section.secondaryHref ? (
                      <Link
                        href={section.secondaryHref}
                        className="inline-flex rounded-xl border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:border-white"
                      >
                        {section.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            )
          }
          case 'splitMediaSection': {
            const imageUrl = section.image ? urlForImage(section.image, { width: 1200, height: 900, fit: 'crop' }) : undefined
            const imageFirst = section.imagePosition === 'left'
            return (
              <section key={k} className="mb-12 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
                <div
                  className={
                    imageUrl
                      ? `grid gap-6 md:grid-cols-2 ${imageFirst ? '' : 'md:[&>*:first-child]:order-2'}`
                      : 'grid gap-6'
                  }
                >
                  {imageUrl ? (
                    <div className="h-full overflow-hidden rounded-2xl bg-slate-100">
                      <img src={imageUrl} alt={section.image?.alt || section.title || 'Section image'} className="h-full min-h-64 w-full object-cover" />
                    </div>
                  ) : null}
                  <div>
                    {section.eyebrow ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{section.eyebrow}</p>
                    ) : null}
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 sm:text-3xl">
                      {section.title}
                    </h2>
                    {section.body ? <p className="mt-3 whitespace-pre-line text-slate-700">{section.body}</p> : null}
                    {section.points?.length ? (
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {section.points.filter(Boolean).map((point, pidx) => (
                          <li key={`${k}-point-${pidx}`} className="flex gap-2">
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-teal-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {section.primaryLabel && section.primaryHref ? (
                        <Link
                          href={section.primaryHref}
                          className="inline-flex rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
                        >
                          {section.primaryLabel}
                        </Link>
                      ) : null}
                      {section.secondaryLabel && section.secondaryHref ? (
                        <Link
                          href={section.secondaryHref}
                          className="inline-flex rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-teal-500"
                        >
                          {section.secondaryLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            )
          }
          case 'imageCardsSection':
            return (
              <section key={k} className="mb-12 scroll-mt-24">
                {section.title ? (
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 sm:text-3xl">
                    {section.title}
                  </h2>
                ) : null}
                {section.subtitle ? <p className="mt-3 max-w-3xl text-slate-700">{section.subtitle}</p> : null}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(section.cards ?? []).map((card, cidx) => {
                    const imageUrl = card.image ? urlForImage(card.image, { width: 900, height: 540, fit: 'crop' }) : undefined
                    return (
                      <article key={card._key || `${k}-card-${cidx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {imageUrl ? <img src={imageUrl} alt={card.image?.alt || card.title || 'Card image'} className="h-44 w-full object-cover" /> : null}
                        <div className="p-5">
                          <h3 className="font-semibold text-slate-900">{card.title}</h3>
                          {card.description ? <p className="mt-2 text-sm text-slate-700">{card.description}</p> : null}
                          {card.href ? (
                            <Link href={card.href} className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:underline">
                              {formatTitleCase(card.linkLabel || 'Learn more')}
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          case 'richTextSection': {
            return (
              <RichTextSectionWithOptionalImage
                key={k}
                heading={section.heading}
                content={section.content}
                paragraphRows={section.paragraphRows}
                image={section.image}
                imageLayout={section.imageLayout}
              />
            )
          }
          case 'faqSection':
            return (
              <section key={k} className="mb-10 scroll-mt-24">
                {section.title ? (
                  <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                    {section.title}
                  </h2>
                ) : null}
                <div className="space-y-3">
                  {(section.items ?? []).map((item, i) => (
                    <details
                      key={`${k}-${i}`}
                      className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm open:shadow-md"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-2">
                          {item.question}
                          <span className="text-teal-600 transition group-open:rotate-180">▼</span>
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )
          case 'ctaSection':
            if (!SHOW_PAGE_CTA_SECTION) return null
            return (
              <section
                key={k}
                className="mb-10 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white px-6 py-8"
              >
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
                  {section.title}
                </h2>
                {section.body ? <p className="mt-3 text-slate-700">{section.body}</p> : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  {section.primaryLabel && section.primaryHref ? (
                    <Link
                      href={section.primaryHref}
                      className="inline-flex rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00d4aa] hover:text-[#0f172a]"
                    >
                      {section.primaryLabel}
                    </Link>
                  ) : null}
                  {section.secondaryLabel && section.secondaryHref ? (
                    <Link
                      href={section.secondaryHref}
                      className="inline-flex rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-teal-500"
                    >
                      {section.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </section>
            )
          case 'hubLinksSection': {
            const h = section as CmsHubLinksSection
            return <HubLinksPresetContent key={k} hubLinksSection={h} />
          }
          default:
            return null
        }
      })}
    </>
  )
}
