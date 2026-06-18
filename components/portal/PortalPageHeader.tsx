import type { ReactNode } from 'react'

export default function PortalPageHeader({
  title,
  subtitle,
  subtitleFullWidth = false,
}: {
  title: string
  subtitle?: ReactNode
  subtitleFullWidth?: boolean
}) {
  return (
    <header className="mb-6 border-b border-slate-200/80 pb-5 sm:mb-8 sm:pb-6">
      <h1 className="font-[family-name:var(--font-portal-display)] text-xl font-bold tracking-tight text-[#0f172a] sm:text-2xl md:text-3xl">
        {title}
      </h1>
      {subtitle != null && subtitle !== '' && (
        <p className={`mt-2 text-sm leading-relaxed text-slate-600 sm:text-base ${subtitleFullWidth ? 'w-full max-w-none' : 'max-w-2xl'}`}>
          {subtitle}
        </p>
      )}
    </header>
  )
}
