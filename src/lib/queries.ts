import { supabase } from './supabase'
import { supabaseBrowser } from './supabase-browser'
import type { BandFilters, Province, City, Genre, Band } from '@/types'

export async function getProvinces(): Promise<Province[]> {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getCitiesByProvince(provinceId: number): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('province_id', provinceId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export const BANDS_PER_PAGE = 12

export async function getBands(filters: BandFilters = {}, page = 0): Promise<{ bands: Band[]; hasMore: boolean }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  let query = supabase
    .from('bands_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.province_id) {
    query = query.eq('province_id', filters.province_id)
  }
  if (filters.city_id) {
    query = query.eq('city_id', filters.city_id)
  }
  if (filters.is_looking_for_members !== undefined) {
    query = query.eq('is_looking_for_members', filters.is_looking_for_members)
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  // If genre filter, fetch all (post-filter with OR logic); otherwise paginate
  if (filters.genre_ids && filters.genre_ids.length > 0) {
    const { data, error } = await query
    if (error) throw error
    const genreSet = new Set(filters.genre_ids)
    const all = (data ?? []).filter((b) =>
      Array.isArray(b.genres) &&
      b.genres.some((g: Genre) => genreSet.has(g.id))
    )
    return {
      bands: all.slice(from, to),
      hasMore: all.length > to,
    }
  }

  // Fetch one extra to check if there are more
  query = query.range(from, to)
  const { data, error } = await query
  if (error) throw error

  const all: Band[] = data ?? []
  const hasMore = all.length > BANDS_PER_PAGE

  return {
    bands: hasMore ? all.slice(0, BANDS_PER_PAGE) : all,
    hasMore,
  }
}

export async function getUserBands(userId: string, page = 0): Promise<{ bands: Band[]; hasMore: boolean }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  const { data, error } = await supabase
    .from('bands_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const all: Band[] = data ?? []
  const hasMore = all.length > BANDS_PER_PAGE

  return {
    bands: hasMore ? all.slice(0, BANDS_PER_PAGE) : all,
    hasMore,
  }
}

export async function searchBandsSemantic(query: string, page = 0): Promise<{ bands: Band[]; hasMore: boolean }> {
  const { generateEmbedding } = await import('./embeddings')
  const embedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('search_bands_semantic', {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.3,
    match_count: (page + 1) * BANDS_PER_PAGE + 1,
  })

  if (error) throw error

  const all: Band[] = data ?? []
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE
  const paged = all.slice(from, to)

  return { bands: paged, hasMore: all.length > to }
}

export async function getSimilarBands(bandId: string, count = 6): Promise<Band[]> {
  const { data, error } = await supabase.rpc('get_similar_bands', {
    band_id: bandId,
    match_count: count,
  })

  if (error) return []
  return data ?? []
}

export async function getBandById(id: string): Promise<Band | null> {
  const { data, error } = await supabase
    .from('bands_view')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createBand(band: {
  name: string
  bio?: string
  formed_year?: number
  province_id?: number
  city_id?: number
  contact_wa?: string
  instagram?: string
  youtube?: string
  spotify?: string
  youtube_music?: string
  apple_music?: string
  bandcamp?: string
  photo_url?: string
  is_looking_for_members?: boolean
  genre_ids: number[]
}) {
  const { genre_ids, ...bandData } = band

  const { data: { user } } = await supabaseBrowser.auth.getUser()

  const { data, error } = await supabaseBrowser
    .from('bands')
    .insert({ ...bandData, user_id: user?.id })
    .select('id')
    .single()

  if (error) throw error

  if (genre_ids.length > 0) {
    const { error: genreError } = await supabaseBrowser
      .from('band_genres')
      .insert(genre_ids.map((genre_id) => ({ band_id: data.id, genre_id })))
    if (genreError) throw genreError
  }

  // Generate embedding in background
  fetch('/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bandId: data.id }),
  }).catch(() => {})

  return data.id
}

export async function deleteBand(id: string) {
  const { error } = await supabaseBrowser.from('bands').delete().eq('id', id)
  if (error) throw error
}

export async function updateBand(id: string, band: {
  name: string
  bio?: string | null
  formed_year?: number | null
  province_id?: number | null
  city_id?: number | null
  contact_wa?: string | null
  instagram?: string | null
  youtube?: string | null
  spotify?: string | null
  youtube_music?: string | null
  apple_music?: string | null
  bandcamp?: string | null
  photo_url?: string | null
  is_looking_for_members?: boolean
  genre_ids: number[]
}) {
  const { genre_ids, ...bandData } = band

  const { error } = await supabaseBrowser
    .from('bands')
    .update(bandData)
    .eq('id', id)

  if (error) throw error

  await supabaseBrowser.from('band_genres').delete().eq('band_id', id)

  if (genre_ids.length > 0) {
    const { error: genreError } = await supabaseBrowser
      .from('band_genres')
      .insert(genre_ids.map((genre_id) => ({ band_id: id, genre_id })))
    if (genreError) throw genreError
  }

  // Re-generate embedding in background
  fetch('/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bandId: id }),
  }).catch(() => {})
}

export async function uploadBandPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabaseBrowser.storage
    .from('band-photos')
    .upload(filename, file, { upsert: false })

  if (error) throw error

  const { data } = supabaseBrowser.storage
    .from('band-photos')
    .getPublicUrl(filename)

  return data.publicUrl
}
