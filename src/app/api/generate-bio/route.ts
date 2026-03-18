import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { name, genre, formedYear, location } = await req.json()

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
    prompt: `Buatkan bio singkat (2-3 kalimat) dalam bahasa Indonesia untuk band berikut:\n${details}\n\nTulis dengan gaya santai dan menarik. Langsung tulis bio-nya saja tanpa pendahuluan atau label.`,
    maxOutputTokens: 300,
  })

  return result.toTextStreamResponse()
}
