'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LogOut, Menu, PanelLeftClose, PanelRight, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchInstructorCrmView, fetchMe, getToken, setToken, type MeUser } from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import { formatInstructorCartNavLabel } from '@/lib/instructorCartSummary'
import { portalNavForRole, type NavItem } from './portalNav'
import { isPortalNavActive } from './portalNavActive'
import { filterInstructorNavGroupsForApplicant, isInstructorOperationsPath } from '@/lib/instructorPortalAccess'
import {
  ADMIN_NAV_GROUPS,
  INSTRUCTOR_NAV_GROUPS,
  STUDENT_NAV_GROUPS,
  type NavGroup,
} from './portalNavGroups'
import GroupedPortalNav from './GroupedPortalNav'
import { clsx } from 'clsx'

function groupsWithCommon(role: string, base: NavGroup[]): NavGroup[] {
  const commonLinks =
    role === 'STUDENT' || role === 'PARENT'
      ? [
          { href: '/portal/account', label: 'Account settings' },
          { href: '/donate-to-empowerment/', label: 'Donate' },
        ]
      : [
          { href: '/portal/account', label: 'Account settings' },
        ]
  return [...base, { title: 'Account', links: commonLinks }]
}

function navGroupsForRole(role: string): NavGroup[] | null {
  if (role === 'ADMIN' || role === 'SUPERADMIN') return groupsWithCommon(role, ADMIN_NAV_GROUPS)
  if (role === 'INSTRUCTOR') return groupsWithCommon(role, INSTRUCTOR_NAV_GROUPS)
  if (role === 'STUDENT' || role === 'PARENT') return groupsWithCommon(role, STUDENT_NAV_GROUPS)
  return null
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shellQs = searchParams?.toString() ?? ''
  const [me, setMe] = useState<MeUser | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [instructorCartRows, setInstructorCartRows] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('portal-nav-collapsed') === '1') {
        setNavCollapsed(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  function toggleNavCollapsed() {
    setNavCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('portal-nav-collapsed', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/portal')}`)
      return
    }
    fetchMe().then((u) => {
      if (!u) {
        setToken(null)
        router.replace(`/login?next=${encodeURIComponent(pathname || '/portal')}`)
        return
      }
      setMe(u)
    })
  }, [pathname, router])

  const loadInstructorCart = useCallback(async () => {
    if (!me || me.role !== 'INSTRUCTOR') {
      setInstructorCartRows([])
      return
    }
    try {
      const rows = await fetchInstructorCrmView('cart')
      setInstructorCartRows(legacyAsObjectArray(rows))
    } catch {
      setInstructorCartRows([])
    }
  }, [me])

  useEffect(() => {
    void loadInstructorCart()
  }, [loadInstructorCart, pathname])

  useEffect(() => {
    if (!me || me.role !== 'INSTRUCTOR') return
    const bump = () => void loadInstructorCart()
    window.addEventListener('mm-instructor-cart-changed', bump)
    return () => window.removeEventListener('mm-instructor-cart-changed', bump)
  }, [me, loadInstructorCart])

  function logout() {
    setToken(null)
    router.push('/login')
  }

  const showInstructorCart = instructorCartRows.length > 0
  const instructorCartNavLabel = useMemo(
    () => formatInstructorCartNavLabel(instructorCartRows),
    [instructorCartRows],
  )

  const groupedNav = useMemo(() => {
    if (!me) return null
    let groups = navGroupsForRole(me.role)
    if (!groups || me.role !== 'INSTRUCTOR') return groups
    groups = groups.map((g) => ({
      ...g,
      links: g.links
        .filter((l) => showInstructorCart || l.href !== '/portal/instructor/cart')
        .map((l) =>
          l.href === '/portal/instructor/cart' ? { ...l, label: instructorCartNavLabel } : l,
        ),
    }))
    if (me.activeInstructor !== true) {
      groups = filterInstructorNavGroupsForApplicant(groups)
    }
    return groups
  }, [me, showInstructorCart, instructorCartNavLabel])

  const flatNav = useMemo((): NavItem[] => {
    const base = me?.role ? portalNavForRole(me.role) : []
    if (me?.role !== 'INSTRUCTOR') return base
    let out = showInstructorCart ? base : base.filter((i) => i.href !== '/portal/instructor/cart')
    if (me.activeInstructor !== true) {
      out = out.filter((i) => !isInstructorOperationsPath(i.href))
    }
    return out
  }, [me?.role, me?.activeInstructor, showInstructorCart])

  const iconForHref = useMemo(() => {
    const m = new Map<string, LucideIcon>()
    flatNav.forEach((i) => m.set(i.href, i.icon))
    return (href: string) => m.get(href)
  }, [flatNav])

  if (me === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] font-[family-name:var(--font-portal-sans)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00d4aa] border-t-transparent" />
          <p className="text-sm text-white/60">Loading portal…</p>
        </div>
      </div>
    )
  }

  if (!me) return null

  const roleLabel =
    me.role === 'SUPERADMIN'
      ? 'Super admin'
      : me.role.charAt(0) + me.role.slice(1).toLowerCase().replace(/_/g, ' ')

  const useGrouped = groupedNav != null

  return (
    <div
      className={clsx(
        'flex w-full flex-col overflow-x-hidden bg-[#070b14] font-[family-name:var(--font-portal-sans)] text-slate-800',
        /* Mobile: natural page scroll. Desktop: lock shell to one viewport so flex-1 + wide content cannot stretch document height (collapsed sidebar made the gap obvious). */
        'min-h-[100dvh] min-h-screen',
        'lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-y-hidden'
      )}
    >
      <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#070b14]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <Link
          href="/portal"
          className="font-[family-name:var(--font-portal-display)] text-lg font-bold tracking-tight text-white"
        >
          MM <span className="text-[#00d4aa]">Portal</span>
        </Link>
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-white/80 hover:bg-white/10"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#070b14] pt-16 lg:hidden">
          <nav className="flex flex-col gap-2 px-4 pb-8">
            {useGrouped && groupedNav ? (
              <GroupedPortalNav
                pathname={pathname}
                groups={groupedNav}
                onNavigate={() => setOpen(false)}
                variant="mobile"
              />
            ) : (
              flatNav.map((item) => {
                const active = isPortalNavActive(pathname, item.href, shellQs)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition',
                      active ? 'bg-[#00d4aa]/15 text-[#00d4aa]' : 'text-white/70 hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                )
              })
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </nav>
        </div>
      )}

      {/*
        Stretch main with the sidebar. On lg+, the outer shell is h-[100dvh] with overflow hidden;
        this row is flex-1 min-h-0 and main scrolls (overflow-y-auto) so the document does not grow
        past one viewport with empty space at the bottom.
      */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 items-stretch lg:overflow-hidden">
        <aside
          className={clsx(
            'hidden shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0a1020] transition-[width] duration-200 ease-out lg:flex lg:min-h-0',
            navCollapsed ? 'w-[4.5rem]' : 'w-64 xl:w-[19rem]'
          )}
          aria-label="Portal navigation"
        >
          {navCollapsed ? (
            <div className="flex flex-col items-center gap-2 border-b border-white/10 px-2 py-4">
              <button
                type="button"
                onClick={toggleNavCollapsed}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00d4aa]/15 text-[#00d4aa] ring-1 ring-[#00d4aa]/25 transition hover:bg-[#00d4aa]/25 hover:ring-[#00d4aa]/40"
                title="Expand menu"
                aria-expanded={false}
                aria-label="Expand sidebar menu"
              >
                <PanelRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </button>
              <Link
                href="/portal"
                className="font-[family-name:var(--font-portal-display)] text-sm font-bold tracking-tight text-white"
                title="Model Mugging — home"
              >
                MM
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
              <Link href="/portal" className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-portal-display)] text-lg font-bold tracking-tight text-white">
                  Model Mugging
                </p>
              </Link>
              <button
                type="button"
                onClick={toggleNavCollapsed}
                className="shrink-0 rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
                title="Minimize menu"
                aria-expanded
                aria-label="Minimize sidebar menu"
              >
                <PanelLeftClose className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
            {useGrouped && groupedNav ? (
              <GroupedPortalNav
                pathname={pathname}
                groups={groupedNav}
                variant="desktop"
                collapsed={navCollapsed}
                resolveIcon={iconForHref}
              />
            ) : (
              flatNav.map((item) => {
                const active = isPortalNavActive(pathname, item.href, shellQs)
                const Icon = item.icon
                if (navCollapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={clsx(
                        'flex h-10 w-10 items-center justify-center self-center rounded-xl transition',
                        active
                          ? 'bg-[#00d4aa] text-[#070b14]'
                          : 'text-white/65 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition',
                      active
                        ? 'bg-[#00d4aa] text-[#070b14]'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })
            )}
          </nav>
          <div
            className={clsx(
              'border-t border-white/10 p-4',
              navCollapsed && 'flex flex-col items-center gap-3 px-2'
            )}
          >
            {!navCollapsed ? (
              <>
                <div className="rounded-xl bg-white/5 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-white">
                    {me.firstName} {me.lastName}
                  </p>
                  <p className="truncate text-xs text-white/45">{me.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-[#00d4aa]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00d4aa]">
                    {roleLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/70 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00d4aa]/20 text-xs font-bold text-[#00d4aa]"
                  title={`${me.firstName} ${me.lastName} · ${me.email} · ${roleLabel}`}
                >
                  {(me.firstName?.[0] ?? '?').toUpperCase()}
                  {(me.lastName?.[0] ?? '').toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/70 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Log out</span>
                </button>
              </>
            )}
          </div>
        </aside>

        <main
          className={clsx(
            'box-border flex min-h-0 min-w-0 flex-1 flex-col rounded-none bg-[#f0f2f7] pb-[max(1.5rem,env(safe-area-inset-bottom))]',
            'px-4 sm:px-5 md:px-6 lg:overflow-y-auto lg:overscroll-y-contain lg:rounded-tl-[2rem] lg:px-8 lg:shadow-[-8px_0_32px_rgba(7,11,20,0.12)] xl:px-10'
          )}
        >
          {/*
            Centered content column + equal horizontal padding on main = same visual gap from sidebar
            edge to content as from content to viewport. Wider max-width when the rail is collapsed so
            the extra space goes into the page, not dead margin on one side.
          */}
          <div
            className={clsx(
              'mx-auto box-border w-full py-6 sm:py-8 lg:py-10',
              'transition-[max-width] duration-300 ease-out',
              navCollapsed
                ? 'max-w-[min(90rem,100%)]'
                : 'max-w-6xl'
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
