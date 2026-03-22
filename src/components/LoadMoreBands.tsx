'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { BandCard } from './BandCard'
import { CardSkeleton } from './ui/Skeleton'
import type { Band, BandFilters } from '@/types'

interface Props {
  initialBands: Band[]
  initialHasMore: boolean
  filters: BandFilters
  isLoggedIn?: boolean
  savedBandIds?: string[]
}

export function LoadMoreBands({ initialBands, initialHasMore, filters, isLoggedIn, savedBandIds }: Props) {
  const savedSet = new Set(savedBandIds ?? [])
  const [bands, setBands] = useState(initialBands)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset state when filters/initial data change (e.g. navigation, "Hapus semua")
  useEffect(() => {
    setBands(initialBands)
    setHasMore(initialHasMore)
    setPage(0)
    setError(false)
  }, [initialBands, initialHasMore])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      if (filters.province_id) params.set('province', String(filters.province_id))
      if (filters.city_id) params.set('city', String(filters.city_id))
      if (filters.genre_ids?.length) params.set('genre', filters.genre_ids.join(','))
      if (filters.is_looking_for_members) params.set('open', 'true')
      if (filters.search) params.set('q', filters.search)
      if (filters.sort) params.set('sort', filters.sort)

      const res = await fetch(`/api/bands?${params.toString()}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()

      setBands((prev) => {
        const existingIds = new Set(prev.map((b) => b.id))
        const newBands = data.bands.filter((b: Band) => !existingIds.has(b.id))
        return [...prev, ...newBands]
      })
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

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
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {bands.map((band) => (
          <BandCard key={band.id} band={band} isLoggedIn={isLoggedIn} isSaved={savedSet.has(band.id)} />
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
