export default function ScheduleSkeleton() {
  return (
    <div className="w-full pt-2">
      <div className="mb-8 h-12 max-w-xs animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/80"
          />
        ))}
      </div>
    </div>
  )
}
