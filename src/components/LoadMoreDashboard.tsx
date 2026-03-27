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
  const [activating, setActivating] = useState<string | null>(null)
  const [activateError, setActivateError] = useState<string | null>(null)
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
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  async function handleActivate(bandId: string) {
    setActivating(bandId)
    setActivateError(null)
    try {
      const res = await fetch(`/api/bands/${bandId}/activate`, { method: 'PATCH' })
      if (!res.ok) throw new Error('failed')
      setBands((prev) =>
        prev.map((b) => ({ ...b, is_active: b.id === bandId }))
      )
    } catch {
      setActivateError(bandId)
    } finally {
      setActivating(null)
    }
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bands.map((band) => (
          <div key={band.id} className="relative group/card flex flex-col gap-2">
            <div className="relative flex-1">
              <BandCard band={band} />
              <Link
                href={`/bands/${band.id}/edit`}
                className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity"
              >
                <Pencil className="w-3 h-3" /> Edit
              </Link>
            </div>
            <div className="px-1">
              {band.is_active ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              ) : (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleActivate(band.id)}
                    disabled={activating === band.id}
                    className="text-xs font-medium text-amber-700 dark:text-amber-500 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                  >
                    {activating === band.id ? 'Mengaktifkan…' : 'Aktifkan'}
                  </button>
                  {activateError === band.id && (
                    <p className="text-xs text-red-600 dark:text-red-400">Gagal mengaktifkan. Coba lagi.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {error && (
        <div className="col-span-full text-center py-6">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Gagal memuat band berikutnya.</p>
          <button onClick={loadMore} className="text-sm text-amber-700 dark:text-amber-500 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      <div ref={sentinelRef} />
    </>
  )
}
