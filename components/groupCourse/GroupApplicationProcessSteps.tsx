export default function GroupApplicationProcessSteps() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700">How it works</p>
      <ol className="mt-4 space-y-4">
        <li className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            1
          </span>
          <div>
            <p className="font-semibold text-slate-900">Submit screening request (this page)</p>
            <p className="mt-1 text-sm text-slate-600">
              Tell us about your group, venue, and commitment. Our team reviews every request.
            </p>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
            2
          </span>
          <div>
            <p className="font-semibold text-slate-900">Approval email with your personal link</p>
            <p className="mt-1 text-sm text-slate-600">
              If your group qualifies, we email a link to complete the full application (organizer details,
              dates, venue, and up to 15 participants).
            </p>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
            3
          </span>
          <div>
            <p className="font-semibold text-slate-900">Quote and scheduling</p>
            <p className="mt-1 text-sm text-slate-600">
              After we receive your full application, we follow up with pricing and next steps for your course.
            </p>
          </div>
        </li>
      </ol>
    </div>
  )
}
