'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getProvinces, getGenres, getCitiesByProvince } from '@/lib/queries'
import type { Province, City, Genre } from '@/types'
import { Select } from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { useFilterLoading } from './FilterLoadingContext'

export function FilterBar() {
  const { isPending, navigate } = useFilterLoading()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  // Static data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [cities, setCities] = useState<City[]>([])

  // Derive filter values directly from URL params (no local state needed)
  const province = params.get('province') ?? ''
  const city = params.get('city') ?? ''
  const genreIds = useMemo(() => {
    const g = params.get('genre')
    return g ? g.split(',') : []
  }, [params])
  const lookingForMembers = params.get('open') === 'true'

  // Search needs local state (typed before Enter submits)
  const [search, setSearch] = useState(params.get('q') ?? '')

  // On mount: fetch static data
  useEffect(() => {
    getProvinces().then(setProvinces)
    getGenres().then(setGenres)
  }, [])

  // Sync search input when URL changes (e.g. chip removed)
  useEffect(() => {
    setSearch(params.get('q') ?? '') // eslint-disable-line react-hooks/set-state-in-effect
  }, [params])

  // Fetch cities when province changes
  useEffect(() => {
    if (province) {
      getCitiesByProvince(Number(province)).then(setCities)
    } else {
      setCities([]) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [province])

  function buildURL(overrides: Partial<Record<'province' | 'city' | 'genre' | 'open' | 'q', string>>) {
    const merged = {
      province,
      city,
      genre: genreIds.join(','),
      open: lookingForMembers ? 'true' : '',
      q: search,
      ...overrides,
    }
    const p = new URLSearchParams()
    if (merged.province) p.set('province', merged.province)
    if (merged.city) p.set('city', merged.city)
    if (merged.genre) p.set('genre', merged.genre)
    if (merged.open === 'true') p.set('open', 'true')
    if (merged.q) p.set('q', merged.q)
    return `/browse?${p.toString()}`
  }

  function handleProvinceChange(val: string) {
    setCities([])
    if (val) getCitiesByProvince(Number(val)).then(setCities)
    navigate(buildURL({ province: val, city: '' }))
  }

  function handleCityChange(val: string) {
    navigate(buildURL({ city: val }))
  }

  function handleGenreChange(vals: string[]) {
    navigate(buildURL({ genre: vals.join(',') }))
  }

  function handleOpenChange(checked: boolean) {
    navigate(buildURL({ open: checked ? 'true' : '' }))
  }

  function handleSearchSubmit() {
    navigate(buildURL({ q: search }))
  }

  function reset() {
    setSearch('')
    setCities([])
    navigate('/browse')
  }

  const activeCount = [province, city, genreIds.length > 0 ? 'genre' : '', lookingForMembers ? 'open' : '', params.get('q')]
    .filter(Boolean).length

  return (
    <div className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-semibold">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <SlidersHorizontal className="w-4 h-4" />
          )}
          Filter
          {activeCount > 0 && (
            <span className="bg-amber-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Cari nama band..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          className="w-full pl-9 pr-8 py-2 border border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); navigate(buildURL({ q: '' })) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Province */}
      <Select
        label="Provinsi"
        placeholder="Semua Provinsi"
        value={province}
        options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
        onChange={handleProvinceChange}
        searchable
      />

      {/* City */}
      <Select
        label="Kota / Kabupaten"
        placeholder="Semua Kota"
        value={city}
        options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
        onChange={handleCityChange}
        disabled={cities.length === 0}
        searchable
      />

      {/* Genre (multi-select) */}
      <MultiSelect
        label="Genre"
        placeholder="Semua Genre"
        value={genreIds}
        options={genres.map((g) => ({ value: String(g.id), label: g.name }))}
        onChange={handleGenreChange}
      />

      {/* Looking for members */}
      <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={lookingForMembers}
          onChange={(e) => handleOpenChange(e.target.checked)}
          className="rounded text-amber-700"
        />
        Buka lowongan member
      </label>
    </div>
  )
}
