import type { PortableTextBlock } from '@portabletext/react'

import {
  normalizeMensBasicImageLayout,
  type MensBasicImageLayoutId,
} from '@/lib/marketingPages/mensBasicImageLayout'
import { paragraphRowPlainText } from '@/lib/marketingPages/mensBasicPortable'
import { urlForImage } from '@/lib/sanity/image'
import type { CmsImageField, CmsMensBasicParagraphRow } from '@/lib/sanity/types'

import { CmsPortableText } from './cmsPortableText'

/** ~30% smaller than earlier caps (was sm 384px, 2xl 672px, split 280px / 50%). */
const FIGURE_STACK_SMALL = 'w-fit max-w-[268px]'
const FIGURE_STACK_MEDIUM = 'mx-auto w-full max-w-[470px]'
const FIGURE_STACK_FULL = 'mx-auto w-full max-w-[812px]'

const GRID_SPLIT_MEDIUM_LEFT = 'grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,35%)_1fr] md:items-start md:gap-8'
const GRID_SPLIT_MEDIUM_RIGHT = 'grid grid-cols-1 gap-6 md:grid-cols-[1fr_minmax(0,35%)] md:items-start md:gap-8'
const GRID_SPLIT_SMALL_LEFT = 'grid grid-cols-1 gap-6 md:grid-cols-[minmax(140px,196px)_1fr] md:items-start md:gap-6'
const GRID_SPLIT_SMALL_RIGHT = 'grid grid-cols-1 gap-6 md:grid-cols-[1fr_minmax(140px,196px)] md:items-start md:gap-6'

type Props = {
  heading?: string
  content?: PortableTextBlock[]
  /** Men’s Basic: one optional image per paragraph row (Studio). */
  paragraphRows?: CmsMensBasicParagraphRow[]
  image?: CmsImageField
  /** Men's Basic only; ignored when no image. */
  imageLayout?: MensBasicImageLayoutId | string | null
}

function sectionImageUrl(image: CmsImageField, layout: MensBasicImageLayoutId): string | undefined {
  // Width-only + fit `max` so Sanity never crops; values ~30% below prior requests to match tighter layout.
  if (
    layout === 'below_small_left' ||
    layout === 'below_small_center' ||
    layout === 'below_small_right'
  ) {
    return urlForImage(image, { width: 448, fit: 'max' })
  }
  if (layout === 'below_medium_center') {
    return urlForImage(image, { width: 672, fit: 'max' })
  }
  if (layout === 'split_medium_image_left' || layout === 'split_medium_image_right') {
    return urlForImage(image, { width: 840, fit: 'max' })
  }
  if (layout === 'split_small_image_left' || layout === 'split_small_image_right') {
    return urlForImage(image, { width: 392, fit: 'max' })
  }
  return urlForImage(image, { width: 980, fit: 'max' })
}

type SplitVariant = 'medium_left' | 'medium_right' | 'small_left' | 'small_right'

function splitVariantFromLayout(layout: MensBasicImageLayoutId): SplitVariant | null {
  switch (layout) {
    case 'split_medium_image_left':
      return 'medium_left'
    case 'split_medium_image_right':
      return 'medium_right'
    case 'split_small_image_left':
      return 'small_left'
    case 'split_small_image_right':
      return 'small_right'
    default:
      return null
  }
}

function MensBasicLayoutFigure({
  layout,
  imageUrl,
  alt,
}: {
  layout: MensBasicImageLayoutId
  imageUrl: string
  alt: string
}) {
  const isSplit = splitVariantFromLayout(layout) !== null

  const figureWidthClass = isSplit
    ? 'w-full'
    : layout === 'below_medium_center'
      ? FIGURE_STACK_MEDIUM
      : layout === 'below_small_left' || layout === 'below_small_center' || layout === 'below_small_right'
        ? FIGURE_STACK_SMALL
        : FIGURE_STACK_FULL

  /**
   * Full image, scaled to fit the allowed width — no object-cover, no max-height traps.
   * Parent grid cells use `min-w-0` so huge intrinsic widths don’t blow the layout (which reads as “cropped”).
   */
  return (
    <figure
      className={`min-w-0 rounded-2xl border border-slate-200 bg-slate-50 ${figureWidthClass}`}
    >
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="mx-auto block h-auto w-full max-w-full object-contain align-middle"
      />
    </figure>
  )
}

