'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { pathMatchesNav } from '@/components/site/siteMarketingLinks'
import type { CmsNavigation } from '@/lib/sanity/types'
import {
  getHeaderUtilityLinks,
  getMarketingDropdowns,
  getMarketingFlatLinks,
} from '@/lib/sanity/navDisplay'
import SiteSearch from '@/components/site/SiteSearch'
import { formatTitleCase } from '@/lib/formatTitleCase'

function isActiveFlat(pathname: string, href: string): boolean {
  if (href.includes('#')) {
    const base = href.split('#')[0]
    return pathname === base || pathname.startsWith(base + '/')
  }
  return pathname === href || pathname.startsWith(href + '/')
}

function NavDropdown({
  id,
  label,
  href,
  children,
  pathname,
  openMenu,
  setOpenMenu,
}: {
  id: string
  label: string
  href: string
  children: { href: string; label: string }[]
  pathname: string | null
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
}) {
  const pathActive =
    pathname != null &&
    (pathname === href || pathname.startsWith(href + '/') || pathMatchesNav(pathname, children))
  const panelOpen = openMenu === id

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenMenu(id)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <Link
        href={href}
        onClick={() => setOpenMenu(null)}
        className={`group flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold tracking-tight transition-all duration-200 lg:px-3.5 lg:py-2.5 lg:text-sm ${
          pathActive
            ? 'bg-teal-50 text-teal-900'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        } ${panelOpen ? 'bg-teal-50/90 text-teal-900' : ''}`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 lg:h-4 lg:w-4 ${panelOpen ? 'rotate-180 text-teal-700' : ''}`}
          aria-hidden
        />
      </Link>
      {panelOpen ? (
        <div className="absolute left-1/2 top-full z-[100] -mt-1.5 min-w-[16rem] max-w-[min(calc(100vw-2rem),20rem)] -translate-x-1/2 pt-2">
          <div className="rounded-2xl bg-white py-2 shadow-xl shadow-slate-900/15">
            <ul className="max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain" role="menu">
              <li role="none" className="px-1 pb-1">
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-bold text-teal-800 transition hover:bg-teal-50"
                >
                  {formatTitleCase(`${label} overview`)} →
                </Link>
              </li>
              {children.map((c) => (
                <li key={c.href} role="none">
                  <Link
                    href={c.href}
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className={`mx-1 block rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50 ${
                      pathname === c.href
                        ? 'bg-teal-50 font-semibold text-teal-900'
                        : 'text-slate-700'
                    }`}
                  >
                    {formatTitleCase(c.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function SiteHeader({ cmsNav }: { cmsNav?: CmsNavigation | null }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [pathname])

  if (pathname?.startsWith('/portal')) {
    return null
  }

  const dropdowns = getMarketingDropdowns(cmsNav)
  const flat = getMarketingFlatLinks(cmsNav)
  const utilityLinks = getHeaderUtilityLinks(cmsNav)

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[box-shadow,background] duration-300 ${
        scrolled
          ? 'border-slate-200/95 bg-white/98 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md'
          : 'border-slate-200/80 bg-white/92 backdrop-blur-sm'
      }`}
    >
      <div className="site-header-inner flex h-[4.5rem] items-center gap-4 lg:h-[4.75rem] lg:gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center py-1"
          onClick={() => setMobileOpen(false)}
        >
          {logoFailed ? (
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Model Mugging
            </span>
          ) : (
            <img
              src="/brand/model-mugging-logo.jpg"
              alt="Model Mugging"
              width={320}
              height={103}
              decoding="async"
              fetchPriority="high"
              onError={() => setLogoFailed(true)}
              className="block h-[2.125rem] w-auto max-w-[160px] object-contain object-left sm:h-10 sm:max-w-[190px] lg:h-11 lg:max-w-[210px]"
            />
          )}
        </Link>

        <nav
          className="hidden min-h-0 min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex xl:gap-2"
          aria-label="Main"
        >
          {dropdowns.map((d) => (
            <NavDropdown
              key={d.id}
              id={d.id}
              label={d.label}
              href={d.href}
              pathname={pathname}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              children={d.children}
            />
          ))}
          {flat.map(({ href, label }) => {
            const active = pathname != null && isActiveFlat(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpenMenu(null)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold tracking-tight transition-all lg:px-3.5 lg:py-2.5 lg:text-sm ${
                  active
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {formatTitleCase(label)}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-0.5 lg:flex">
            {utilityLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpenMenu(null)}
                className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-semibold tracking-tight transition lg:px-3 lg:text-[13px] ${
                  pathname != null && isActiveFlat(pathname, href)
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {formatTitleCase(label)}
              </Link>
            ))}
            <SiteSearch
              variant="menu"
              onNavigate={() => {
                setOpenMenu(null)
                setMobileOpen(false)
              }}
            />
          </div>
          <Link
            href="/register"
            className="hidden rounded-full bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/15 transition hover:bg-[#00d4aa] hover:text-[#0f172a] hover:shadow-teal-500/20 lg:inline-flex"
            onClick={() => setOpenMenu(null)}
          >
            Enroll
          </Link>
          <Link
            href="/schedule"
            className="inline-flex rounded-full bg-[#00d4aa] px-3 py-2 text-xs font-bold text-[#0f172a] shadow-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            Classes
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition hover:bg-slate-200 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[min(88dvh,640px)] overflow-y-auto border-t border-slate-100 bg-slate-50/50 px-3 py-4 shadow-inner lg:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile main">
            {dropdowns.map((section) => (
              <details
                key={section.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-900/8 open:shadow-lg"
              >
                <summary className="cursor-pointer list-none px-4 py-3.5 font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {section.label}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                  </span>
                </summary>
                <div className="bg-slate-50/60 px-2 py-3">
                  <Link
                    href={section.href}
                    className="mb-2 block rounded-xl bg-teal-600 px-3 py-2.5 text-center text-sm font-bold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {formatTitleCase(`${section.label} — overview`)}
                  </Link>
                  <ul className="max-h-52 space-y-0.5 overflow-y-auto">
                    {section.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-white"
                          onClick={() => setMobileOpen(false)}
                        >
                          {formatTitleCase(c.label)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
            {flat.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl bg-white px-4 py-3.5 text-center text-base font-bold text-slate-900 shadow-md shadow-slate-900/8"
                onClick={() => setMobileOpen(false)}
              >
                {formatTitleCase(label)}
              </Link>
            ))}
            <SiteSearch
              variant="full"
              onNavigate={() => {
                setOpenMenu(null)
                setMobileOpen(false)
              }}
            />
            {utilityLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl bg-white px-4 py-3.5 text-center text-base font-semibold text-slate-800 shadow-md shadow-slate-900/8"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/register"
              className="mt-1 rounded-2xl bg-[#0f172a] py-3.5 text-center text-base font-bold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Enroll / Create account
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
