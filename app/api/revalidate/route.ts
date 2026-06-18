import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

/**
 * On-demand revalidation after Sanity publish webhook.
 * POST /api/revalidate?secret=YOUR_SECRET
 * Body (optional): { "path": "/some-path" } or { "paths": ["/a", "/b"] }
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: {
    path?: string
    paths?: string[]
    routePath?: string
    routePaths?: string[]
    slug?: { current?: string }
  } = {}
  try {
    body = await req.json()
  } catch {
    /* empty body */
  }

  const requestedPaths = [
    ...(body.paths ?? []),
    ...(body.path ? [body.path] : []),
    ...(body.routePaths ?? []),
    ...(body.routePath ? [body.routePath] : []),
    ...(body.slug?.current ? [body.slug.current] : []),
  ]

  const normalize = (p: string) => {
    const trimmed = p.trim()
    if (!trimmed) return '/'
    if (trimmed === 'home' || trimmed === '/') return '/'
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  const paths = [...new Set((requestedPaths.length ? requestedPaths : ['/']).map(normalize))]

  for (const p of paths) {
    revalidatePath(p === '/' ? '/' : p)
  }

  return Response.json({ revalidated: true, paths })
}
