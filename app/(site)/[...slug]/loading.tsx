import PageHero from '@/components/site/PageHero'
import SiteMain from '@/components/site/SiteMain'

export default function MigratedPageLoading() {
  return (
    <div>
      <PageHero
        maxWidth="7xl"
        eyebrow="Loading"
        title="Loading…"
        subtitle="Please wait."
      />
      <SiteMain>
        <div className="w-full max-w-2xl space-y-4" aria-hidden>
          <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-[94%] animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-[78%] animate-pulse rounded bg-slate-200" />
        </div>
      </SiteMain>
    </div>
  )
}
