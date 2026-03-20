import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { display_name, bio, avatar_url, username } = await req.json()

  const updates: Record<string, string | null> = {}
  if (display_name !== undefined) updates.display_name = display_name?.trim() || null
  if (bio !== undefined) updates.bio = bio?.trim() || null
  if (avatar_url !== undefined) updates.avatar_url = avatar_url || null
  if (username !== undefined) {
    const u = username?.trim().toLowerCase() || null
    if (u && !USERNAME_RE.test(u)) {
      return Response.json({ error: 'Username hanya boleh huruf kecil, angka, dan underscore (3–30 karakter)' }, { status: 400 })
    }
    updates.username = u
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...updates })

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Username sudah dipakai' }, { status: 409 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
