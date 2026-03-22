import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Post, TaggedBand } from '@/types'

const POSTS_PER_PAGE = 10

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = Number(sp.get('page') ?? 0)
  const type = sp.get('type')
  const bandId = sp.get('band_id')

  const from = page * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  // If filtering by band, get post IDs tagged with that band first
  let filteredIds: string[] | null = null
  if (bandId) {
    const { data: tagRows } = await supabaseAdmin
      .from('post_band_tags')
      .select('post_id')
      .eq('band_id', bandId)
    filteredIds = (tagRows ?? []).map((r: { post_id: string }) => r.post_id)
    if (filteredIds.length === 0) return NextResponse.json({ posts: [], hasMore: false })
  }

  let query = supabaseAdmin
    .from('posts_view')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)
  if (filteredIds) query = query.in('id', filteredIds)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch tagged bands for this page of posts in one query
  const postIds = (posts ?? []).map((p: Post) => p.id)
  const taggedBandsMap: Record<string, TaggedBand[]> = {}

  if (postIds.length > 0) {
    const { data: tags } = await supabaseAdmin
      .from('post_band_tags')
      .select('post_id, bands(id, name, username, photo_url)')
      .in('post_id', postIds)

    for (const tag of tags ?? []) {
      // Supabase embed returns bands as object or array depending on cardinality
      const t = tag as unknown as { post_id: string; bands: TaggedBand | TaggedBand[] | null }
      if (!taggedBandsMap[t.post_id]) taggedBandsMap[t.post_id] = []
      if (t.bands) {
        const b = Array.isArray(t.bands) ? t.bands[0] : t.bands
        if (b) taggedBandsMap[t.post_id].push(b)
      }
    }
  }

  const enriched = (posts ?? []).map((p: Post) => ({
    ...p,
    tagged_bands: taggedBandsMap[p.id] ?? [],
  }))

  return NextResponse.json({
    posts: enriched,
    hasMore: (posts ?? []).length === POSTS_PER_PAGE,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, title, body, event_date, location, ticket_price, ticket_url, band_ids } =
    await req.json()

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .insert({
      user_id: user.id,
      type: type ?? 'general',
      title: title.trim(),
      body: body?.trim() || null,
      event_date: event_date || null,
      location: location?.trim() || null,
      ticket_price: ticket_price?.trim() || null,
      ticket_url: ticket_url?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !post) return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 })

  if (Array.isArray(band_ids) && band_ids.length > 0) {
    await supabaseAdmin
      .from('post_band_tags')
      .insert(band_ids.map((band_id: string) => ({ post_id: post.id, band_id })))
  }

  return NextResponse.json({ id: post.id }, { status: 201 })
}
