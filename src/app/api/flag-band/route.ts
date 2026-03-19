import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/flag-band — authenticated user flags a band for review
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Harus login untuk melaporkan band' }, { status: 401 })

  const { band_id, reason } = await req.json()
  if (!band_id) return Response.json({ error: 'band_id diperlukan' }, { status: 400 })

  // Check if this user already flagged this band
  const { data: existing } = await supabaseAdmin
    .from('band_flags')
    .select('id')
    .eq('band_id', band_id)
    .eq('flagged_by', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'Kamu sudah melaporkan band ini' }, { status: 409 })
  }

  const { error } = await supabaseAdmin.from('band_flags').insert({
    band_id,
    reason: reason?.trim() || null,
    flagged_by: user.id,
    status: 'pending',
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}

// PATCH /api/flag-band — admin updates flag status (approve/reject)
export async function PATCH(req: Request) {
  const { flag_id, status } = await req.json()
  if (!flag_id || !['approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'flag_id dan status (approved/rejected) diperlukan' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('band_flags')
    .update({ status })
    .eq('id', flag_id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
