import createImageUrlBuilder from '@sanity/image-url'
import { sanityConfig } from './env'

const builder = createImageUrlBuilder({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
})

function normalizeImageSourceForBuilder(source: Record<string, unknown>): Record<string, unknown> {
  const asset = source.asset as Record<string, unknown> | null | undefined
  if (!asset || typeof asset !== 'object') return source
  const ref = typeof asset._ref === 'string' ? asset._ref : undefined
  const id = typeof asset._id === 'string' ? asset._id : undefined
  if (ref) return source
  if (id && id.startsWith('image-')) {
    return { ...source, asset: { _type: 'reference', _ref: id } }
  }
  return source
}

export function urlForImage(
  source: unknown,
  opts?: { width?: number; height?: number; fit?: 'crop' | 'fill' | 'clip' | 'max' | 'scale' | 'min' }
) {
  if (!source || typeof source !== 'object') return undefined

  const src = source as Record<string, unknown>
  const normalized = normalizeImageSourceForBuilder(src)
  const asset = normalized.asset as { url?: string } | null | undefined

  try {
    let chain = builder.image(normalized as Parameters<typeof builder.image>[0])
    if (opts?.width) chain = chain.width(opts.width)
    if (opts?.height) chain = chain.height(opts.height)
    if (opts?.fit) chain = chain.fit(opts.fit)
    return chain.auto('format').url()
  } catch {
    if (asset && typeof asset.url === 'string' && asset.url.length > 0) {
      return asset.url
    }
    return undefined
  }
}
