import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Music, Settings } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserBands } from '@/lib/queries'
import { LoadMoreDashboard } from '@/components/LoadMoreDashboard'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const [{ bands, hasMore }, profileRes] = await Promise.all([
    getUserBands(user.id),
    supabaseAdmin.from('profiles').select('display_name, bio, avatar_url, username').eq('id', user.id).single(),
  ])

  const profile = profileRes.data
  const displayName = profile?.display_name ?? null
  const initials = (displayName || user.email || '?').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile card */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-[#fefaf4] dark:bg-[#231d15] rounded-xl border border-stone-200 dark:border-stone-700">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={displayName ?? ''} className="w-14 h-14 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{displayName ?? user.email}</p>
          {profile?.username && <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">@{profile.username}</p>}
          {profile?.bio && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{profile.bio}</p>}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {(profile?.username || user.id) && (
            <Link href={`/u/${profile?.username ?? user.id}`} className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg transition-colors">
              Profil Publik
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg transition-colors">
            <Settings className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Band Saya</h1>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Band
        </Link>
      </div>

      {bands.length === 0 ? (
        <div className="text-center py-24 text-stone-400 dark:text-stone-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Belum ada band terdaftar</p>
          <p className="text-sm mt-1">
            <Link href="/submit" className="text-amber-600 hover:underline">
              Daftarkan band pertamamu
            </Link>
          </p>
        </div>
      ) : (
        <LoadMoreDashboard initialBands={bands} initialHasMore={hasMore} />
      )}
    </div>
  )
}
