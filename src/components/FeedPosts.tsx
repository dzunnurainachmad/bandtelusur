'use client'

import { useState } from 'react'
import { PostCard } from './PostCard'
import type { Post } from '@/types'

interface Props {
  initialPosts: Post[]
  initialHasMore: boolean
  type?: string
  bandId?: string
}

export function FeedPosts({ initialPosts, initialHasMore, type, bandId }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function loadMore() {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (type) params.set('type', type)
      if (bandId) params.set('band_id', bandId)

      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setPosts((prev) => [...prev, ...json.posts])
      setHasMore(json.hasMore)
      setPage((p) => p + 1)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  if (posts.length === 0) {
    return (
      <p className="text-center text-stone-400 dark:text-stone-500 py-16 text-sm">
        Belum ada post.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={handleDelete} />
      ))}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-stone-400 mb-2">Gagal memuat post.</p>
          <button
            onClick={loadMore}
            className="text-sm text-amber-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {hasMore && !error && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-5 py-2.5 text-sm border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'Muat lebih banyak'}
          </button>
        </div>
      )}
    </div>
  )
}
