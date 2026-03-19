import { z } from 'zod'

export const SubmitBandAgentSchema = z.object({
  name: z.string().nullable(),
  bio: z.string().nullable(),
  instagram: z.string().nullable(),
  youtube: z.string().nullable(),
  spotify: z.string().nullable(),
  formed_year: z.string().nullable(),
  suggested_genres: z.array(z.string()),
  confidence: z.object({
    name: z.enum(['high', 'medium', 'low']),
    bio: z.enum(['high', 'medium', 'low']),
    genres: z.enum(['high', 'medium', 'low']),
  }),
  flags: z.array(z.string()),
})
export type SubmitBandAgentResult = z.infer<typeof SubmitBandAgentSchema>

export const ModerationVerdictSchema = z.object({
  verdict: z.enum(['approve', 'reject', 'needs_review']),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  checks: z.object({
    bio_quality: z.object({ ok: z.boolean(), notes: z.string() }),
    photo_appropriate: z.object({ ok: z.boolean(), notes: z.string() }),
    duplicate_risk: z.object({ ok: z.boolean(), notes: z.string(), similar_count: z.number() }),
  }),
})
export type ModerationVerdict = z.infer<typeof ModerationVerdictSchema>

export const WeeklyInsightsSchema = z.object({
  summary: z.string(),
  top_genres: z.array(z.object({ name: z.string(), count: z.number() })),
  top_provinces: z.array(z.object({ name: z.string(), count: z.number() })),
  highlights: z.array(z.string()),
  recommendations: z.array(z.string()),
})
export type WeeklyInsights = z.infer<typeof WeeklyInsightsSchema>

export const BandInsightsSchema = z.object({
  style_tags: z
    .array(z.string())
    .describe('3-5 kata kunci gaya musik spesifik, contoh: "distorsi tebal", "vokal melengking"'),
  mood: z
    .array(z.string())
    .describe('2-4 kata suasana/mood musik, contoh: "melankolis", "energik"'),
  target_audience: z
    .string()
    .describe('Satu kalimat deskripsi target pendengar, contoh: "Anak muda 20-an yang suka..."'),
  strengths: z
    .array(z.string())
    .describe('2-3 kelebihan band berdasarkan profil yang tersedia'),
  booking_pitch: z
    .string()
    .describe('Satu kalimat pitch singkat untuk event organizer'),
})

export type BandInsights = z.infer<typeof BandInsightsSchema>
