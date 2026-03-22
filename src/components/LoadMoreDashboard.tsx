'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { BandCard } from './BandCard'
import { CardSkeleton } from './ui/Skeleton'
import type { Band } from '@/types'

interface Props {
  initialBands: Band[]
  initialHasMore: boolean
}

export function LoadMoreDashboard({ initialBands, initialHasMore }: Props) {
  const [bands, setBands] = useState(initialBands)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/dashboard?page=${nextPage}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setBands((prev) => [...prev, ...data.bands])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bands.map((band) => (
          <div key={band.id} className="relative group/card flex flex-col">
            <BandCard band={band} />
            <Link
              href={`/bands/${band.id}/edit`}
              className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity"
            >
              <Pencil className="w-3 h-3" /> Edit
            </Link>
          </div>
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {error && (
        <div className="col-span-full text-center py-6">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Gagal memuat band berikutnya.</p>
          <button
            onClick={loadMore}
            className="text-sm text-amber-700 dark:text-amber-500 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div ref={sentinelRef} />
    </>
  )
}
