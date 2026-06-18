import type { PortableTextBlock } from '@portabletext/react'

import { CmsPortableText } from '@/components/sanity/cmsPortableText'
import { isPortableWithContent } from '@/lib/marketingPages/mensBasicPortable'

export function DonatePortableBody({
  value,
  className = 'prose-site max-w-none text-slate-800',
}: {
  value: PortableTextBlock[] | undefined
  className?: string
}) {
  if (!isPortableWithContent(value)) return null
  return (
    <div className={className}>
      <CmsPortableText value={value} />
    </div>
  )
}
