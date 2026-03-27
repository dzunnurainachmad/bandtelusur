import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/admin-queries'
import { getActiveBandsCount } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await isAdmin()
  if (!admin) {
    const activeCount = await getActiveBandsCount(user.id)
    if (activeCount >= 1) {
      return NextResponse.json(
        { error: 'Kamu sudah punya 1 band aktif. Upgrade ke Pro untuk menambah lebih.' },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const {
    name, username, bio, formed_year, province_id, city_id,
    contact_wa, contact_email, instagram, youtube, spotify,
    youtube_music, apple_music, bandcamp, photo_url,
    is_looking_for_members, genre_ids,
  } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nama band wajib diisi.' }, { status: 400 })
  }
  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username wajib diisi.' }, { status: 400 })
  }

  const { data: band, error } = await supabaseAdmin
    .from('bands')
    .insert({
      name,
      username,
      bio: bio || null,
      formed_year: formed_year || null,
      province_id: province_id || null,
      city_id: city_id || null,
      contact_wa: contact_wa || null,
      contact_email: contact_email || null,
      instagram: instagram || null,
      youtube: youtube || null,
      spotify: spotify || null,
      youtube_music: youtube_music || null,
      apple_music: apple_music || null,
      bandcamp: bandcamp || null,
      photo_url: photo_url || null,
      is_looking_for_members: is_looking_for_members ?? false,
      user_id: user.id,
      is_active: true,
    })
    .select('id, username')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (Array.isArray(genre_ids) && genre_ids.length > 0) {
    await supabaseAdmin
      .from('band_genres')
      .insert(genre_ids.map((genre_id: number) => ({ band_id: band.id, genre_id })))
  }

  // Trigger embedding generation in background
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bandId: band.id }),
  }).catch(() => {})

  return NextResponse.json({ id: band.id, username: band.username })
}
