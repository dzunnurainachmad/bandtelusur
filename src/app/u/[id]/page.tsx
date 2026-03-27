import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Music } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserBands } from '@/lib/queries'
import { BandCard } from '@/components/BandCard'

interface Props {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getProfile(slug: string) {
  // Try username first, fall back to UUID
  if (!UUID_RE.test(slug)) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, bio, avatar_url, username')
      .eq('username', slug)
      .single()
    return data ?? null
  }

  // Looks like a UUID — try profiles table first
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, bio, avatar_url, username')
    .eq('id', slug)
    .single()
  if (data) return data

  // Profile row missing but user may exist — verify via auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(slug)
  if (!user) return null

  // Return a minimal profile so the page renders instead of 404
  return { id: user.id, display_name: null, bio: null, avatar_url: null, username: null }
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params
  const [profile, t] = await Promise.all([getProfile(id), getTranslations('publicProfile')])

  if (!profile) notFound()

  const { bands } = await getUserBands(profile.id, 0, true)

  const displayName = profile.display_name ?? t('defaultUser')
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 mb-8 text-center sm:text-left">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-full object-cover border-2 border-stone-200 dark:border-stone-700 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-2xl font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">{displayName}</h1>
          {profile.username && (
            <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Bands */}
      <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
        <Music className="w-5 h-5 text-amber-600" />
        {t('registeredBands', { count: bands.length })}
      </h2>

      {bands.length === 0 ? (
        <p className="text-stone-400 dark:text-stone-500 text-sm">{t('noBands')}</p>
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
