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

function sortBands(bands: Band[], sort?: string): Band[] {
  const copy = [...bands]
  switch (sort) {
    case 'name_asc':    return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':   return copy.sort((a, b) => b.name.localeCompare(a.name))
    case 'updated_asc': return copy.sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? ''))
    default:            return copy.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
  }
}

export async function getBands(filters: BandFilters = {}, page = 0): Promise<{ bands: Band[]; hasMore: boolean; total: number | null }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  const sortCol = filters.sort === 'name_asc' || filters.sort === 'name_desc' ? 'name' : 'updated_at'
  const sortAsc = filters.sort === 'name_asc' || filters.sort === 'updated_asc'

  let query = supabase
    .from('bands_view')
    .select('*')
    .eq('is_active', true)
    .order(sortCol, { ascending: sortAsc })

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

  // If genre filter, use RPC for server-side pagination
  if (filters.genre_ids && filters.genre_ids.length > 0) {
    const rpcParams = {
      genre_ids: filters.genre_ids,
      province_filter: filters.province_id ?? null,
      city_filter: filters.city_id ?? null,
      looking_for_members: filters.is_looking_for_members ?? null,
      search_term: filters.search ?? null,
    }
    const [{ data, error }, { data: countData }] = await Promise.all([
      supabase.rpc('filter_bands_by_genre', { ...rpcParams, page_offset: from, page_limit: BANDS_PER_PAGE + 1 }),
      supabase.rpc('count_bands_by_genre', rpcParams),
    ])
    if (error) throw error
    const all: Band[] = sortBands(data ?? [], filters.sort)
    const hasMore = all.length > BANDS_PER_PAGE
    return {
      bands: hasMore ? all.slice(0, BANDS_PER_PAGE) : all,
      hasMore,
      total: typeof countData === 'number' ? countData : null,
    }
  }

  // Count query (lightweight HEAD request)
  let countQuery = supabase.from('bands_view').select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (filters.province_id) countQuery = countQuery.eq('province_id', filters.province_id)
  if (filters.city_id) countQuery = countQuery.eq('city_id', filters.city_id)
  if (filters.is_looking_for_members !== undefined) countQuery = countQuery.eq('is_looking_for_members', filters.is_looking_for_members)
  if (filters.search) countQuery = countQuery.ilike('name', `%${filters.search}%`)

  // Fetch one extra to check if there are more
  query = query.range(from, to)
  const [{ data, error }, { count }] = await Promise.all([query, countQuery])
  if (error) throw error

  const all: Band[] = data ?? []
  const hasMore = all.length > BANDS_PER_PAGE

  return {
    bands: hasMore ? all.slice(0, BANDS_PER_PAGE) : all,
    hasMore,
    total: count ?? null,
  }
}

export async function getUserBands(userId: string, page = 0, activeOnly = false): Promise<{ bands: Band[]; hasMore: boolean }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  let query = supabase
    .from('bands_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query

  if (error) throw error

  const all: Band[] = data ?? []
  const hasMore = all.length > BANDS_PER_PAGE

  return {
    bands: hasMore ? all.slice(0, BANDS_PER_PAGE) : all,
    hasMore,
  }
}

export async function getActiveBandsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('bands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return count ?? 0
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getBandById(idOrUsername: string): Promise<Band | null> {
  const col = UUID_RE.test(idOrUsername) ? 'id' : 'username'
  const { data, error } = await supabase
    .from('bands_view')
    .select('*')
    .eq(col, idOrUsername)
    .single()
  if (error) return null
  return data
}

export async function createBand(band: {
  name: string
  username: string
  bio?: string
  formed_year?: number
  province_id?: number
  city_id?: number
  contact_wa?: string
  contact_email?: string
  instagram?: string
  youtube?: string
  spotify?: string
  youtube_music?: string
  apple_music?: string
  bandcamp?: string
  photo_url?: string
  is_looking_for_members?: boolean
  genre_ids: number[]
}): Promise<{ id: string; username: string | null }> {
  const { genre_ids, ...bandData } = band

  const { data: { user } } = await supabaseBrowser.auth.getUser()

  const { data, error } = await supabaseBrowser
    .from('bands')
    .insert({ ...bandData, user_id: user?.id })
    .select('id, username')
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

  return { id: data.id, username: data.username }
}

export async function deleteBand(id: string) {
  const { error } = await supabaseBrowser.from('bands').delete().eq('id', id)
  if (error) throw error
}

export async function updateBand(id: string, band: {
  name: string
  username: string
  bio?: string | null
  formed_year?: number | null
  province_id?: number | null
  city_id?: number | null
  contact_wa?: string | null
  contact_email?: string | null
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
