import { generateText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod/v4'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logAiCall } from '@/lib/ai-logger'
import { buildSubmitBandAgentPrompt, PROMPT_VERSIONS } from '@/lib/prompts'
import { SubmitBandAgentSchema } from '@/lib/schemas'

function parseJsonFromText(text: string) {
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = codeBlock?.[1] ?? text.match(/(\{[\s\S]*\})/)?.[1]
  if (!jsonStr) throw new Error('No JSON found')
  return JSON.parse(jsonStr)
}

export async function POST(req: Request) {
  const { url } = await req.json()
  if (!url?.trim()) {
    return Response.json({ error: 'URL diperlukan' }, { status: 400 })
  }

  const startedAt = Date.now()
  let stepCount = 0

  const { data: genreRows } = await supabase.from('genres').select('name').order('name')
  const availableGenres = genreRows?.map((g) => g.name).join(', ') ?? ''

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: buildSubmitBandAgentPrompt(availableGenres),
    prompt: `Ambil informasi band dari URL ini: ${url}`,
    tools: {
      fetchUrl: tool({
        description: 'Fetch konten halaman web dari URL',
        inputSchema: z.object({
          url: z.string().describe('URL halaman yang akan diambil'),
        }),
        execute: async ({ url: target }: { url: string }) => {
          try {
            const response = await fetch(target, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BandTelusurBot/1.0)' },
              signal: AbortSignal.timeout(10000),
            })
            if (!response.ok) return { error: `HTTP ${response.status}`, content: '' }
            const html = await response.text()
            const content = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 4000)
            return { content }
          } catch (err) {
            return { error: String(err), content: '' }
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
    onStepFinish: () => { stepCount++ },
  })

  const latencyMs = Date.now() - startedAt

  logAiCall({
    route: 'agents/submit-band',
    model: 'gpt-4o-mini',
    latencyMs,
    promptVersion: PROMPT_VERSIONS['submit-band'],
  })

  let result: unknown
  let parseError = false
  try {
    result = SubmitBandAgentSchema.parse(parseJsonFromText(text))
  } catch {
    parseError = true
    result = {
      name: null, bio: null, instagram: null, youtube: null,
      spotify: null, formed_year: null, suggested_genres: [],
      confidence: { name: 'low', bio: 'low', genres: 'low' },
      flags: ['Gagal mengurai respons AI'],
    }
  }

  await supabaseAdmin.from('agent_runs').insert({
    agent_type: 'submit-band',
    input: { url },
    output: result,
    steps_taken: stepCount,
    status: parseError ? 'failed' : 'completed',
  })

  return Response.json(result)
}
