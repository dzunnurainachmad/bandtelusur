/**
 * BandTelusur Offline Eval Runner
 *
 * Runs AI quality evals with LLM-as-judge scoring.
 * Records prompt versions so results can be compared across versions over time.
 *
 * Usage:
 *   npm run eval                   — run all cases
 *   npm run eval -- --route chat   — run only chat cases
 *   npm run eval -- --id analyze-band-full-profile  — run one case by id
 *
 * Requirements:
 *   OPENAI_API_KEY must be set in .env.local
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { generateText, generateObject, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { CHAT_SYSTEM_PROMPT, buildAnalyzeBandPrompt, buildGenerateBioPrompt, PROMPT_VERSIONS } from '../src/lib/prompts'
import { BandInsightsSchema } from '../src/lib/schemas'
import { evalCases, MOCK_BANDS, type ChatEvalCase, type AnalyzeBandEvalCase, type GenerateBioEvalCase } from './eval-cases'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const routeFilter = args.includes('--route') ? args[args.indexOf('--route') + 1] : null
const idFilter = args.includes('--id') ? args[args.indexOf('--id') + 1] : null

// ---------------------------------------------------------------------------
// Judge schema
// ---------------------------------------------------------------------------

const CriterionResultSchema = z.object({
  criterion: z.string().describe('The criterion being evaluated (copy it verbatim)'),
  pass: z.boolean().describe('Whether the output meets this criterion'),
  reasoning: z.string().describe('One sentence explaining why it passes or fails'),
})

const JudgeResultSchema = z.object({
  criteria_results: z.array(CriterionResultSchema),
  overall_score: z.number().min(1).max(5).describe('Overall quality score from 1 to 5'),
  summary: z.string().describe('One sentence summary of the output quality'),
})

type JudgeResult = z.infer<typeof JudgeResultSchema>

// ---------------------------------------------------------------------------
// LLM-as-judge
// ---------------------------------------------------------------------------

async function judge(params: {
  caseId: string
  query: string
  toolCallsSummary: string
  output: string
  criteria: string[]
}): Promise<JudgeResult> {
  const criteriaList = params.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: JudgeResultSchema,
    prompt: `You are an eval judge for BandTelusur, an Indonesian band discovery platform.

Evaluate the following AI output against each criterion. Be strict but fair.

--- Query / Input ---
${params.query}

--- Tools Called ---
${params.toolCallsSummary || '(none)'}

--- AI Output ---
${params.output}

--- Criteria ---
${criteriaList}

For each criterion, decide pass/fail and give a one-sentence reasoning.
Then give an overall_score from 1–5 and a one-sentence summary.`,
  })

  return object
}

// ---------------------------------------------------------------------------
// Chat eval runner
// ---------------------------------------------------------------------------

async function runChatCase(c: ChatEvalCase): Promise<EvalResult> {
  const SearchBandsInputSchema = z.object({
    genre: z.string().optional(),
    province: z.string().optional(),
    city: z.string().optional(),
    is_looking_for_members: z.boolean().optional(),
    search: z.string().optional(),
    bio_search: z.string().optional(),
  })

  const SemanticSearchInputSchema = z.object({
    query: z.string(),
    city: z.string().optional(),
    province: z.string().optional(),
  })

  const GetBandDetailInputSchema = z.object({
    id: z.string(),
  })

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: c.query }],
    tools: {
      searchBands: tool({
        description: 'Cari band berdasarkan filter genre, lokasi, kebutuhan anggota, atau nama',
        inputSchema: SearchBandsInputSchema,
        execute: async () => ({ bands: MOCK_BANDS, total: MOCK_BANDS.length }),
      }),
      semanticSearch: tool({
        description: 'Pencarian semantik berdasarkan deskripsi natural language',
        inputSchema: SemanticSearchInputSchema,
        execute: async () => ({ bands: MOCK_BANDS.slice(0, 2), total: 2 }),
      }),
      getBandDetail: tool({
        description: 'Ambil detail lengkap satu band berdasarkan ID',
        inputSchema: GetBandDetailInputSchema,
        execute: async ({ id }) => ({ band: MOCK_BANDS.find((b) => b.id === id) ?? null }),
      }),
    },
    stopWhen: stepCountIs(3),
  })

  const firstTool = result.toolCalls[0]
  const toolCallsSummary = result.toolCalls
    .map((tc) => `${tc.toolName}(${JSON.stringify(tc.input)})`)
    .join('\n')

  // Hard-check: correct tool selected
  const toolCorrect = firstTool?.toolName === c.expectedTool
  const paramsCorrect = c.expectedParams
    ? Object.entries(c.expectedParams).every(
        ([k, v]) => JSON.stringify((firstTool?.input as Record<string, unknown>)?.[k]) === JSON.stringify(v)
      )
    : true

  const judgeResult = await judge({
    caseId: c.id,
    query: c.query,
    toolCallsSummary,
    output: result.text,
    criteria: c.criteria,
  })

  return {
    id: c.id,
    route: c.route,
    description: c.description,
    hardChecks: { toolCorrect, paramsCorrect },
    judgeResult,
    promptVersions: { chat: PROMPT_VERSIONS.chat },
  }
}

// ---------------------------------------------------------------------------
// Analyze-band eval runner
// ---------------------------------------------------------------------------

async function runAnalyzeBandCase(c: AnalyzeBandEvalCase): Promise<EvalResult> {
  const profile = [
    `Nama: ${c.input.name}`,
    c.input.genres?.length && `Genre: ${c.input.genres.join(', ')}`,
    c.input.bio && `Bio: ${c.input.bio}`,
    (c.input.city || c.input.province) && `Lokasi: ${[c.input.city, c.input.province].filter(Boolean).join(', ')}`,
    c.input.formed_year && `Berdiri: ${c.input.formed_year}`,
  ]
    .filter(Boolean)
    .join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    output: 'object',
    schema: BandInsightsSchema,
    prompt: buildAnalyzeBandPrompt(profile),
  })

  const outputSummary = JSON.stringify(object, null, 2)

  const judgeResult = await judge({
    caseId: c.id,
    query: `Band profile:\n${profile}`,
    toolCallsSummary: '(no tools — direct generation)',
    output: outputSummary,
    criteria: c.criteria,
  })

  return {
    id: c.id,
    route: c.route,
    description: c.description,
    hardChecks: {},
    judgeResult,
    promptVersions: { 'analyze-band': PROMPT_VERSIONS['analyze-band'] },
  }
}

// ---------------------------------------------------------------------------
// Generate-bio eval runner
// ---------------------------------------------------------------------------

async function runGenerateBioCase(c: GenerateBioEvalCase): Promise<EvalResult> {
  const details = [
    `Nama band: ${c.input.name}`,
    c.input.genre && `Genre: ${c.input.genre}`,
    c.input.formedYear && `Tahun berdiri: ${c.input.formedYear}`,
    c.input.location && `Lokasi: ${c.input.location}`,
  ]
    .filter(Boolean)
    .join('\n')

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: buildGenerateBioPrompt(details),
    maxOutputTokens: 300,
  })

  const judgeResult = await judge({
    caseId: c.id,
    query: `Generate bio for:\n${details}`,
    toolCallsSummary: '(no tools — direct generation)',
    output: text,
    criteria: c.criteria,
  })

  return {
    id: c.id,
    route: c.route,
    description: c.description,
    hardChecks: {},
    judgeResult,
    promptVersions: { 'generate-bio': PROMPT_VERSIONS['generate-bio'] },
  }
}

// ---------------------------------------------------------------------------
// Result type & report
// ---------------------------------------------------------------------------

interface EvalResult {
  id: string
  route: string
  description: string
  hardChecks: Record<string, boolean>
  judgeResult: JudgeResult
  promptVersions: Record<string, string>
}

function printResult(r: EvalResult) {
  const passingCriteria = r.judgeResult.criteria_results.filter((c) => c.pass).length
  const totalCriteria = r.judgeResult.criteria_results.length
  const hardFails = Object.entries(r.hardChecks).filter(([, v]) => !v).map(([k]) => k)
  const overallPass = hardFails.length === 0 && passingCriteria === totalCriteria

  const status = overallPass ? '✓' : '✗'
  const score = r.judgeResult.overall_score.toFixed(1)
  const label = `${r.id.padEnd(40)} [${passingCriteria}/${totalCriteria} criteria]  score: ${score}/5`

  console.log(`${status} ${label}`)

  if (!overallPass) {
    r.judgeResult.criteria_results
      .filter((c) => !c.pass)
      .forEach((c) => console.log(`    ✗ ${c.criterion}\n      → ${c.reasoning}`))
    if (hardFails.length > 0) {
      console.log(`    Hard check failures: ${hardFails.join(', ')}`)
    }
  }
}

function saveReport(results: EvalResult[]) {
  const reportsDir = path.join(__dirname, '..', 'evals', 'reports')
  fs.mkdirSync(reportsDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(reportsDir, `eval-${timestamp}.json`)

  const passed = results.filter(
    (r) =>
      Object.values(r.hardChecks).every(Boolean) &&
      r.judgeResult.criteria_results.every((c) => c.pass)
  ).length

  const avgScore =
    results.reduce((sum, r) => sum + r.judgeResult.overall_score, 0) / results.length

  const report = {
    timestamp: new Date().toISOString(),
    promptVersions: PROMPT_VERSIONS,
    summary: { total: results.length, passed, failed: results.length - passed, avgScore },
    results,
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  return reportPath
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set. Add it to .env.local')
    process.exit(1)
  }

  const promptVersionsList = Object.entries(PROMPT_VERSIONS)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')

  console.log('BandTelusur Eval Runner')
  console.log(`Prompt versions: ${promptVersionsList}`)

  let cases = evalCases
  if (routeFilter) cases = cases.filter((c) => c.route === routeFilter)
  if (idFilter) cases = cases.filter((c) => c.id === idFilter)

  if (cases.length === 0) {
    console.error(`No cases found for filter: ${routeFilter ?? idFilter}`)
    process.exit(1)
  }

  console.log(`Running ${cases.length} eval case${cases.length === 1 ? '' : 's'}...\n`)

  const results: EvalResult[] = []

  for (const c of cases) {
    process.stdout.write(`  Running ${c.id}... `)
    try {
      let result: EvalResult
      if (c.route === 'chat') result = await runChatCase(c)
      else if (c.route === 'analyze-band') result = await runAnalyzeBandCase(c as AnalyzeBandEvalCase)
      else result = await runGenerateBioCase(c as GenerateBioEvalCase)

      results.push(result)
      process.stdout.write('done\n')
    } catch (err) {
      process.stdout.write('ERROR\n')
      console.error(`  Failed to run ${c.id}:`, err)
    }
  }

  console.log('\n--- Results ---\n')
  results.forEach(printResult)

  const passed = results.filter(
    (r) =>
      Object.values(r.hardChecks).every(Boolean) &&
      r.judgeResult.criteria_results.every((c) => c.pass)
  ).length
  const avgScore = results.reduce((sum, r) => sum + r.judgeResult.overall_score, 0) / results.length

  console.log(`\nOverall: ${passed}/${results.length} passed, avg score: ${avgScore.toFixed(1)}/5`)

  const reportPath = saveReport(results)
  console.log(`Report saved to ${path.relative(process.cwd(), reportPath)}`)
}

main().catch((err) => {
  console.error('Eval runner failed:', err)
  process.exit(1)
})
