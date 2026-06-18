import { createClient } from 'next-sanity'
import { isSanityConfigured, sanityConfig } from './env'

let client: ReturnType<typeof createClient> | null = null

/** Draft content on localhost only; requires SANITY_API_READ_TOKEN + SANITY_PREVIEW_DRAFTS=true. */
function usePreviewDrafts(): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const token = process.env.SANITY_API_READ_TOKEN?.trim()
  if (!token) return false
  return process.env.SANITY_PREVIEW_DRAFTS === 'true'
}

export function getSanityClient(): ReturnType<typeof createClient> | null {
  if (!isSanityConfigured()) return null
  if (!client) {
    const readToken = process.env.SANITY_API_READ_TOKEN?.trim()
    const previewDrafts = usePreviewDrafts()
    client = createClient({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
      apiVersion: sanityConfig.apiVersion,
      // Keep marketing pages consistent with Studio updates immediately.
      // CDN caching can otherwise show stale content/section structure.
      useCdn: false,
      perspective: previewDrafts ? 'previewDrafts' : 'published',
      // Viewer token: required when Studio content is not yet on the public API (e.g. after API patch).
      ...(readToken ? { token: readToken } : {}),
    })
  }
  return client
}
