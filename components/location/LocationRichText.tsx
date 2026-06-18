import type { PortableTextBlock } from '@portabletext/react'
import { CmsPortableText } from '@/components/sanity/cmsPortableText'

/** Location page rich text (inline links) — compact or on-dark navy band. */
export function LocationRichText({
  value,
  variant = 'default',
  className = '',
}: {
  value: PortableTextBlock[] | undefined
  variant?: 'default' | 'onDark' | 'compact'
  className?: string
}) {
  if (!value?.length) return null

  const prose =
    variant === 'onDark'
      ? '[&_p]:!text-white [&_a]:!text-[#1da1f2] [&_a]:hover:!text-white [&_strong]:!text-white'
      : variant === 'compact'
        ? '[&_p]:text-sm [&_p]:text-slate-700'
        : '[&_p]:text-sm [&_p]:text-slate-700 sm:[&_p]:text-base'

  return (
    <div className={`${prose} ${className}`.trim()}>
      <CmsPortableText value={value} />
    </div>
  )
}
