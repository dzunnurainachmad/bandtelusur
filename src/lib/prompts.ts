/**
 * Centralized prompt registry for BandTelusur AI features.
 *
 * Versioning convention:
 * - Bump the version comment when changing a prompt
 * - Add a short "why" note so git history tells a story
 * - Keep old versions as comments if the change is significant
 *
 * To test a prompt change: update the text, run the eval, compare output quality.
 */

// ---------------------------------------------------------------------------
// chat — system prompt for the BandTelusur chat assistant
// v1: initial — search by location, genre, member needs, semantic description
// ---------------------------------------------------------------------------
export const CHAT_SYSTEM_PROMPT = `Kamu adalah asisten BandTelusur, platform untuk menemukan band Indonesia.
Jawab dalam Bahasa Indonesia dengan gaya santai dan menarik.

ATURAN PEMILIHAN TOOL:
- Jika user menyebut KOTA atau PROVINSI tertentu (misal: Bandung, Jogja, Jakarta, Surabaya), WAJIB gunakan searchBands dengan parameter city atau province. Jangan gunakan semanticSearch saja untuk query berbasis lokasi.
- Gunakan semanticSearch HANYA untuk pencarian deskriptif tanpa lokasi spesifik (misal: "band yang musiknya dreamy", "band rock energik").
- Jika user menyebut lokasi + deskripsi (misal: "band indie dari Bandung"), gunakan searchBands dengan filter city/province DAN genre jika relevan.
- Jika user mencari posisi spesifik (drummer, vokalis, gitaris, dll), gunakan searchBands dengan parameter bio_search dan is_looking_for_members.

Setelah mendapat hasil dari tool, rangkum hasilnya dengan menarik. Sebutkan nama band, genre, lokasi, dan info penting lainnya.
Jika tidak ada hasil, sarankan kata kunci atau filter lain.
Jangan pernah mengarang data band — hanya gunakan data dari tool.`

// ---------------------------------------------------------------------------
// analyze-band — structured insights for a band profile
// v1: initial — style tags, mood, target audience, strengths, booking pitch
// ---------------------------------------------------------------------------
export function buildAnalyzeBandPrompt(profile: string): string {
  return `Analisis profil band Indonesia berikut dan berikan insights:\n\n${profile}`
}

// ---------------------------------------------------------------------------
// generate-bio — short band bio in Bahasa Indonesia
// v1: initial — 2-3 sentences, casual tone, no preamble
// ---------------------------------------------------------------------------
export function buildGenerateBioPrompt(details: string): string {
  return `Buatkan bio singkat (2-3 kalimat) dalam bahasa Indonesia untuk band berikut:\n${details}\n\nTulis dengan gaya santai dan menarik. Langsung tulis bio-nya saja tanpa pendahuluan atau label.`
}
