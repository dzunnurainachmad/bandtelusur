import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logAiCall } from '@/lib/ai-logger'
import { buildWeeklyInsightsPrompt, PROMPT_VERSIONS } from '@/lib/prompts'
import { WeeklyInsightsSchema } from '@/lib/schemas'

function parseJsonFromText(text: string) {
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = codeBlock?.[1] ?? text.match(/(\{[\s\S]*\})/)?.[1]
  if (!jsonStr) throw new Error('No JSON found')
  return JSON.parse(jsonStr)
}

// Accepts GET (for Vercel Cron) or POST (for manual trigger)
export async function GET() {
  return run()
}

export async function POST() {
  return run()
}

async function run() {
  const periodEnd = new Date()
  const periodStart = new Date(periodEnd)
  periodStart.setDate(periodStart.getDate() - 7)

  const startedAt = Date.now()

  // Fetch new bands from the last 7 days with genres and province
  const { data: bands, error } = await supabaseAdmin
    .from('bands_view')
    .select('id, name, bio, province_name, city_name, genres, formed_year, created_at')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const bandList = bands ?? []

  if (bandList.length === 0) {
    return Response.json({ message: 'Tidak ada band baru dalam 7 hari terakhir', total: 0 })
  }

  // Build compact data string for the LLM
  const dataStr = bandList.map((b) => {
    const genres = Array.isArray(b.genres) ? b.genres.map((g: { name: string }) => g.name).join(', ') : '-'
    return `- ${b.name} | ${b.province_name ?? 'Unknown'} | ${genres}`
  }).join('\n')

  const summary = `Total band baru: ${bandList.length}\nPeriode: ${periodStart.toISOString().split('T')[0]} s/d ${periodEnd.toISOString().split('T')[0]}\n\nDaftar band:\n${dataStr}`

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: buildWeeklyInsightsPrompt(summary),
  })

  const latencyMs = Date.now() - startedAt

  logAiCall({
    route: 'agents/weekly-insights',
    model: 'gpt-4o-mini',
    latencyMs,
    promptVersion: PROMPT_VERSIONS['weekly-insights'],
  })

  let report: unknown
  let parseError = false
  try {
    report = WeeklyInsightsSchema.parse(parseJsonFromText(text))
  } catch {
    parseError = true
    report = { raw: text }
  }

  // Save report to weekly_reports table
  await supabaseAdmin.from('weekly_reports').insert({
    period_start: periodStart.toISOString().split('T')[0],
    period_end: periodEnd.toISOString().split('T')[0],
    report,
  })

  await supabaseAdmin.from('agent_runs').insert({
    agent_type: 'weekly-insights',
    input: { period_start: periodStart.toISOString(), period_end: periodEnd.toISOString() },
    output: report,
    steps_taken: 1,
    status: parseError ? 'failed' : 'completed',
  })

  return Response.json({ success: true, report })
}
