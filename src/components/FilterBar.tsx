'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProvinces, getGenres, getCitiesByProvince } from '@/lib/queries'
import type { Province, City, Genre } from '@/types'
import { Select } from '@/components/ui/Select'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export function FilterBar() {
  const router = useRouter()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [province, setProvince] = useState(params.get('province') ?? '')
  const [city, setCity] = useState(params.get('city') ?? '')
  const [genre, setGenre] = useState(params.get('genre') ?? '')
  const [lookingForMembers, setLookingForMembers] = useState(params.get('open') === 'true')
  const [search, setSearch] = useState(params.get('q') ?? '')

  // On mount: fetch static data + restore city if province is in URL
  useEffect(() => {
    getProvinces().then(setProvinces)
    getGenres().then(setGenres)

    const p = params.get('province')
    const c = params.get('city')
    if (p) {
      getCitiesByProvince(Number(p)).then((data) => {
        setCities(data)
        if (c) setCity(c)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function buildURL(overrides: Partial<Record<'province' | 'city' | 'genre' | 'open' | 'q', string>>) {
    const merged = {
      province,
      city,
      genre,
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
    setProvince(val)
    setCity('')
    setCities([])
    if (val) getCitiesByProvince(Number(val)).then(setCities)
    router.push(buildURL({ province: val, city: '' }))
  }

  function handleCityChange(val: string) {
    setCity(val)
    router.push(buildURL({ city: val }))
  }

  function handleGenreChange(val: string) {
    setGenre(val)
    router.push(buildURL({ genre: val }))
  }

  function handleOpenChange(checked: boolean) {
    setLookingForMembers(checked)
    router.push(buildURL({ open: checked ? 'true' : '' }))
  }

  function handleSearchSubmit() {
    router.push(buildURL({ q: search }))
  }

  function reset() {
    setProvince('')
    setCity('')
    setGenre('')
    setLookingForMembers(false)
    setSearch('')
    setCities([])
    router.push('/browse')
  }

  const activeCount = [province, city, genre, lookingForMembers ? 'open' : '', search]
    .filter(Boolean).length

  return (
    <div className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-semibold">
          <SlidersHorizontal className="w-4 h-4" />
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
            onClick={() => { setSearch(''); router.push(buildURL({ q: '' })) }}
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

      {/* Genre */}
      <Select
        label="Genre"
        placeholder="Semua Genre"
        value={genre}
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
