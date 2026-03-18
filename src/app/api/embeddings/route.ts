import { NextRequest, NextResponse } from 'next/server'
import { updateBandEmbedding } from '@/lib/embeddings'

export async function POST(req: NextRequest) {
  const { bandId } = await req.json()
  if (!bandId) return NextResponse.json({ error: 'bandId required' }, { status: 400 })

  try {
    await updateBandEmbedding(bandId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 })
  }
}
