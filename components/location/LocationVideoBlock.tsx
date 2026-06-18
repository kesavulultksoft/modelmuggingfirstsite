import { LocationYouTubeEmbed } from '@/components/location/LocationYouTubeEmbed'
import { LocationQuoteBlock } from '@/components/location/LocationQuoteBlock'
import { formatLocationLabel } from '@/components/location/locationText'

/** Always-visible video + optional quote (no toggle — per client layout). */
export function LocationVideoBlock({
  youtubeId,
  title,
  quote,
}: {
  youtubeId: string
  title?: string
  quote?: string
}) {
  return (
    <section className="scroll-mt-24 space-y-4">
      {title ? (
        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900 sm:text-xl">
          {formatLocationLabel(title)}
        </h3>
      ) : null}
      <LocationYouTubeEmbed youtubeId={youtubeId} title={title || 'Model Mugging training video'} />
      {quote ? <LocationQuoteBlock quote={quote} /> : null}
    </section>
  )
}
