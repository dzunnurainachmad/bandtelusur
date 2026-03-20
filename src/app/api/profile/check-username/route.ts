import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const username = new URL(req.url).searchParams.get('username') ?? ''

  if (!USERNAME_RE.test(username)) {
    return Response.json({ available: false, reason: 'format' })
  }

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  // Available if not found, OR if it's the current user's own username
  const available = !data || data.id === user.id
  return Response.json({ available })
}
