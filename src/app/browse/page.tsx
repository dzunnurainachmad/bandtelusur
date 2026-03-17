import { Suspense } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { getBands, getProvinces, getCitiesByProvince, getGenres } from '@/lib/queries'
import { BandCard } from '@/components/BandCard'
import { FilterBar } from '@/components/FilterBar'

interface SearchParams {
  province?: string
  city?: string
  genre?: string
  open?: string
  q?: string
}

interface BrowsePageProps {
  searchParams: Promise<SearchParams>
}

function removeParam(sp: SearchParams, key: keyof SearchParams, also?: keyof SearchParams): string {
  const next: SearchParams = { ...sp, [key]: undefined }
  if (also) next[also] = undefined
  const p = new URLSearchParams()
  if (next.province) p.set('province', next.province)
  if (next.city) p.set('city', next.city)
  if (next.genre) p.set('genre', next.genre)
  if (next.open) p.set('open', next.open)
  if (next.q) p.set('q', next.q)
  const qs = p.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const sp = await searchParams

  // Fetch static data server-side — no client fetch needed for these
  const [bands, provinces, genres] = await Promise.all([
    getBands({
      province_id: sp.province ? Number(sp.province) : undefined,
      city_id: sp.city ? Number(sp.city) : undefined,
      genre_id: sp.genre ? Number(sp.genre) : undefined,
      is_looking_for_members: sp.open === 'true' ? true : undefined,
      search: sp.q,
    }),
    getProvinces(),
    getGenres(),
  ])

  // Resolve labels for active filter chips
  const activeProvince = sp.province ? provinces.find((p) => p.id === Number(sp.province)) : null
  const activeCities = sp.province ? await getCitiesByProvince(Number(sp.province)) : []
  const activeCity = sp.city ? activeCities.find((c) => c.id === Number(sp.city)) : null
  const activeGenre = sp.genre ? genres.find((g) => g.id === Number(sp.genre)) : null

  type Chip = { label: string; href: string }
  const chips: Chip[] = [
    activeProvince && {
      label: activeProvince.name,
      href: removeParam(sp, 'province', 'city'), // clear city too
    },
    activeCity && { label: activeCity.name, href: removeParam(sp, 'city') },
    activeGenre && { label: activeGenre.name, href: removeParam(sp, 'genre') },
    sp.open === 'true' && { label: 'Buka lowongan member', href: removeParam(sp, 'open') },
    sp.q && { label: `"${sp.q}"`, href: removeParam(sp, 'q') },
  ].filter(Boolean) as Chip[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-stone-900 dark:text-stone-100">Jelajahi Band</h1>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar — provinces & genres passed as props from server */}
        <aside className="w-full md:w-56 lg:w-64 shrink-0">
          <Suspense>
            <FilterBar />
          </Suspense>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chips.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-sm px-3 py-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                >
                  {chip.label}
                  <X className="w-3.5 h-3.5" />
                </Link>
              ))}
              <Link
                href="/browse"
                className="text-sm text-stone-400 px-3 py-1 rounded-full hover:text-red-500 transition-colors"
              >
                Hapus semua
              </Link>
            </div>
          )}

          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{bands.length} band ditemukan</p>

          {bands.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <p className="text-lg font-medium">Tidak ada band yang ditemukan</p>
              <p className="text-sm mt-1">
                Coba ubah filter atau{' '}
                <Link href="/browse" className="text-amber-600 hover:underline">
                  reset pencarian
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {bands.map((band) => (
                <BandCard key={band.id} band={band} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
