import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { EditForm } from './EditForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBandPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/bands/${id}/edit`)

  const { data: band } = await supabase
    .from('bands_view')
    .select('*')
    .eq('id', id)
    .single()

  if (!band) notFound()
  if (band.user_id !== user.id) redirect(`/bands/${id}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">Edit Band</h1>
      <EditForm band={band} />
    </div>
  )
}
