import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildAnalyzeBandPrompt, PROMPT_VERSIONS } from '@/lib/prompts'
import { logAiCall } from '@/lib/ai-logger'
import { BandInsightsSchema } from '@/lib/schemas'
import { supabaseAdmin } from '@/lib/supabase-admin'

export { BandInsightsSchema } from '@/lib/schemas'
export type { BandInsights } from '@/lib/schemas'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const band_id = searchParams.get('band_id')
  if (!band_id) return Response.json(null)

  const { data } = await supabaseAdmin
    .from('bands')
    .select('insights, insights_cached_at')
    .eq('id', band_id)
    .single()

  if (!data?.insights) return Response.json(null)
  return Response.json(data)
}

export async function POST(req: Request) {
  const { name, bio, genres, province, city, formed_year, band_id } = await req.json()
  const startedAt = Date.now()

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
    onFinish: ({ object, usage }) => {
      logAiCall({
        route: 'analyze-band',
        model: 'gpt-4o-mini',
        latencyMs: Date.now() - startedAt,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        bandId: band_id,
        promptVersion: PROMPT_VERSIONS['analyze-band'],
      })
      if (band_id && object) {
        supabaseAdmin
          .from('bands')
          .update({ insights: object, insights_cached_at: new Date().toISOString() })
          .eq('id', band_id)
          .then()
      }
    },
  })

  return result.toTextStreamResponse()
}
