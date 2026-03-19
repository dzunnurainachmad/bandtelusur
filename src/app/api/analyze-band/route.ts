import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { buildAnalyzeBandPrompt } from '@/lib/prompts'

export const BandInsightsSchema = z.object({
  style_tags: z
    .array(z.string())
    .describe('3-5 kata kunci gaya musik spesifik, contoh: "distorsi tebal", "vokal melengking"'),
  mood: z
    .array(z.string())
    .describe('2-4 kata suasana/mood musik, contoh: "melankolis", "energik"'),
  target_audience: z
    .string()
    .describe('Satu kalimat deskripsi target pendengar, contoh: "Anak muda 20-an yang suka..."'),
  strengths: z
    .array(z.string())
    .describe('2-3 kelebihan band berdasarkan profil yang tersedia'),
  booking_pitch: z
    .string()
    .describe('Satu kalimat pitch singkat untuk event organizer'),
})

export type BandInsights = z.infer<typeof BandInsightsSchema>

export async function POST(req: Request) {
  const { name, bio, genres, province, city, formed_year } = await req.json()

  if (!name?.trim()) {
    return Response.json({ error: 'Nama band wajib diisi' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'API key tidak ditemukan' }, { status: 500 })
  }

  const profile = [
    `Nama: ${name}`,
    genres?.length && `Genre: ${genres.join(', ')}`,
    bio && `Bio: ${bio}`,
    (city || province) && `Lokasi: ${[city, province].filter(Boolean).join(', ')}`,
    formed_year && `Berdiri: ${formed_year}`,
  ]
    .filter(Boolean)
    .join('\n')

  const result = streamObject({
    model: openai('gpt-4o-mini'),
    output: 'object',
    schema: BandInsightsSchema,
    prompt: buildAnalyzeBandPrompt(profile),
  })

  return result.toTextStreamResponse()
}
