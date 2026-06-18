import SiteHeaderServer from '@/components/site/SiteHeaderServer'
import SiteFooterServer from '@/components/site/SiteFooterServer'

/**
 * Marketing / public pages: site header + footer.
 * Portal, login, and API routes live outside this group so they render full-width app shells without
 * the marketing chrome (avoids huge empty space below short portal pages).
 */
export default function SiteChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeaderServer />
      {children}
      <SiteFooterServer />
    </>
  )
}
