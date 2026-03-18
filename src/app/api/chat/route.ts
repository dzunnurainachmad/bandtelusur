import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod/v4'
import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Kamu adalah asisten Bandly, platform untuk menemukan band Indonesia.
Jawab dalam Bahasa Indonesia dengan gaya santai dan menarik.
Gunakan tool semanticSearch untuk pencarian deskriptif atau bahasa alami (misal: "band indie dreamy dari Jogja", "band rock energik").
Gunakan tool searchBands untuk filter spesifik (genre tertentu, kota tertentu, nama band).
Jika user mencari posisi spesifik (drummer, vokalis, gitaris, dll), gunakan searchBands dengan parameter bio_search dan is_looking_for_members.
Setelah mendapat hasil dari tool, rangkum hasilnya dengan menarik. Sebutkan nama band, genre, lokasi, dan info penting lainnya.
Jika tidak ada hasil, sarankan kata kunci atau filter lain.
Jangan pernah mengarang data band — hanya gunakan data dari tool.`,
    messages: modelMessages,
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
      semanticSearch: tool({
        description: 'Pencarian semantik untuk menemukan band berdasarkan deskripsi natural language. Cocok untuk query deskriptif seperti "band indie dreamy dari Jogja" atau "band rock energik yang sering manggung"',
        inputSchema: z.object({
          query: z.string().describe('Deskripsi band yang dicari dalam bahasa alami'),
        }),
        execute: async ({ query }) => {
          const embedding = await generateEmbedding(query)
          const { data, error } = await supabase.rpc('search_bands_semantic', {
            query_embedding: JSON.stringify(embedding),
            match_threshold: 0.3,
            match_count: 10,
          })
          if (error) return { error: error.message, bands: [] }
          return {
            bands: (data ?? []).map((b: Record<string, unknown>) => ({
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
            total: (data ?? []).length,
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse()
}