function ParagraphRowBlock({
  row,
  sectionHeading,
}: {
  row: CmsMensBasicParagraphRow
  sectionHeading?: string
}) {
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  const text = paragraphRowPlainText(row).trim()
  const img = row.image
  const rowLayout = normalizeMensBasicImageLayout(row.imageLayout)
  const imageUrl = img ? sectionImageUrl(img, rowLayout) : undefined
  const alt = img?.alt?.trim() || title || sectionHeading?.trim() || 'Section image'

  const textColumn = (
    <div className="min-w-0 space-y-3">
      {title ? (
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
          {title}
        </h3>
      ) : null}
      {text ? <p className="whitespace-pre-line leading-relaxed text-slate-800">{text}</p> : null}
    </div>
  )

  if (!imageUrl) {
    return <div className="mb-6 last:mb-0">{textColumn}</div>
  }

  const figure = <MensBasicLayoutFigure layout={rowLayout} imageUrl={imageUrl} alt={alt} />
  const splitVariant = splitVariantFromLayout(rowLayout)

  if (splitVariant === 'medium_left' || splitVariant === 'small_left') {
    const gridClass = splitVariant === 'medium_left' ? GRID_SPLIT_MEDIUM_LEFT : GRID_SPLIT_SMALL_LEFT
    return (
      <div className="mb-8 last:mb-0">
        <div className={gridClass}>
          <div className="min-w-0 shrink-0">{figure}</div>
          {textColumn}
        </div>
      </div>
    )
  }

  if (splitVariant === 'medium_right' || splitVariant === 'small_right') {
    const gridClass = splitVariant === 'medium_right' ? GRID_SPLIT_MEDIUM_RIGHT : GRID_SPLIT_SMALL_RIGHT
    return (
      <div className="mb-8 last:mb-0">
        <div className={gridClass}>
          <div className="min-w-0 md:order-1">{textColumn}</div>
          <div className="min-w-0 shrink-0 md:order-2">{figure}</div>
        </div>
      </div>
    )
  }

  if (rowLayout === 'above_full') {
    return (
      <div className="mb-8 last:mb-0">
        <div className="mb-4">{figure}</div>
        {textColumn}
      </div>
    )
  }

  const stackedOuter =
    rowLayout === 'below_small_left'
      ? 'mt-4 flex w-full justify-start'
      : rowLayout === 'below_small_center'
        ? 'mt-4 flex w-full justify-center'
        : rowLayout === 'below_small_right'
          ? 'mt-4 flex w-full justify-end'
          : 'mt-4 w-full'

  return (
    <div className="mb-8 last:mb-0">
      {textColumn}
      <div className={stackedOuter}>{figure}</div>
    </div>
  )
}

function ParagraphRowsBody({
  rows,
  sectionHeading,
}: {
  rows: CmsMensBasicParagraphRow[]
  sectionHeading?: string
}) {
  return (
    <div className="max-w-none">
      {rows.map((row, idx) => (
        <ParagraphRowBlock
          key={row._key || `row-${idx}`}
          row={row}
          sectionHeading={sectionHeading}
        />
      ))}
    </div>
  )
}

export function RichTextSectionWithOptionalImage({
  heading,
  content,
  paragraphRows,
  image,
  imageLayout,
}: Props) {
  const layout = normalizeMensBasicImageLayout(imageLayout)
  const alt = image?.alt?.trim() || heading?.trim() || 'Section image'
  const imageUrl = image ? sectionImageUrl(image, layout) : undefined

  const headingEl = heading ? (
    <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
      {heading}
    </h2>
  ) : null

  const usePortable = Boolean(content?.length)
  const useRows = !usePortable && Boolean(paragraphRows?.length)
  const bodyEl = usePortable ? (
    <CmsPortableText value={content} />
  ) : useRows ? (
    <ParagraphRowsBody rows={paragraphRows!} sectionHeading={heading} />
  ) : null

  const textStack = (
    <div className="min-w-0">
      {headingEl}
      {bodyEl}
    </div>
  )

  if (!imageUrl) {
    return (
      <section className="mb-10 scroll-mt-24">
        {headingEl}
        {bodyEl}
      </section>
    )
  }

  const figure = <MensBasicLayoutFigure layout={layout} imageUrl={imageUrl} alt={alt} />
  const splitVariant = splitVariantFromLayout(layout)

  if (splitVariant === 'medium_left' || splitVariant === 'small_left') {
    const gridClass = splitVariant === 'medium_left' ? GRID_SPLIT_MEDIUM_LEFT : GRID_SPLIT_SMALL_LEFT
    return (
      <section className="mb-10 scroll-mt-24">
        <div className={gridClass}>
          <div className="min-w-0 shrink-0">{figure}</div>
          {textStack}
        </div>
      </section>
    )
  }

  if (splitVariant === 'medium_right' || splitVariant === 'small_right') {
    const gridClass = splitVariant === 'medium_right' ? GRID_SPLIT_MEDIUM_RIGHT : GRID_SPLIT_SMALL_RIGHT
    return (
      <section className="mb-10 scroll-mt-24">
        <div className={gridClass}>
          <div className="min-w-0 md:order-1">{textStack}</div>
          <div className="min-w-0 shrink-0 md:order-2">{figure}</div>
        </div>
      </section>
    )
  }

  if (layout === 'above_full') {
    return (
      <section className="mb-10 scroll-mt-24">
        <div className="mb-6">{figure}</div>
        {headingEl}
        {bodyEl}
      </section>
    )
  }

  const stackedOuter =
    layout === 'below_small_left'
      ? 'mt-6 flex w-full justify-start'
      : layout === 'below_small_center'
        ? 'mt-6 flex w-full justify-center'
        : layout === 'below_small_right'
          ? 'mt-6 flex w-full justify-end'
          : 'mt-6 w-full'

  return (
    <section className="mb-10 scroll-mt-24">
      {headingEl}
      {bodyEl}
      <div className={stackedOuter}>{figure}</div>
    </section>
  )
}
