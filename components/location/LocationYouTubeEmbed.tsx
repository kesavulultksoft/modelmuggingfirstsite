export function LocationYouTubeEmbed({
  youtubeId,
  title,
}: {
  youtubeId: string
  title: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
      <div className="aspect-video w-full">
        <iframe
          title={title}
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
