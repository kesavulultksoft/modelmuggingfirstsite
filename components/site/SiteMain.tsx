import type { ReactNode } from 'react'

/**
 * Marketing page body — matches /locations: site-page-shell padding + wide inner column.
 */
export default function SiteMain({
  children,
  variant = 'wide',
  className = '',
}: {
  children: ReactNode
  /** wide = same as locations; full = use full shell width (no inner max) */
  variant?: 'wide' | 'full'
  className?: string
}) {
  const inner = variant === 'full' ? 'w-full max-w-7xl' : 'site-page-inner-wide'
  return (
    <div className={`site-page-shell ${className}`}>
      <div className={inner}>{children}</div>
    </div>
  )
}
