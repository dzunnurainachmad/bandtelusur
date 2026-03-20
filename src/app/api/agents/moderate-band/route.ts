import { generateText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod/v4'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logAiCall } from '@/lib/ai-logger'
import { MODERATE_BAND_AGENT_PROMPT, PROMPT_VERSIONS } from '@/lib/prompts'
import { ModerationVerdictSchema } from '@/lib/schemas'
import { checkRateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

function parseJsonFromText(text: string) {
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = codeBlock?.[1] ?? text.match(/(\{[\s\S]*\})/)?.[1]
  if (!jsonStr) throw new Error('No JSON found')
  return JSON.parse(jsonStr)
}

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(`moderate-band-agent:${getIp(req)}`, 5, 60_000)
  if (!allowed) return rateLimitResponse()

  const { band_id, flag_id } = await req.json()
  if (!band_id) {
    return Response.json({ error: 'band_id diperlukan' }, { status: 400 })
  }

  const startedAt = Date.now()
  let stepCount = 0

  const { data: genreRows } = await supabase.from('genres').select('name').order('name')
  const availableGenres = genreRows?.map((g) => g.name).join(', ') ?? ''

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: MODERATE_BAND_AGENT_PROMPT,
    prompt: `Moderasi band dengan ID: ${band_id}. Genre tersedia di platform: ${availableGenres}`,
    tools: {
      getBandData: tool({
        description: 'Ambil data lengkap band dari database',
        inputSchema: z.object({ id: z.string() }),
        execute: async ({ id }: { id: string }) => {
          const { data, error } = await supabase
            .from('bands_view')
            .select('*')
            .eq('id', id)
            .single()
          if (error || !data) return { error: 'Band tidak ditemukan' }
          return {
            id: data.id,
            name: data.name,
            bio: data.bio ?? '',
            photo_url: data.photo_url ?? null,
            province_name: data.province_name,
            city_name: data.city_name,
            genres: data.genres,
            formed_year: data.formed_year,
            instagram: data.instagram,
          }
        },
      }),

      analyzePhoto: tool({
        description: 'Analisis foto band untuk memeriksa kelayakan konten',
        inputSchema: z.object({
          photo_url: z.string().describe('URL foto band yang akan dianalisis'),
          available_genres: z.string().describe('Daftar genre yang tersedia di platform'),
        }),
        execute: async ({ photo_url, available_genres }: { photo_url: string; available_genres: string }) => {
          try {
            const { generateObject } = await import('ai')
            const { z: zodLocal } = await import('zod')
            const PhotoCheckSchema = zodLocal.object({
              appropriate: zodLocal.boolean().describe('Apakah foto layak tampil di platform musik?'),
              concerns: zodLocal.array(zodLocal.string()).describe('Kekhawatiran konten jika ada'),
              suggested_genres: zodLocal.array(zodLocal.string()).describe('Genre yang cocok berdasarkan visual'),
              vibe_tags: zodLocal.array(zodLocal.string()).describe('Tag vibe/estetika'),
            })
            const { object } = await generateObject({
              model: openai('gpt-4o-mini'),
              schema: PhotoCheckSchema,
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', image: new URL(photo_url) },
                  {
                    type: 'text',
                    text: `Periksa foto band ini. Genre tersedia: ${available_genres}. Apakah foto ini layak untuk platform musik?`,
                  },
                ],
              }],
            })
            return object
          } catch (err) {
            return { error: String(err), appropriate: true, concerns: [], suggested_genres: [], vibe_tags: [] }
          }
        },
      }),

      getSimilarBands: tool({
        description: 'Cari band yang mirip untuk mendeteksi kemungkinan duplikat',
        inputSchema: z.object({ band_id: z.string() }),
        execute: async ({ band_id }: { band_id: string }) => {
          const { data, error } = await supabase.rpc('get_similar_bands', {
            band_id,
            match_count: 5,
          })
          if (error) return { error: error.message, similar_bands: [] }
          return {
            similar_bands: (data ?? []).map((b: Record<string, unknown>) => ({
              id: b.id,
              name: b.name,
              similarity: b.similarity,
            })),
          }
        },
      }),
    },
    stopWhen: stepCountIs(5),
    onStepFinish: () => { stepCount++ },
  })

  const latencyMs = Date.now() - startedAt

  logAiCall({
    route: 'agents/moderate-band',
    model: 'gpt-4o-mini',
    latencyMs,
    bandId: band_id,
    promptVersion: PROMPT_VERSIONS['moderate-band'],
  })

  let verdict: unknown
  let parseError = false
  try {
    verdict = ModerationVerdictSchema.parse(parseJsonFromText(text))
  } catch {
    parseError = true
    verdict = {
      verdict: 'needs_review',
      confidence: 'low',
      reasoning: 'Gagal mengurai respons AI — perlu review manual.',
      checks: {
        bio_quality: { ok: true, notes: 'Tidak dapat dievaluasi' },
        photo_appropriate: { ok: true, notes: 'Tidak dapat dievaluasi' },
        duplicate_risk: { ok: true, notes: 'Tidak dapat dievaluasi', similar_count: 0 },
      },
    }
  }

  await supabaseAdmin.from('agent_runs').insert({
    agent_type: 'moderate-band',
    input: { band_id, flag_id },
    output: verdict,
    steps_taken: stepCount,
    status: parseError ? 'failed' : 'completed',
  })

  // Save verdict to flag row if flag_id was provided
  if (flag_id) {
    await supabaseAdmin
      .from('band_flags')
      .update({ moderation_result: verdict })
      .eq('id', flag_id)
  }

  return Response.json(verdict)
}
