import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/embeddings'
import { supabase } from '@/lib/supabase'
import { BANDS_PER_PAGE } from '@/lib/queries'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q')
  const page = Number(sp.get('page') ?? '0')

  if (!q?.trim()) {
    return NextResponse.json({ bands: [], hasMore: false })
  }

  const embedding = await generateEmbedding(q)

  const { data, error } = await supabase.rpc('search_bands_semantic', {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.3,
    match_count: (page + 1) * BANDS_PER_PAGE + 1,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = data ?? []
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE
  const paged = all.slice(from, to)
  const hasMore = all.length > to

  return NextResponse.json({ bands: paged, hasMore })
}
