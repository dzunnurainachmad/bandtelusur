import { NextRequest, NextResponse } from 'next/server'
import { getBands } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const page = Number(sp.get('page') ?? '0')

  const { bands, hasMore } = await getBands(
    {
      province_id: sp.get('province') ? Number(sp.get('province')) : undefined,
      city_id: sp.get('city') ? Number(sp.get('city')) : undefined,
      genre_ids: sp.get('genre') ? sp.get('genre')!.split(',').map(Number) : undefined,
      is_looking_for_members: sp.get('open') === 'true' ? true : undefined,
      search: sp.get('q') || undefined,
    },
    page,
  )

  return NextResponse.json({ bands, hasMore })
}
