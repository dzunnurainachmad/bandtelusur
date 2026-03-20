import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { buildAnalyzePhotoPrompt } from '@/lib/prompts'
import { logAiCall } from '@/lib/ai-logger'
import { checkRateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'

const PhotoAnalysisSchema = z.object({
  suggested_genres: z.array(z.string()).describe('Genre musik yang cocok berdasarkan visual, pilih dari daftar yang tersedia'),
  vibe_tags: z.array(z.string()).describe('3-5 kata deskriptif vibe/estetika band, misal: underground, lo-fi, energik'),
})

export async function POST(req: Request) {
  const { allowed } = await checkRateLimit(`analyze-photo:${getIp(req)}`, 5, 60_000)
  if (!allowed) return rateLimitResponse()

  const { image, mimeType, availableGenres } = await req.json()

  if (!image) return Response.json({ error: 'Image required' }, { status: 400 })

  const startedAt = Date.now()

  const { object, usage } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: PhotoAnalysisSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image, mediaType: mimeType ?? 'image/jpeg' },
          { type: 'text', text: buildAnalyzePhotoPrompt(availableGenres ?? '') },
        ],
      },
    ],
  })

  logAiCall({
    route: 'analyze-photo',
    model: 'gpt-4o-mini',
    latencyMs: Date.now() - startedAt,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
  })

  return Response.json(object)
}
