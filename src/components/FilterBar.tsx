'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getProvinces, getGenres, getCitiesByProvince } from '@/lib/queries'
import type { Province, City, Genre } from '@/types'
import { Select } from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Search, SlidersHorizontal, X, Loader2, ChevronDown } from 'lucide-react'
import { useFilterLoading } from './FilterLoadingContext'

export function FilterBar() {
  const { isPending, navigate } = useFilterLoading()
  const params = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('filterBar')

  const [provinces, setProvinces] = useState<Province[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [cities, setCities] = useState<City[]>([])

  const province = params.get('province') ?? ''
  const city = params.get('city') ?? ''
  const genreIds = useMemo(() => {
    const g = params.get('genre')
    return g ? g.split(',') : []
  }, [params])
  const lookingForMembers = params.get('open') === 'true'

  const [search, setSearch] = useState(params.get('q') ?? '')

  useEffect(() => {
    getProvinces().then(setProvinces)
    getGenres().then(setGenres)
  }, [])

  useEffect(() => {
    setSearch(params.get('q') ?? '') // eslint-disable-line react-hooks/set-state-in-effect
  }, [params])

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
    <div className="bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="flex items-center justify-between w-full md:pointer-events-none"
      >
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-semibold">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <SlidersHorizontal className="w-4 h-4" />
          )}
          {t('title')}
          {activeCount > 0 && (
            <span className="bg-amber-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" /> {t('reset')}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-stone-400 md:hidden transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`space-y-4 transition-all duration-200 md:mt-4 ${
        mobileOpen ? 'mt-4' : 'hidden md:block'
      }`}>
        <Input
          ref={searchRef}
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          leftIcon={<Search className="w-4 h-4" />}
          rightIcon={search ? (
            <button
              onClick={() => { setSearch(''); navigate(buildURL({ q: '' })) }}
              className="hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : undefined}
        />

        <Select
          label={t('province')}
          placeholder={t('allProvinces')}
          value={province}
          options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
          onChange={handleProvinceChange}
          searchable
          searchPlaceholder={t('selectSearch')}
          notFoundText={t('selectNotFound')}
        />

        <Select
          label={t('city')}
          placeholder={t('allCities')}
          value={city}
          options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
          onChange={handleCityChange}
          disabled={cities.length === 0}
          searchable
          searchPlaceholder={t('selectSearch')}
          notFoundText={t('selectNotFound')}
        />

        <MultiSelect
          label={t('genre')}
          placeholder={t('allGenres')}
          value={genreIds}
          options={genres.map((g) => ({ value: String(g.id), label: g.name }))}
          onChange={handleGenreChange}
          searchPlaceholder={t('selectSearch')}
          notFoundText={t('selectNotFound')}
          selectedText={(n) => t('genreSelected', { n })}
        />

        <Checkbox
          checked={lookingForMembers}
          onChange={(e) => handleOpenChange(e.target.checked)}
          className="py-1"
        >
          <span className="text-sm text-stone-700 dark:text-stone-300 select-none">{t('openMember')}</span>
        </Checkbox>
      </div>
    </div>
  )
}
