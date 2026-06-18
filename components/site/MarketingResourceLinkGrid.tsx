import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { NavChild, ResourceGridLink } from '@/components/site/siteMarketingLinks'
import { formatTitleCase } from '@/lib/formatTitleCase'

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

function isRichResourceLink(l: NavChild | ResourceGridLink): l is ResourceGridLink {
  const x = l as ResourceGridLink
  return Boolean(x.description?.trim() || x.linkLabel?.trim())
}

function compactRowClassName() {
  return 'group relative flex min-h-[3.25rem] items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/40 px-4 py-3.5 text-left text-[0.9375rem] font-medium leading-snug text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] transition duration-200 hover:border-teal-300/80 hover:to-teal-50/30 hover:shadow-[0_8px_24px_-8px_rgba(15,118,110,0.12)] hover:ring-teal-500/10'
}

function richCardClassName() {
  return 'group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/40 p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.03] transition duration-200 hover:border-teal-300/80 hover:to-teal-50/30 hover:shadow-[0_8px_24px_-8px_rgba(15,118,110,0.12)] hover:ring-teal-500/10 sm:p-5'
}

export function MarketingResourceLinkGrid({
  links,
  twoColumn = true,
}: {
  links: (NavChild | ResourceGridLink)[]
  twoColumn?: boolean
}) {
  return (
    <ul
      role="list"
      className={`m-0 grid list-none gap-2.5 p-0 ${twoColumn ? 'sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5' : ''}`}
    >
      {links.map((l) => {
        const external = isExternalHref(l.href)
        if (isRichResourceLink(l)) {
          const cta = formatTitleCase(l.linkLabel?.trim() || `Open ${l.label}`)
          const cardInner = (
            <>
              <span
                className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-teal-500 to-teal-600 opacity-0 transition duration-200 group-hover:opacity-100"
                aria-hidden
              />
              <span className="pl-0.5 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-slate-900">
                {l.label}
              </span>
              {l.description?.trim() ? (
                <p className="m-0 pl-0.5 text-sm leading-relaxed text-slate-600">{l.description.trim()}</p>
              ) : null}
              <span className="mt-1 flex items-center gap-1.5 pl-0.5 text-sm font-semibold text-teal-800">
                {cta}
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-teal-600 transition duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </>
          )
          return (
            <li key={`${l.href}-${l.label}`} className="list-none">
              {external ? (
                <a
                  href={l.href}
                  className={richCardClassName()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cardInner}
                </a>
              ) : (
                <Link href={l.href} className={richCardClassName()}>
                  {cardInner}
                </Link>
              )}
            </li>
          )
        }

        const className = compactRowClassName()
        const inner = (
          <>
            <span
              className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-teal-500 to-teal-600 opacity-0 transition duration-200 group-hover:opacity-100"
              aria-hidden
            />
            <span className="min-w-0 flex-1 pl-0.5">{formatTitleCase(l.label)}</span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-slate-400 transition duration-200 group-hover:translate-x-0.5 group-hover:text-teal-600"
              aria-hidden
            />
          </>
        )

        return (
          <li key={`${l.href}-${l.label}`} className="list-none">
            {external ? (
              <a
                href={l.href}
                className={className}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <Link href={l.href} className={className}>
                {inner}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ResourceLinksSection({
  title,
  subtitle,
  links,
  twoColumn = true,
  className = '',
}: {
  title: string
  subtitle?: string
  links: (NavChild | ResourceGridLink)[]
  twoColumn?: boolean
  className?: string
}) {
  return (
    <section
      className={`hub-resource-section mt-12 scroll-mt-24 border-t border-slate-200/90 pt-10 ${className}`}
    >
      <h2
        className={`font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-slate-900 sm:text-2xl ${subtitle?.trim() ? 'mb-2' : 'mb-8'}`}
      >
        {formatTitleCase(title)}
      </h2>
      {subtitle?.trim() ? (
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-slate-600">
          {formatTitleCase(subtitle.trim())}
        </p>
      ) : null}
      <MarketingResourceLinkGrid links={links} twoColumn={twoColumn} />
    </section>
  )
}
