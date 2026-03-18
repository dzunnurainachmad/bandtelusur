'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { BandCard } from './BandCard'
import { CardSkeleton } from './ui/Skeleton'
import type { Band, BandFilters } from '@/types'

interface Props {
  initialBands: Band[]
  initialHasMore: boolean
  filters: BandFilters
}

export function LoadMoreBands({ initialBands, initialHasMore, filters }: Props) {
  const [bands, setBands] = useState(initialBands)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset state when filters/initial data change (e.g. navigation, "Hapus semua")
  useEffect(() => {
    setBands(initialBands)
    setHasMore(initialHasMore)
    setPage(0)
  }, [initialBands, initialHasMore])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      if (filters.province_id) params.set('province', String(filters.province_id))
      if (filters.city_id) params.set('city', String(filters.city_id))
      if (filters.genre_ids?.length) params.set('genre', filters.genre_ids.join(','))
      if (filters.is_looking_for_members) params.set('open', 'true')
      if (filters.search) params.set('q', filters.search)

      const res = await fetch(`/api/bands?${params.toString()}`)
      const data = await res.json()

      setBands((prev) => {
        const existingIds = new Set(prev.map((b) => b.id))
        const newBands = data.bands.filter((b: Band) => !existingIds.has(b.id))
        return [...prev, ...newBands]
      })
      setHasMore(data.hasMore)
      setPage(nextPage)
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
          <BandCard key={band.id} band={band} />
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      <div ref={sentinelRef} />
    </>
  )
}
