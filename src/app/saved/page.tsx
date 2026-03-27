import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, Music } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase as publicSupabase } from '@/lib/supabase'
import { BandCard } from '@/components/BandCard'
import type { Band } from '@/types'

export default async function SavedBandsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/saved')

  const [{ data: savedRows }, t] = await Promise.all([
    supabase.from('saved_bands').select('band_id').eq('user_id', user.id).order('created_at', { ascending: false }),
    getTranslations('saved'),
  ])

  const bandIds = (savedRows ?? []).map((r) => r.band_id)

  let bands: Band[] = []
  if (bandIds.length > 0) {
    const { data } = await publicSupabase
      .from('bands_view')
      .select('*')
      .in('id', bandIds)
      .eq('is_active', true)
    const bandMap = new Map((data ?? []).map((b) => [b.id, b]))
    bands = bandIds.map((id) => bandMap.get(id)).filter(Boolean) as Band[]
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-6 h-6 text-amber-700" />
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('title')}</h1>
      </div>

      {bands.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-stone-300 dark:text-stone-600" />
          </div>
          <p className="font-medium text-stone-600 dark:text-stone-400">{t('empty')}</p>
          <p className="text-sm mt-1 text-stone-400 dark:text-stone-500">
            <Link href="/browse" className="text-amber-600 hover:underline">
              {t('emptyHint')}
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {bands.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      )}
    </div>
  )
}
