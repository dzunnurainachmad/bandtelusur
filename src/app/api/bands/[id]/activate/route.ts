import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: band } = await supabase
    .from('bands')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!band || band.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Activate target first, then deactivate others.
  // This order means a partial failure leaves a temporary multi-active state
  // (harmless) rather than a zero-active state (breaks dashboard).
  const { error: activateError } = await supabaseAdmin
    .from('bands')
    .update({ is_active: true })
    .eq('id', id)

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 500 })
  }

  const { error: deactivateError } = await supabaseAdmin
    .from('bands')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .neq('id', id)

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
