/**
 * Eval test cases for BandTelusur AI features.
 * Used by scripts/eval.ts (npm run eval).
 */

export type EvalCase =
  | ChatEvalCase
  | AnalyzeBandEvalCase
  | GenerateBioEvalCase

interface BaseCase {
  id: string
  description: string
  criteria: string[]
}

export interface ChatEvalCase extends BaseCase {
  route: 'chat'
  query: string
  expectedTool: 'searchBands' | 'semanticSearch' | 'getBandDetail'
  expectedParams?: Record<string, unknown>
}

export interface AnalyzeBandEvalCase extends BaseCase {
  route: 'analyze-band'
  input: {
    name: string
    bio?: string
    genres?: string[]
    province?: string
    city?: string
    formed_year?: number
  }
}

export interface GenerateBioEvalCase extends BaseCase {
  route: 'generate-bio'
  input: {
    name: string
    genre?: string
    formedYear?: number
    location?: string
  }
}

// ---------------------------------------------------------------------------
// Mock bands returned by tool execute functions during chat evals
// ---------------------------------------------------------------------------

export const MOCK_BANDS = [
  {
    id: 'band-001',
    name: 'Seringai',
    bio: 'Band thrash metal dari Bandung yang berdiri sejak 2002. Dikenal dengan sound agresif.',
    city_name: 'Bandung',
    province_name: 'Jawa Barat',
    genres: [{ name: 'Thrash Metal' }, { name: 'Punk' }],
    is_looking_for_members: false,
    formed_year: 2002,
    photo_url: null,
  },
  {
    id: 'band-002',
    name: 'Feast',
    bio: 'Band indie rock dari Jakarta dengan lirik introspektif dan sound jangly.',
    city_name: 'Jakarta Selatan',
    province_name: 'DKI Jakarta',
    genres: [{ name: 'Indie Rock' }],
    is_looking_for_members: true,
    formed_year: 2014,
    photo_url: null,
  },
  {
    id: 'band-003',
    name: 'Efek Rumah Kaca',
    bio: 'Band indie pop dari Jakarta dengan lirik kritis dan melodi yang melankolis.',
    city_name: 'Jakarta',
    province_name: 'DKI Jakarta',
    genres: [{ name: 'Indie Pop' }, { name: 'Post-Punk' }],
    is_looking_for_members: false,
    formed_year: 2001,
    photo_url: null,
  },
]

// ---------------------------------------------------------------------------
// Eval cases
// ---------------------------------------------------------------------------

export const evalCases: EvalCase[] = [
  // --- Chat: tool selection ---
  {
    id: 'chat-location-city',
    route: 'chat',
    description: 'City query should trigger searchBands with city param',
    query: 'Cariin band metal dari Bandung dong',
    expectedTool: 'searchBands',
    expectedParams: { city: 'Bandung' },
    criteria: [
      'Uses searchBands tool (not semanticSearch) since query specifies a city',
      'Tool input includes city parameter matching "Bandung"',
      'Response mentions band names and their location',
      'Response is in Bahasa Indonesia',
    ],
  },
  {
    id: 'chat-member-search',
    route: 'chat',
    description: 'Member search should trigger searchBands with is_looking_for_members=true',
    query: 'Ada band yang lagi butuh drummer nggak?',
    expectedTool: 'searchBands',
    expectedParams: { is_looking_for_members: true },
    criteria: [
      'Uses searchBands with is_looking_for_members set to true',
      'Response mentions bands that are looking for members',
      'Response is in Bahasa Indonesia',
    ],
  },
  {
    id: 'chat-descriptive-no-location',
    route: 'chat',
    description: 'Descriptive query without location should trigger semanticSearch',
    query: 'Rekomendasiin band yang musiknya dreamy dan melankolis',
    expectedTool: 'semanticSearch',
    criteria: [
      'Uses semanticSearch (not searchBands) for a descriptive query without a city/province',
      'SemanticSearch query string captures the descriptive intent (dreamy, melankolis)',
      'Response is in Bahasa Indonesia',
    ],
  },

  // --- Analyze Band ---
  {
    id: 'analyze-band-full-profile',
    route: 'analyze-band',
    description: 'Full band profile should return non-empty, relevant insights',
    input: {
      name: 'Burgerkill',
      bio: 'Band heavy metal asal Bandung yang berdiri sejak 1995. Dikenal dengan sound heavy dan brutal.',
      genres: ['Heavy Metal', 'Thrash Metal'],
      province: 'Jawa Barat',
      city: 'Bandung',
      formed_year: 1995,
    },
    criteria: [
      'style_tags has at least 2 items and reflects heavy/metal character',
      'mood does not contain soft/acoustic words like "santai", "romantis", or "akustik"',
      'booking_pitch is a single sentence (max 2 punctuation marks)',
      'target_audience is at least 20 characters',
    ],
  },
  {
    id: 'analyze-band-minimal',
    route: 'analyze-band',
    description: 'Name-only profile should still return usable insights',
    input: { name: 'Peterpan' },
    criteria: [
      'style_tags has at least 1 item',
      'booking_pitch is non-empty (at least 10 characters)',
      'All required fields (style_tags, mood, target_audience, strengths, booking_pitch) are present',
    ],
  },

  // --- Generate Bio ---
  {
    id: 'generate-bio-indie',
    route: 'generate-bio',
    description: 'Bio for an indie band should be 2-3 sentences in Indonesian',
    input: {
      name: 'Fourtwnty',
      genre: 'Indie Folk',
      formedYear: 2010,
      location: 'Jakarta',
    },
    criteria: [
      'Bio is written in Bahasa Indonesia',
      'Bio is 2-3 sentences (2-4 sentence-ending punctuation marks)',
      'Bio mentions the band name',
      'Bio has no preamble like "Berikut bio-nya:" or "Tentu saja"',
    ],
  },
]
