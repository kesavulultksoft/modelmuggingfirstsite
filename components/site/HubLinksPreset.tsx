import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { CmsHubLinksSection, CmsImageField, HubLinksPreset } from '@/lib/sanity/types'
import {
  DEFEND_TIME_HUB_PAGE_BUCKETS,
  HUB_BUCKET_FALLBACK_IMAGES,
  KNOWLEDGE_CENTER_HUB_PAGE_BUCKETS,
  MEDIA_HUB_PAGE_BUCKETS,
  type HubPageResourceBucket,
  OVERVIEW_LOCATIONS_BUCKET,
  OVERVIEW_TESTIMONIALS_BUCKET,
  OVERVIEW_TRAINING_OFFERED_BUCKET,
  SAFETY_COLLECTIVE_HUB_PAGE_BUCKETS,
} from '@/components/site/siteMarketingLinks'
import type { NavChild } from '@/components/site/siteMarketingLinks'
import { urlForImage } from '@/lib/sanity/image'
import { formatTitleCase } from '@/lib/formatTitleCase'

export type TrainingOverviewImagesInput = {
  trainingOfferedImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  locationsScheduleImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
  testimonialsImage?: { asset?: { _ref?: string; _id?: string }; alt?: string }
}

type HubLinksPresetProps = {
  /** Full Sanity hub section (preferred — includes optional bucket header images). */
  hubLinksSection?: CmsHubLinksSection
  /** Migrated / non-CMS pages: preset only. */
  preset?: HubLinksPreset
  title?: string
  /** @deprecated use hubLinksSection for CMS pages */
  trainingOverviewImages?: TrainingOverviewImagesInput
}

export function HubLinksPresetContent(props: HubLinksPresetProps) {
  const { hubLinksSection, preset: presetProp, title: titleProp, trainingOverviewImages: legacyImages } = props

  const preset = hubLinksSection?.preset ?? presetProp
  const title = hubLinksSection?.title?.trim() || titleProp

  if (!preset) return null

  const trainingOverviewImages = hubLinksSection
    ? {
        trainingOfferedImage: hubLinksSection.trainingOfferedImage,
        locationsScheduleImage: hubLinksSection.locationsScheduleImage,
        testimonialsImage: hubLinksSection.testimonialsImage,
      }
    : legacyImages

  return (
    <section className="hub-resource-section mt-12 scroll-mt-24 border-t border-slate-200/90 pt-10">
      {title ? (
        <h2 className="mb-8 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {formatTitleCase(title)}
        </h2>
      ) : null}

      {preset === 'trainingProgramOverview' ? (
        <TrainingOverviewBuckets trainingOverviewImages={trainingOverviewImages} />
      ) : null}

      {preset === 'defendTimeAndMoney' ? (
        <PresetHubBuckets
          buckets={DEFEND_TIME_HUB_PAGE_BUCKETS}
          cmsImages={[
            hubLinksSection?.defendPlanningImage,
            hubLinksSection?.defendSeriesImage,
          ]}
        />
      ) : null}

      {preset === 'mediaAndProducts' ? (
        <PresetHubBuckets
          buckets={MEDIA_HUB_PAGE_BUCKETS}
          cmsImages={[hubLinksSection?.mediaPodcastImage, hubLinksSection?.mediaVideosImage]}
        />
      ) : null}

      {preset === 'safetyCollective' ? (
        <PresetHubBuckets
          buckets={SAFETY_COLLECTIVE_HUB_PAGE_BUCKETS}
          cmsImages={[
            hubLinksSection?.collectiveGiveImage,
            hubLinksSection?.collectiveStayImage,
            hubLinksSection?.collectiveContactImage,
          ]}
        />
      ) : null}

      {preset === 'knowledgeCenter' ? (
        <PresetHubBuckets
          buckets={KNOWLEDGE_CENTER_HUB_PAGE_BUCKETS}
          cmsImages={[
            hubLinksSection?.knowledgeFoundationImage,
            hubLinksSection?.knowledgeChoicesImage,
            hubLinksSection?.knowledgeReadingImage,
          ]}
        />
      ) : null}
    </section>
  )
}

