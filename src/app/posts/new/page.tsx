import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CreatePostForm } from '@/components/CreatePostForm'

export default async function NewPostPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/posts/new')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-6">Buat Post</h1>
      <div className="bg-surface rounded-2xl border border-stone-200 dark:border-stone-700 p-5 sm:p-6">
        <CreatePostForm />
      </div>
    </div>
  )
}
