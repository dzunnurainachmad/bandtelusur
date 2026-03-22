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
  username: string
  name: string
  bio: string | null
  formed_year: number | null
  province_id: number | null
  city_id: number | null
  contact_wa: string | null
  contact_email: string | null
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
  updated_at: string
  // from bands_view
  province_name?: string
  province_slug?: string
  city_name?: string
  city_slug?: string
  owner_display_name?: string | null
  owner_username?: string | null
  genres?: Genre[]
}

export interface TaggedBand {
  id: string
  name: string
  username: string | null
  photo_url: string | null
}

export interface Post {
  id: string
  user_id: string
  type: 'gig' | 'general'
  title: string
  body: string | null
  event_date: string | null
  location: string | null
  ticket_price: string | null
  ticket_url: string | null
  created_at: string
  updated_at: string
  // from posts_view
  author_display_name: string | null
  author_username: string | null
  author_avatar_url: string | null
  // joined client-side
  tagged_bands?: TaggedBand[]
}

export type SortOption = 'name_asc' | 'name_desc' | 'updated_asc' | 'updated_desc'

export interface BandFilters {
  province_id?: number
  city_id?: number
  genre_ids?: number[]
  is_looking_for_members?: boolean
  search?: string
  sort?: SortOption
}
