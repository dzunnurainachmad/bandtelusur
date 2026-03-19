/**
 * Evals for /api/chat
 *
 * Three layers:
 * 1. Unit tests  — assert system prompt contains required routing rules
 * 2. Schema tests — verify tool input schemas accept/reject correctly
 * 3. AI evals     — verify tool selection behavior against the real model
 *                   Skipped by default. Run manually:
 *                   OPENAI_API_KEY=... vitest run --reporter=verbose chat.eval
 */

import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))

import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts'

// ---------------------------------------------------------------------------
// Tool input schemas (mirrors production definitions in chat/route.ts)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 1. Unit tests: CHAT_SYSTEM_PROMPT routing rules
// ---------------------------------------------------------------------------

describe('CHAT_SYSTEM_PROMPT', () => {
  it('instructs to use searchBands for city/province queries', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('searchBands')
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toMatch(/kota|provinsi|city|province/)
  })

  it('instructs to use semanticSearch for descriptive queries without location', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('semanticSearch')
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toMatch(/deskriptif|descriptive|tanpa lokasi/)
  })

  it('instructs to use is_looking_for_members and bio_search for member searches', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('is_looking_for_members')
    expect(CHAT_SYSTEM_PROMPT).toContain('bio_search')
  })

  it('prohibits fabricating band data', () => {
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toMatch(/jangan.*karang|tidak.*karang|hanya.*data/)
  })

  it('instructs response in Bahasa Indonesia', () => {
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toMatch(/bahasa indonesia/)
  })
})

// ---------------------------------------------------------------------------
// 2. Schema tests: tool input schemas
// ---------------------------------------------------------------------------

describe('searchBands input schema', () => {
  it('accepts an empty object (all params optional)', () => {
    expect(() => SearchBandsInputSchema.parse({})).not.toThrow()
  })

  it('accepts full params', () => {
    expect(() =>
      SearchBandsInputSchema.parse({
        genre: 'metal',
        province: 'Jawa Barat',
        city: 'Bandung',
        is_looking_for_members: true,
        search: 'Burgerkill',
        bio_search: 'drummer',
      })
    ).not.toThrow()
  })

  it('rejects non-boolean is_looking_for_members', () => {
    expect(() =>
      SearchBandsInputSchema.parse({ is_looking_for_members: 'yes' })
    ).toThrow(z.ZodError)
  })
})

describe('semanticSearch input schema', () => {
  it('requires a query string', () => {
    expect(() => SemanticSearchInputSchema.parse({})).toThrow(z.ZodError)
  })

  it('accepts query with optional location filters', () => {
    expect(() =>
      SemanticSearchInputSchema.parse({
        query: 'band dengan suara dreamy dan melankolis',
        province: 'DI Yogyakarta',
      })
    ).not.toThrow()
  })
})

describe('getBandDetail input schema', () => {
  it('requires an id string', () => {
    expect(() => GetBandDetailInputSchema.parse({})).toThrow(z.ZodError)
  })

  it('accepts a valid uuid-like id', () => {
    expect(() =>
      GetBandDetailInputSchema.parse({ id: 'abc123-def456' })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 3. AI Evals: tool selection behavior against real model
//    Skip by default. Remove `.skip` and set OPENAI_API_KEY to run.
// ---------------------------------------------------------------------------

describe.skip('AI evals — run manually with OPENAI_API_KEY', () => {
  // Lazy import to avoid loading AI SDK during unit test run
  async function runChatEval(userQuery: string) {
    const { generateText, tool, stepCountIs } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const mockBands = [
      {
        id: 'band-001',
        name: 'Seringai',
        bio: 'Band thrash metal dari Bandung yang berdiri sejak 2002.',
        city_name: 'Bandung',
        province_name: 'Jawa Barat',
        genres: [{ name: 'Thrash Metal' }],
        is_looking_for_members: false,
        formed_year: 2002,
        photo_url: null,
      },
      {
        id: 'band-002',
        name: 'Feast',
        bio: 'Band indie rock dari Jakarta dengan lirik introspektif.',
        city_name: 'Jakarta',
        province_name: 'DKI Jakarta',
        genres: [{ name: 'Indie Rock' }],
        is_looking_for_members: true,
        formed_year: 2014,
        photo_url: null,
      },
    ]

    return generateText({
      model: openai('gpt-4o-mini'),
      system: CHAT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userQuery }],
      tools: {
        searchBands: tool({
          description: 'Cari band berdasarkan filter genre, lokasi, kebutuhan anggota, atau nama',
          inputSchema: SearchBandsInputSchema,
          execute: async () => ({ bands: mockBands, total: mockBands.length }),
        }),
        semanticSearch: tool({
          description: 'Pencarian semantik berdasarkan deskripsi natural language',
          inputSchema: SemanticSearchInputSchema,
          execute: async () => ({ bands: mockBands.slice(0, 1), total: 1 }),
        }),
        getBandDetail: tool({
          description: 'Ambil detail lengkap satu band berdasarkan ID',
          inputSchema: GetBandDetailInputSchema,
          execute: async ({ id }) => ({ band: mockBands.find((b) => b.id === id) ?? null }),
        }),
      },
      stopWhen: stepCountIs(3),
    })
  }

  it('uses searchBands (not semanticSearch) for a city-specific query', async () => {
    const result = await runChatEval('Cariin band punk dari Bandung dong')

    expect(result.toolCalls.length).toBeGreaterThan(0)
    const firstCall = result.toolCalls[0]
    expect(firstCall.toolName).toBe('searchBands')
    expect(JSON.stringify(firstCall.input).toLowerCase()).toContain('bandung')
  }, 30_000)

  it('uses semanticSearch for a descriptive query without location', async () => {
    const result = await runChatEval('Rekomendasiin band yang musiknya dreamy dan melankolis')

    expect(result.toolCalls.length).toBeGreaterThan(0)
    const firstCall = result.toolCalls[0]
    expect(firstCall.toolName).toBe('semanticSearch')
  }, 30_000)

  it('uses searchBands with is_looking_for_members for member recruitment queries', async () => {
    const result = await runChatEval('Ada band yang lagi nyari drummer nggak?')

    expect(result.toolCalls.length).toBeGreaterThan(0)
    const firstCall = result.toolCalls[0]
    expect(firstCall.toolName).toBe('searchBands')
    expect((firstCall.input as Record<string, unknown>).is_looking_for_members).toBe(true)
  }, 30_000)

  it('response does not fabricate band names not in tool results', async () => {
    const result = await runChatEval('Rekomendasiin band rock dari Surabaya')

    // Only band names from mock data should appear in the response
    const knownNames = ['Seringai', 'Feast']
    const unknownNamePattern = /band\s+\w+\s+(?:dari|asal)\s+Surabaya/i
    expect(result.text).not.toMatch(unknownNamePattern)
    // Response should mention it found nothing or the mock bands
    const mentionsKnownOrEmpty =
      knownNames.some((n) => result.text.includes(n)) ||
      result.text.toLowerCase().includes('tidak') ||
      result.text.toLowerCase().includes('belum')
    expect(mentionsKnownOrEmpty).toBe(true)
  }, 30_000)
})
