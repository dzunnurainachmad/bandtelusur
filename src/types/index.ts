export interface Province {
  id: number
  name: string
  slug: string
}

export interface City {
  id: number
  name: string
  slug: string
  province_id: number
}

export interface Genre {
  id: number
  name: string
  slug: string
}

export interface Band {
  id: string
  name: string
  bio: string | null
  formed_year: number | null
  province_id: number | null
  city_id: number | null
  contact_wa: string | null
  instagram: string | null
  youtube: string | null
  spotify: string | null
  youtube_music: string | null
  apple_music: string | null
  bandcamp: string | null
  photo_url: string | null
  is_looking_for_members: boolean
  user_id: string | null
  created_at: string
  // from bands_view
  province_name?: string
  province_slug?: string
  city_name?: string
  city_slug?: string
  genres?: Genre[]
}

export interface BandFilters {
  province_id?: number
  city_id?: number
  genre_ids?: number[]
  is_looking_for_members?: boolean
  search?: string
}
