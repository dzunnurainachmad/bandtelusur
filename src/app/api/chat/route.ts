import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod/v4'
import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'
import { CHAT_SYSTEM_PROMPT, PROMPT_VERSIONS } from '@/lib/prompts'
import { logAiCall } from '@/lib/ai-logger'
import { checkRateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(`chat:${getIp(req)}`, 15, 60_000)
  if (!allowed) return rateLimitResponse()

  const { messages } = await req.json()
  const modelMessages = await convertToModelMessages(messages)
  const startedAt = Date.now()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: CHAT_SYSTEM_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 600,
    tools: {
      searchBands: tool({
        description: 'Cari band berdasarkan filter genre, lokasi (provinsi/kota), kebutuhan anggota, atau nama',
        inputSchema: z.object({
          genre: z.string().optional().describe('Nama genre musik, misal: punk, metal, pop, jazz'),
          province: z.string().optional().describe('Nama provinsi, misal: DI Yogyakarta, Jawa Barat'),
          city: z.string().optional().describe('Nama kota, misal: Yogyakarta, Bandung, Jakarta'),
          is_looking_for_members: z.boolean().optional().describe('true jika mencari band yang butuh anggota baru'),
          search: z.string().optional().describe('Kata kunci nama band'),
          bio_search: z.string().optional().describe('Kata kunci untuk dicari di bio/deskripsi band, misal: drummer, vokalis, gitaris, bassist, keyboardist'),
        }),
        execute: async ({ genre, province, city, is_looking_for_members, search, bio_search }) => {
          let query = supabase
            .from('bands_view')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

          if (province) query = query.ilike('province_name', `%${province}%`)
          if (city) query = query.ilike('city_name', `%${city}%`)
          if (is_looking_for_members !== undefined) query = query.eq('is_looking_for_members', is_looking_for_members)
          if (search) query = query.ilike('name', `%${search}%`)
          if (bio_search) query = query.ilike('bio', `%${bio_search}%`)

          const { data, error } = await query
          if (error) return { error: error.message, bands: [] }

          let bands = data ?? []

          if (genre) {
            bands = bands.filter((b) =>
              Array.isArray(b.genres) &&
              b.genres.some((g: { name: string }) =>
                g.name.toLowerCase().includes(genre.toLowerCase())
              )
            )
          }

          return {
            bands: bands.map((b) => ({
              id: b.id,
              name: b.name,
              bio: b.bio,
              province_name: b.province_name,
              city_name: b.city_name,
              genres: b.genres,
              is_looking_for_members: b.is_looking_for_members,
              photo_url: b.photo_url,
              formed_year: b.formed_year,
            })),
            total: bands.length,
          }
        },
      }),
      getBandDetail: tool({
        description: 'Ambil detail lengkap satu band berdasarkan ID. Gunakan setelah searchBands atau semanticSearch jika user minta info lebih lanjut tentang band tertentu.',
        inputSchema: z.object({
          id: z.string().describe('ID band yang ingin dilihat detailnya'),
        }),
        execute: async ({ id }) => {
          const { data, error } = await supabase
            .from('bands_view')
            .select('*')
            .eq('id', id)
            .single()

          if (error || !data) return { error: 'Band tidak ditemukan' }

          return {
            band: {
              id: data.id,
              name: data.name,
              bio: data.bio,
              formed_year: data.formed_year,
              province_name: data.province_name,
              city_name: data.city_name,
              genres: data.genres,
              is_looking_for_members: data.is_looking_for_members,
              photo_url: data.photo_url,
              instagram: data.instagram,
              youtube: data.youtube,
              spotify: data.spotify,
              youtube_music: data.youtube_music,
              apple_music: data.apple_music,
              bandcamp: data.bandcamp,
              contact_wa: data.contact_wa,
            },
          }
        },
      }),
      semanticSearch: tool({
        description: 'Pencarian semantik untuk menemukan band berdasarkan deskripsi natural language. JANGAN gunakan untuk query berbasis lokasi — gunakan searchBands dengan city/province. Cocok untuk query deskriptif seperti "band yang musiknya dreamy" atau "band rock energik"',
        inputSchema: z.object({
          query: z.string().describe('Deskripsi band yang dicari dalam bahasa alami'),
          city: z.string().optional().describe('Filter opsional nama kota untuk mempersempit hasil'),
          province: z.string().optional().describe('Filter opsional nama provinsi untuk mempersempit hasil'),
        }),
        execute: async ({ query, city, province }) => {
          const embedding = await generateEmbedding(query)
          const { data, error } = await supabase.rpc('search_bands_semantic', {
            query_embedding: JSON.stringify(embedding),
            match_threshold: 0.3,
            match_count: 20,
          })
          if (error) return { error: error.message, bands: [] }

          let bands = data ?? []

          // Post-filter by location if specified
          if (city) {
            bands = bands.filter((b: Record<string, unknown>) =>
              typeof b.city_name === 'string' && b.city_name.toLowerCase().includes(city.toLowerCase())
            )
          }
          if (province) {
            bands = bands.filter((b: Record<string, unknown>) =>
              typeof b.province_name === 'string' && b.province_name.toLowerCase().includes(province.toLowerCase())
            )
          }

          return {
            bands: bands.slice(0, 10).map((b: Record<string, unknown>) => ({
              id: b.id,
              name: b.name,
              bio: b.bio,
              province_name: b.province_name,
              city_name: b.city_name,
              genres: b.genres,
              is_looking_for_members: b.is_looking_for_members,
              photo_url: b.photo_url,
              formed_year: b.formed_year,
            })),
            total: bands.length,
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
    onFinish: ({ usage }) => {
      logAiCall({
        route: 'chat',
        model: 'gpt-4o-mini',
        latencyMs: Date.now() - startedAt,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        promptVersion: PROMPT_VERSIONS.chat,
      })
    },
  })

  return result.toUIMessageStreamResponse()
}
