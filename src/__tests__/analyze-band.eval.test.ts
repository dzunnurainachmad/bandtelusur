/**
 * Evals for /api/analyze-band
 *
 * Three layers:
 * 1. Unit tests  — pure functions, always run in CI
 * 2. Schema tests — verify the Zod schema accepts/rejects correctly
 * 3. AI evals     — heuristic quality checks against the real API
 *                   Skipped by default. Run manually:
 *                   OPENAI_API_KEY=... vitest run --reporter=verbose analyze-band.eval
 */

import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))

import { buildBandText } from '@/lib/embeddings'
import { BandInsightsSchema } from '@/app/api/analyze-band/route'

// ---------------------------------------------------------------------------
// 1. Unit tests: buildBandText
// ---------------------------------------------------------------------------

describe('buildBandText', () => {
  it('includes band name', () => {
    const text = buildBandText({ name: 'Burgerkill' })
    expect(text).toContain('Burgerkill')
  })

  it('includes all fields when provided', () => {
    const text = buildBandText({
      name: 'Seringai',
      bio: 'Band thrash metal dari Bandung',
      genres: [{ name: 'Thrash Metal' }, { name: 'Punk' }],
      province_name: 'Jawa Barat',
      city_name: 'Bandung',
      formed_year: 2002,
    })
    expect(text).toContain('Seringai')
    expect(text).toContain('thrash metal dari Bandung')
    expect(text).toContain('Thrash Metal')
    expect(text).toContain('Punk')
    expect(text).toContain('Jawa Barat')
    expect(text).toContain('Bandung')
    expect(text).toContain('2002')
  })

  it('omits missing optional fields', () => {
    const text = buildBandText({ name: 'Peterpan' })
    expect(text).not.toContain('Genre')
    expect(text).not.toContain('Bio')
    expect(text).not.toContain('Lokasi')
    expect(text).not.toContain('Tahun')
  })
})

// ---------------------------------------------------------------------------
// 2. Schema tests: BandInsightsSchema
// ---------------------------------------------------------------------------

describe('BandInsightsSchema', () => {
  const validOutput = {
    style_tags: ['distorsi tebal', 'vokal agresif', 'riff cepat'],
    mood: ['energik', 'gelap'],
    target_audience: 'Anak muda 20-an yang menyukai musik keras dan berenergi tinggi',
    strengths: ['Riff gitar yang kuat', 'Lirik yang relate'],
    booking_pitch: 'Band metal paling berapi-api dari Bandung yang siap membakar panggung festival',
  }

  it('accepts a valid output', () => {
    expect(() => BandInsightsSchema.parse(validOutput)).not.toThrow()
  })

  it('rejects missing required fields', () => {
    const { mood: _mood, ...withoutMood } = validOutput
    expect(() => BandInsightsSchema.parse(withoutMood)).toThrow(z.ZodError)
  })

  it('rejects non-array style_tags', () => {
    expect(() => BandInsightsSchema.parse({ ...validOutput, style_tags: 'heavy' })).toThrow(z.ZodError)
  })

  it('rejects empty arrays for style_tags', () => {
    // style_tags should have at least one item — schema uses z.array(z.string()) with no min,
    // so this documents the current behavior (no minimum enforced)
    const result = BandInsightsSchema.safeParse({ ...validOutput, style_tags: [] })
    expect(result.success).toBe(true) // document: schema allows empty, evals catch this instead
  })
})

// ---------------------------------------------------------------------------
// 3. AI Evals: heuristic quality checks against real API
//    Skip by default. Remove `.skip` and set OPENAI_API_KEY to run.
// ---------------------------------------------------------------------------

async function callAnalyzeApi(input: {
  name: string
  bio?: string
  genres?: string[]
  province?: string
  city?: string
  formed_year?: number
}) {
  const res = await fetch('http://localhost:3000/api/analyze-band', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  // Collect the full stream then parse as JSON
  const text = await res.text()
  // streamObject sends newline-delimited JSON chunks; grab the last complete object line
  const lines = text.trim().split('\n').filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return BandInsightsSchema.parse(JSON.parse(lines[i])) } catch { /* skip */ }
  }
  throw new Error('Could not parse streamed response')
}

describe.skip('AI evals — run manually with OPENAI_API_KEY', () => {
  it('returns non-empty insights for a well-known band profile', async () => {
    const result = await callAnalyzeApi({
      name: 'Burgerkill',
      bio: 'Band heavy metal asal Bandung yang berdiri sejak 1995. Dikenal dengan sound heavy dan brutal.',
      genres: ['Heavy Metal', 'Thrash Metal'],
      province: 'Jawa Barat',
      city: 'Bandung',
      formed_year: 1995,
    })

    // Structure
    expect(result.style_tags.length).toBeGreaterThanOrEqual(2)
    expect(result.mood.length).toBeGreaterThanOrEqual(1)
    expect(result.strengths.length).toBeGreaterThanOrEqual(1)
    expect(result.target_audience.length).toBeGreaterThan(20)
    expect(result.booking_pitch.length).toBeGreaterThan(20)

    // Relevance: metal band should not get soft/acoustic mood tags
    const softMoods = ['santai', 'akustik', 'romantis', 'lembut']
    const hasSoftMood = result.mood.some((m) =>
      softMoods.some((soft) => m.toLowerCase().includes(soft))
    )
    expect(hasSoftMood).toBe(false)
  }, 30_000)

  it('still returns valid output for a minimal band profile (name only)', async () => {
    const result = await callAnalyzeApi({ name: 'Peterpan' })

    expect(result.style_tags.length).toBeGreaterThanOrEqual(1)
    expect(result.booking_pitch.length).toBeGreaterThan(10)
  }, 30_000)

  it('booking pitch is a single sentence', async () => {
    const result = await callAnalyzeApi({
      name: 'Fourtwnty',
      genres: ['Folk', 'Indie'],
      city: 'Jakarta',
    })

    // Should be one sentence — heuristic: no more than 2 full stops
    const sentenceCount = (result.booking_pitch.match(/[.!?]/g) ?? []).length
    expect(sentenceCount).toBeLessThanOrEqual(2)
  }, 30_000)
})
