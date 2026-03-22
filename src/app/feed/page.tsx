import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { FeedPosts } from '@/components/FeedPosts'
import type { Post } from '@/types'

const POSTS_PER_PAGE = 10

interface SearchParams {
  type?: string
  band_id?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function fetchInitialPosts(type?: string, bandId?: string): Promise<{ posts: Post[]; hasMore: boolean }> {
  let filteredIds: string[] | null = null
  if (bandId) {
    const { data: tagRows } = await supabaseAdmin
      .from('post_band_tags')
      .select('post_id')
      .eq('band_id', bandId)
    filteredIds = (tagRows ?? []).map((r: { post_id: string }) => r.post_id)
    if (filteredIds.length === 0) return { posts: [], hasMore: false }
  }

  let query = supabaseAdmin
    .from('posts_view')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, POSTS_PER_PAGE - 1)

  if (type && type !== 'all') query = query.eq('type', type)
  if (filteredIds) query = query.in('id', filteredIds)

  const { data: posts } = await query

  const postIds = (posts ?? []).map((p: Post) => p.id)
  const taggedBandsMap: Record<string, { id: string; name: string; username: string | null; photo_url: string | null }[]> = {}
  if (postIds.length > 0) {
    const { data: tags } = await supabaseAdmin
      .from('post_band_tags')
      .select('post_id, bands(id, name, username, photo_url)')
      .in('post_id', postIds)
    type BandRow = { id: string; name: string; username: string | null; photo_url: string | null }
    for (const tag of tags ?? []) {
      const t = tag as unknown as { post_id: string; bands: BandRow | BandRow[] | null }
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

  return { posts: enriched, hasMore: enriched.length === POSTS_PER_PAGE }
}

export default async function FeedPage({ searchParams }: Props) {
  const sp = await searchParams
  const type = sp.type
  const bandId = sp.band_id

  const [supabase, { posts, hasMore }] = await Promise.all([
    createSupabaseServerClient(),
    fetchInitialPosts(type, bandId),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  const tabs = [
    { label: 'Semua', value: undefined },
    { label: '🎸 Gigs', value: 'gig' },
    { label: '📢 Post', value: 'general' },
  ]

  function tabHref(value?: string) {
    const p = new URLSearchParams()
    if (value) p.set('type', value)
    if (bandId) p.set('band_id', bandId)
    const qs = p.toString()
    return `/feed${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Feed</h1>
        {user && (
          <Link
            href="/posts/new"
            className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Post
          </Link>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const active = (type ?? undefined) === tab.value
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value)}
              className={
                active
                  ? 'flex-1 text-center text-sm font-medium py-1.5 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm transition-colors'
                  : 'flex-1 text-center text-sm py-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors'
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <FeedPosts
        initialPosts={posts}
        initialHasMore={hasMore}
        type={type && type !== 'all' ? type : undefined}
        bandId={bandId}
      />
    </div>
  )
}
