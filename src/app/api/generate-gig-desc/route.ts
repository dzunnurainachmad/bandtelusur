import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildGenerateGigDescPrompt, PROMPT_VERSIONS } from '@/lib/prompts'
import { logAiCall } from '@/lib/ai-logger'
import { checkRateLimit, getIp, rateLimitResponse } from '@/lib/rate-limit'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { allowed } = await checkRateLimit(`generate-gig-desc:${getIp(req)}`, 5, 60_000)
  if (!allowed) return rateLimitResponse()

  const { title, bands, location, eventDate, ticketPrice } = await req.json()

  if (!title?.trim()) return new Response('Judul wajib diisi', { status: 400 })

  const startedAt = Date.now()

  const details = [
    `Judul acara: ${title}`,
    bands?.length  && `Band tampil: ${(bands as string[]).join(', ')}`,
    location       && `Lokasi: ${location}`,
    eventDate      && `Tanggal: ${new Date(eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}`,
    ticketPrice    && `Harga tiket: ${ticketPrice}`,
  ].filter(Boolean).join('\n')

  const result = streamText({
    model: openai('gpt-4o-mini'),
    prompt: buildGenerateGigDescPrompt(details),
    maxOutputTokens: 300,
    onFinish: ({ usage }) => {
      logAiCall({
        route: 'generate-gig-desc',
        model: 'gpt-4o-mini',
        latencyMs: Date.now() - startedAt,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        promptVersion: PROMPT_VERSIONS['generate-gig-desc'],
      })
    },
  })

  return result.toTextStreamResponse()
}
