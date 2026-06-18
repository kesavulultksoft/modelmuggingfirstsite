'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LOCATIONS_NAV,
  TRAINING_NAV,
  WHY_NAV,
  TESTIMONIALS_NAV,
} from '@/components/site/siteMarketingLinks'
import type { CmsSiteFooter } from '@/lib/sanity/types'
import { normalizeFooter } from '@/lib/sanity/queries'
import { formatTitleCase } from '@/lib/formatTitleCase'

export default function SiteFooter({ cmsFooter }: { cmsFooter?: CmsSiteFooter | null }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/portal')) {
    return null
  }

  const cms = normalizeFooter(cmsFooter ?? null)
  const locShow = LOCATIONS_NAV.slice(0, 12)
  const locRest = LOCATIONS_NAV.length > 12

  const brandTitle = cms?.taglineTitle?.trim() || 'Model Mugging'
  const brandBody =
    cms?.taglineBody?.trim() ||
    'Full-force, research-based self-defense. Small classes. Padded-assailant training. You leave knowing you can fight back.'

  const linkColCount = cms?.columns?.length ?? 0
  const totalLinkCols = linkColCount ? linkColCount + 1 : 5
  const gridColsClass =
    totalLinkCols <= 4 ? 'lg:grid-cols-4' : totalLinkCols === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-6'

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070b14] text-white">
      <div
        className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="site-page-shell relative py-14 lg:py-16">
        <div className="grid gap-10">
          <div className="max-w-md">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
              {brandTitle}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{brandBody}</p>
            <Link
              href="/schedule"
              className="mt-6 inline-flex rounded-xl bg-[#00d4aa] px-5 py-2.5 text-sm font-bold text-[#070b14] transition hover:bg-teal-300"
            >
              {formatTitleCase('Find a class')}
            </Link>
          </div>

          <div className={`grid gap-10 sm:grid-cols-2 ${gridColsClass}`}>
          {cms?.columns?.length ? (
            cms.columns.map((col, idx) => (
              <div key={`${col.heading}-${idx}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">
                  {col.heading}
                </p>
                <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm text-white/75">
                  {(col.links ?? []).map(({ href, label }) => (
                    <li key={`${href}-${label}`}>
                      <Link href={href || '#'} className="transition hover:text-[#00d4aa]">
                        {formatTitleCase(label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">Locations</p>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm text-white/75">
              {locShow.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-[#00d4aa]">
                    {formatTitleCase(label)}
                  </Link>
                </li>
              ))}
              {locRest && (
                <li>
                  <Link href="/locations" className="font-semibold text-[#00d4aa] hover:underline">
                    {formatTitleCase('All locations')} →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">Training</p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {TRAINING_NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-[#00d4aa]">
                    {formatTitleCase(label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">Why us</p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {WHY_NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-[#00d4aa]">
                    {formatTitleCase(label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">
              Testimonials
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {TESTIMONIALS_NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-[#00d4aa]">
                    {formatTitleCase(label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
            </>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li>
                <Link href="/register" className="transition hover:text-[#00d4aa]">
                  {formatTitleCase('Sign up')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-[#00d4aa]">
                  {formatTitleCase('Log in')}
                </Link>
              </li>
              <li>
                <Link href="/portal" className="transition hover:text-[#00d4aa]">
                  Portal
                </Link>
              </li>
              <li>
                <Link href="/donate-to-empowerment/" className="transition hover:text-[#00d4aa]">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/apply/trainer" className="transition hover:text-[#00d4aa]">
                  {formatTitleCase('Trainer application')}
                </Link>
              </li>
              <li>
                <Link href="/trainers" className="transition hover:text-[#00d4aa]">
                  Become a trainer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-[#00d4aa]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/#newsletter" className="transition hover:text-[#00d4aa]">
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/55 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Model Mugging. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/70">
            <Link href="/terms" className="font-medium transition hover:text-[#00d4aa]">
              Terms of Service
            </Link>
            <Link href="/privacy" className="font-medium transition hover:text-[#00d4aa]">
              Privacy Policy
            </Link>
            <Link href="/contact" className="font-medium transition hover:text-[#00d4aa]">
              Contact
            </Link>
            <Link href="/faq" className="font-medium transition hover:text-[#00d4aa]">
              FAQ
            </Link>
            <Link href="/group-course-application" className="font-medium transition hover:text-[#00d4aa]">
              Group courses
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
