import Link from 'next/link'
import { formatInlineBackLabel } from '@/lib/formatTitleCase'

export default function AuthShell({
  title,
  subtitle,
  children,
  maxWidth = 'md',
  backHref = '/',
  backLabel = '← Back to site',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  /** md = default account forms; lg/xl = course registration */
  maxWidth?: 'md' | 'lg' | 'xl'
  /** Defaults to home; pass e.g. class URL when user came from course registration */
  backHref?: string
  backLabel?: string
}) {
  const shellWidth =
    maxWidth === 'xl' ? 'max-w-3xl' : maxWidth === 'lg' ? 'max-w-2xl' : 'max-w-md'
  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background: `
            linear-gradient(125deg, #042f2e 0%, transparent 45%),
            linear-gradient(215deg, #0f172a 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 20% 80%, rgba(0, 212, 170, 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 90% 20%, rgba(13, 148, 136, 0.15), transparent)
          `,
        }}
      />
      <div className="site-page-shell relative z-10 flex justify-center py-12 sm:py-16">
        <div className={`w-full ${shellWidth}`}>
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center text-sm font-semibold text-[#0d9488] hover:text-[#0f766e]"
        >
          {formatInlineBackLabel(backLabel)}
        </Link>
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:p-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#0f172a]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        </div>
      </div>
    </div>
  )
}
