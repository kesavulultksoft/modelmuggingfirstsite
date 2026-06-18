export default function HomeSchedulePreviewSkeleton() {
  return (
    <section className="bg-white py-16 sm:py-24" aria-hidden>
      <div className="site-page-gutter-x mx-auto w-full max-w-7xl">
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 max-w-sm animate-pulse rounded-lg bg-slate-200 sm:h-11 sm:max-w-md" />
        <div className="mt-4 h-5 max-w-xl animate-pulse rounded bg-slate-100" />
        <div className="mt-8 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  )
}