function BucketCard({
  title,
  imageSrc,
  imageAlt,
  links,
}: {
  title: string
  imageSrc: string
  imageAlt: string
  links: NavChild[]
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-teal-300/60 hover:shadow-[0_14px_34px_-16px_rgba(13,148,136,0.2)]">
      <div className="relative h-36 border-b border-slate-200/80 bg-slate-900">
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover opacity-[0.82]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 via-[#0f172a]/28 to-[#0f172a]/0" />
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00d4aa] via-teal-500 to-[#0f172a] opacity-90 transition group-hover:opacity-100"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="inline-flex max-w-full rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 font-[family-name:var(--font-display)] text-[1.2rem] font-bold tracking-tight text-white backdrop-blur-sm">
            {title}
          </h3>
        </div>
      </div>
      <ul role="list" className="m-0 space-y-1.5 p-4">
        {links.map((link) => (
          <li key={`${title}-${link.href}`} className="list-none">
            <Link
              href={link.href}
              className="group/link flex items-start gap-2.5 rounded-md px-1 py-1 text-[0.99rem] font-semibold leading-snug text-slate-800 transition duration-200 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/45"
            >
              <span
                className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500/80 transition group-hover/link:bg-teal-600"
                aria-hidden
              />
              <span className="min-w-0 flex-1 underline-offset-2 group-hover/link:underline">
                {formatTitleCase(link.label)}
              </span>
              <ChevronRight
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-teal-600"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}

function bucketSrc(cms: CmsImageField | undefined, index: number): string {
  return (
    urlForImage(cms, {
      width: 1200,
      height: 500,
      fit: 'crop',
    }) ?? HUB_BUCKET_FALLBACK_IMAGES[index % HUB_BUCKET_FALLBACK_IMAGES.length]
  )
}

function PresetHubBuckets({
  buckets,
  cmsImages,
}: {
  buckets: HubPageResourceBucket[]
  cmsImages: (CmsImageField | undefined)[]
}) {
  const cols = buckets.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  return (
    <div className={`grid gap-5 ${cols}`}>
      {buckets.map((bucket, i) => (
        <BucketCard
          key={bucket.title}
          title={bucket.title}
          imageSrc={bucketSrc(cmsImages[i], i)}
          imageAlt={cmsImages[i]?.alt || `${bucket.title} — resource links`}
          links={bucket.links}
        />
      ))}
    </div>
  )
}

function TrainingOverviewBuckets({
  trainingOverviewImages,
}: {
  trainingOverviewImages?: TrainingOverviewImagesInput
}) {
  const trainingOfferedSrc =
    urlForImage(trainingOverviewImages?.trainingOfferedImage, {
      width: 1200,
      height: 500,
      fit: 'crop',
    }) ?? '/hub/training-offered.svg'
  const locationsScheduleSrc =
    urlForImage(trainingOverviewImages?.locationsScheduleImage, {
      width: 1200,
      height: 500,
      fit: 'crop',
    }) ?? '/hub/locations-schedule.svg'
  const testimonialsSrc =
    urlForImage(trainingOverviewImages?.testimonialsImage, {
      width: 1200,
      height: 500,
      fit: 'crop',
    }) ?? '/hub/testimonials.svg'

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <BucketCard
        title="Training Offered"
        imageSrc={trainingOfferedSrc}
        imageAlt={trainingOverviewImages?.trainingOfferedImage?.alt || 'Training offered bucket image'}
        links={OVERVIEW_TRAINING_OFFERED_BUCKET}
      />
      <BucketCard
        title="Locations & Schedule"
        imageSrc={locationsScheduleSrc}
        imageAlt={
          trainingOverviewImages?.locationsScheduleImage?.alt ||
          'Locations and schedule bucket image'
        }
        links={OVERVIEW_LOCATIONS_BUCKET}
      />
      <BucketCard
        title="Testimonials"
        imageSrc={testimonialsSrc}
        imageAlt={trainingOverviewImages?.testimonialsImage?.alt || 'Testimonials bucket image'}
        links={OVERVIEW_TESTIMONIALS_BUCKET}
      />
    </div>
  )
}
