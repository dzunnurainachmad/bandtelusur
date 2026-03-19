import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildGenerateBioPrompt, PROMPT_VERSIONS } from '@/lib/prompts'
import { logAiCall } from '@/lib/ai-logger'

export async function POST(req: Request) {
  const { name, genre, formedYear, location } = await req.json()
  const startedAt = Date.now()

  if (!name?.trim()) {
    return new Response('Nama band wajib diisi', { status: 400 })
  }

  const details = [
    `Nama band: ${name}`,
    genre && `Genre: ${genre}`,
    formedYear && `Tahun berdiri: ${formedYear}`,
    location && `Lokasi: ${location}`,
  ].filter(Boolean).join('\n')

  const result = streamText({
    model: openai('gpt-4o-mini'),
    prompt: buildGenerateBioPrompt(details),
    maxOutputTokens: 300,
    onFinish: ({ usage }) => {
      logAiCall({
        route: 'generate-bio',
        model: 'gpt-4o-mini',
        latencyMs: Date.now() - startedAt,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        promptVersion: PROMPT_VERSIONS['generate-bio'],
      })
    },
  })

  return result.toTextStreamResponse()
}
