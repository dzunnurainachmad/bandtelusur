import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Music, Settings, Bookmark } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserBands } from '@/lib/queries'
import { LoadMoreDashboard } from '@/components/LoadMoreDashboard'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const [{ bands, hasMore }, profileRes, t] = await Promise.all([
    getUserBands(user.id),
    supabaseAdmin.from('profiles').select('display_name, bio, avatar_url, username').eq('id', user.id).single(),
    getTranslations('dashboard'),
  ])

  const profile = profileRes.data
  const multipleActive = bands.filter((b) => b.is_active).length > 1
  const displayName = profile?.display_name ?? null
  const initials = (displayName || user.email || '?').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile card */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 p-4 bg-[#fefaf4] dark:bg-[#231d15] rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={displayName ?? ''} width={56} height={56} className="rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{displayName ?? user.email}</p>
            {profile?.username && <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">@{profile.username}</p>}
            {profile?.bio && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{profile.bio}</p>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {(profile?.username || user.id) && (
            <Link href={`/u/${profile?.username ?? user.id}`} className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg transition-colors">
              {t('publicProfile')}
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg transition-colors">
            <Settings className="w-3.5 h-3.5" /> {t('edit')}
          </Link>
        </div>
      </div>

      {multipleActive && (
        <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-400">
          {t('multipleActiveBands')}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('myBands')}</h1>
          <Link
            href="/saved"
            className="inline-flex items-center gap-1.5 text-sm border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 px-3 py-2 rounded-lg hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors min-h-11"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {t('saved')}
          </Link>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-11"
        >
          <Plus className="w-4 h-4" />
          {t('registerBand')}
        </Link>
      </div>

      {bands.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-stone-300 dark:text-stone-600" />
          </div>
          <p className="font-medium text-stone-600 dark:text-stone-400">{t('noBands')}</p>
          <p className="text-sm mt-1 text-stone-400 dark:text-stone-500">
            <Link href="/submit" className="text-amber-600 hover:underline">
              {t('registerFirst')}
            </Link>
          </p>
        </div>
      ) : (
        <LoadMoreDashboard initialBands={bands} initialHasMore={hasMore} />
      )}
    </div>
  )
}
