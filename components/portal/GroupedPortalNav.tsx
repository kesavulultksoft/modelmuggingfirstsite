'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Circle } from 'lucide-react'
import type { NavGroup } from './portalNavGroups'
import { isPortalNavActive } from './portalNavActive'

export default function GroupedPortalNav({
  pathname,
  groups,
  onNavigate,
  variant = 'desktop',
  collapsed = false,
  resolveIcon,
}: {
  pathname: string | null
  groups: NavGroup[]
  onNavigate?: () => void
  variant?: 'desktop' | 'mobile'
  /** Narrow desktop rail: icons only, labels in `title` tooltips. */
  collapsed?: boolean
  resolveIcon?: (href: string) => LucideIcon | undefined
}) {
  const searchParams = useSearchParams()
  const curSearch = searchParams?.toString() ?? ''

  if (collapsed && variant === 'desktop') {
    return (
      <div className="flex flex-col gap-3">
        {groups.map((group, index) => (
          <div
            key={`${group.title}-${index}`}
            className="flex flex-col gap-1 border-t border-white/10 pt-3 first:border-0 first:pt-0"
          >
            {group.links.map((item) => {
              const active = isPortalNavActive(pathname, item.href, curSearch)
              const Icon = resolveIcon?.(item.href) ?? Circle
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition',
                    active
                      ? 'bg-[#00d4aa] text-[#070b14]'
                      : 'text-white/65 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="sr-only">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col gap-1', variant === 'mobile' && 'max-h-[70vh] overflow-y-auto')}>
      {groups.map((group, index) => (
        <details
          key={`${group.title}-${index}`}
          open={variant === 'desktop'}
          className="group/details rounded-xl border border-white/5 bg-white/[0.02]"
        >
          <summary
            className={clsx(
              'flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#00d4aa]/90',
              '[&::-webkit-details-marker]:hidden'
            )}
          >
            {group.title}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60 transition group-open/details:rotate-180 lg:hidden" />
          </summary>
          <div className="border-t border-white/5 pb-2 pt-1">
            {group.links.map((item) => {
              const active = isPortalNavActive(pathname, item.href, curSearch)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-[#00d4aa] text-[#070b14]'
                      : 'text-white/65 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Circle className="h-1.5 w-1.5 shrink-0 opacity-50" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </details>
      ))}
    </div>
  )
}
