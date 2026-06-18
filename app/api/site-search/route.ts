import { NextResponse } from 'next/server'

import { getSiteSearchIndex } from '@/lib/siteSearch/fetchIndex'
import { searchSiteIndex } from '@/lib/siteSearch/search'

export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const limitRaw = Number(searchParams.get('limit') || '20')
  const limit = Number.isFinite(limitRaw) ? Math.min(40, Math.max(1, limitRaw)) : 20

  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [], total: 0 })
  }

  try {
    const index = await getSiteSearchIndex()
    const results = searchSiteIndex(index, q, limit)
    return NextResponse.json({
      query: q,
      results,
      total: results.length,
    })
  } catch (err) {
    console.error('[site-search]', err)
    return NextResponse.json(
      { query: q, results: [], total: 0, error: 'Search unavailable' },
      { status: 500 },
    )
  }
}
