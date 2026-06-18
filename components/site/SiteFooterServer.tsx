import { fetchCmsFooter } from '@/lib/sanity/queries'
import SiteFooter from '@/components/site/SiteFooter'

export default async function SiteFooterServer() {
  const cmsFooter = await fetchCmsFooter()
  return <SiteFooter cmsFooter={cmsFooter} />
}
