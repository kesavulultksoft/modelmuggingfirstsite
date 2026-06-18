import { Suspense } from 'react'
import type { Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import PortalShell from '@/components/portal/PortalShell'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#070b14',
}

const portalDisplay = Syne({
  subsets: ['latin'],
  variable: '--font-portal-display',
  display: 'swap',
})

const portalSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-portal-sans',
  display: 'swap',
})

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${portalDisplay.variable} ${portalSans.variable}`}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-sm text-white/60">
            Loading portal…
          </div>
        }
      >
        <PortalShell>{children}</PortalShell>
      </Suspense>
    </div>
  )
}
