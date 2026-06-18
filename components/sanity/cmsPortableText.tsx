import Link from 'next/link'
import type { ReactNode } from 'react'
import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'
import { urlForImage } from '@/lib/sanity/image'

type LinkMarkValue = {
  href?: string
  openInNewTab?: boolean
}

function CmsPortableLink({
  value,
  children,
}: {
  value?: LinkMarkValue
  children: ReactNode
}) {
  const href = value?.href?.trim()
  if (!href) return <>{children}</>

  const className =
    'font-medium text-teal-700 underline decoration-teal-600/40 underline-offset-2 hover:text-teal-800'
  const isExternal = /^https?:\/\//i.test(href)
  const openInNewTab = value?.openInNewTab ?? isExternal

  if (href.startsWith('/') && !openInNewTab) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      className={className}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

const components: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => <CmsPortableLink value={value}>{children}</CmsPortableLink>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
  },
  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed text-slate-800">{children}</p>,
    h2: ({ children }) => (
      <h2 className="mb-4 mt-10 scroll-mt-24 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 scroll-mt-24 text-xl font-bold text-slate-900">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-teal-500 pl-4 italic text-slate-700">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-800">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-800">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  types: {
    image: ({ value }) => {
      const src = urlForImage(value, { width: 1400, fit: 'max' })
      if (!src) return null
      return (
        <figure className="my-6 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img
            src={src}
            alt={typeof value?.alt === 'string' ? value.alt : ''}
            loading="lazy"
            className="h-auto w-full max-w-full object-contain"
          />
        </figure>
      )
    },
  },
}

export function CmsPortableText({ value }: { value: PortableTextBlock[] | undefined }) {
  if (!value?.length) return null
  return (
    <div className="prose-site max-w-none">
      <PortableText value={value} components={components} />
    </div>
  )
}
