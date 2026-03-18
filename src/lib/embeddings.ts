import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'

const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings'

export function buildBandText(band: {
  name: string
  bio?: string | null
  genres?: { name: string }[]
  province_name?: string
  city_name?: string
  formed_year?: number | null
}): string {
  const parts = [`Nama: ${band.name}`]
  if (band.bio) parts.push(`Bio: ${band.bio}`)
  if (band.genres?.length) parts.push(`Genre: ${band.genres.map((g) => g.name).join(', ')}`)
  const location = [band.city_name, band.province_name].filter(Boolean).join(', ')
  if (location) parts.push(`Lokasi: ${location}`)
  if (band.formed_year) parts.push(`Tahun berdiri: ${band.formed_year}`)
  return parts.join('. ')
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

export async function updateBandEmbedding(bandId: string) {
  const { data: band, error } = await supabase
    .from('bands_view')
    .select('name, bio, genres, province_name, city_name, formed_year')
    .eq('id', bandId)
    .single()

  if (error || !band) return

  const text = buildBandText(band)
  const embedding = await generateEmbedding(text)

  await supabaseAdmin
    .from('bands')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', bandId)
}
