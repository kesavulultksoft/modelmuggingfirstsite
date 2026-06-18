'use client'

import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { formatLocationLabel } from '@/components/location/locationText'

export function LocationCollapsible({
  title,
  toggleLabel,
  headingExternal = false,
  defaultOpen = false,
  children,
  className = '',
  compact = true,
}: {
  /** Full section title (when heading is not shown above the toggle). */
  title?: string
  /** Short label on the toggle button when `headingExternal` is true. */
  toggleLabel?: string
  /** When true, the H2 lives outside; this control only expands content. */
  headingExternal?: boolean
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const buttonText = headingExternal
    ? formatLocationLabel(toggleLabel ?? 'Show Details')
    : formatLocationLabel(title ?? toggleLabel ?? 'Details')

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#1f497d]/20 bg-white ${compact ? 'shadow-sm' : 'rounded-2xl shadow-sm'} ${className}`}
    >
      <button
        type="button"
        className={`flex w-full items-center gap-2 text-left transition ${
          compact
            ? 'border-l-4 border-[#1f497d] bg-[#1f497d]/[0.06] px-3 py-2.5 hover:bg-[#1f497d]/10'
            : 'px-4 py-4 sm:px-5'
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f497d]"
          aria-hidden
        >
          <ChevronDown
            className={`h-4 w-4 text-white transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <span className={`min-w-0 flex-1 font-semibold text-[#1f497d] ${compact ? 'text-sm' : 'text-base text-slate-900'}`}>
          {buttonText}
        </span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#1f497d]/70">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          className={`border-t border-[#1f497d]/10 bg-white ${compact ? 'px-3 pb-3 pt-2 sm:px-4' : 'px-4 pb-5 pt-4 sm:px-5'}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
