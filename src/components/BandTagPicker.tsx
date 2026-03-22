'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, X, Music } from 'lucide-react'
import type { TaggedBand } from '@/types'

interface Props {
  selected: TaggedBand[]
  onChange: (bands: TaggedBand[]) => void
}

export function BandTagPicker({ selected, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TaggedBand[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/bands?q=${encodeURIComponent(query)}&page=0`)
        const json = await res.json()
        const bands: TaggedBand[] = (json.bands ?? []).map((b: { id: string; name: string; username: string | null; photo_url: string | null }) => ({
          id: b.id,
          name: b.name,
          username: b.username,
          photo_url: b.photo_url,
        }))
        setResults(bands.filter((b) => !selected.some((s) => s.id === b.id)))
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, selected])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function add(band: TaggedBand) {
    onChange([...selected, band])
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function remove(id: string) {
    onChange(selected.filter((b) => b.id !== id))
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((band) => (
            <span
              key={band.id}
              className="inline-flex items-center gap-1.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-full"
            >
              {band.name}
              <button onClick={() => remove(band.id)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Cari dan tag band..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
        />

        {/* Dropdown */}
        {open && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {loading && (
              <p className="px-3 py-2 text-sm text-stone-400">Mencari...</p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-3 py-2 text-sm text-stone-400">Tidak ditemukan</p>
            )}
            {results.map((band) => (
              <button
                key={band.id}
                type="button"
                onClick={() => add(band)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  {band.photo_url ? (
                    <div className="w-full h-full relative">
                      <Image src={band.photo_url} alt={band.name} fill className="object-cover" sizes="28px" />
                    </div>
                  ) : (
                    <Music className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{band.name}</p>
                  {band.username && (
                    <p className="text-xs text-stone-400 truncate">@{band.username}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
