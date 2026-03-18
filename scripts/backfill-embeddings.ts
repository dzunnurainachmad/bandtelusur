import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildBandText(band: {
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

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${await res.text()}`)
  const data = await res.json()
  return data.data[0].embedding
}

async function main() {
  console.log('Fetching bands...')
  const { data: bands, error } = await supabase
    .from('bands_view')
    .select('id, name, bio, genres, province_name, city_name, formed_year')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); process.exit(1) }
  console.log(`Found ${bands.length} bands. Starting backfill...`)

  let success = 0
  let failed = 0

  for (const band of bands) {
    try {
      const text = buildBandText(band)
      const embedding = await generateEmbedding(text)

      const { error: updateError } = await supabase
        .from('bands')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', band.id)

      if (updateError) throw updateError

      success++
      console.log(`[${success}/${bands.length}] ✓ ${band.name}`)

      // Rate limit: 200ms delay between calls
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      failed++
      console.error(`✗ ${band.name}:`, err)
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`)
}

main()
