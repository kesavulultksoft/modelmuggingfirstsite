import { fetchCmsNavigation } from '@/lib/sanity/queries'
import SiteHeader from '@/components/site/SiteHeader'

export default async function SiteHeaderServer() {
  const cmsNav = await fetchCmsNavigation()
  return <SiteHeader cmsNav={cmsNav} />
}
