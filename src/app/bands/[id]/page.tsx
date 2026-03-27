import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { MapPin, Calendar, Instagram, Music, UserPlus, ArrowLeft, Pencil, ExternalLink, Mail } from 'lucide-react'

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}
import { getBandById, getSimilarBands } from '@/lib/queries'
import { supabase as supabasePublic } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { FlagBandButton } from '@/components/FlagBandButton'
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl, getSpotifyEmbedHeight, getAppleMusicEmbedUrl, getAppleMusicEmbedHeight } from '@/lib/embed'
import { Badge } from '@/components/ui/Badge'
import { PlayButton } from '@/components/PlayButton'
import { BandCard } from '@/components/BandCard'
import { BandInsights } from '@/components/BandInsights'
import { PostCard } from '@/components/PostCard'
import { SaveBandButton } from '@/components/SaveBandButton'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bandtelusur.id'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const band = await getBandById(id)
  if (!band) return { title: 'Band tidak ditemukan' }

  const genres = Array.isArray(band.genres) ? band.genres.map((g) => g.name).join(', ') : ''
  const location = [band.city_name, band.province_name].filter(Boolean).join(', ')
  const description = band.bio
    ? band.bio.slice(0, 155)
    : `${band.name} — band dari ${location || 'Indonesia'}${genres ? `. Genre: ${genres}` : ''}.`

  const url = `${BASE_URL}/bands/${band.username ?? band.id}`

  return {
    title: `${band.name} — BandTelusur`,
    description,
    openGraph: {
      title: band.name,
      description,
      url,
      type: 'website',
      ...(band.photo_url && { images: [{ url: band.photo_url, width: 1200, height: 630, alt: band.name }] }),
    },
    twitter: {
      card: band.photo_url ? 'summary_large_image' : 'summary',
      title: band.name,
      description,
      ...(band.photo_url && { images: [band.photo_url] }),
    },
    alternates: { canonical: url },
  }
}

export default async function BandDetailPage({ params }: Props) {
  const { id } = await params
  const [band, supabase, similarBands, t] = await Promise.all([
    getBandById(id),
    createSupabaseServerClient(),
    getSimilarBands(id),
    getTranslations('bandDetail'),
  ])

  // Fetch posts tagged with this band (up to 5 for preview)
  const bandPostsData = band
    ? await (async () => {
        const { data: tagRows } = await supabasePublic
          .from('post_band_tags')
          .select('post_id')
          .eq('band_id', band.id)
        const ids = (tagRows ?? []).map((r: { post_id: string }) => r.post_id)
        if (ids.length === 0) return []
        const { data: posts } = await supabaseAdmin
          .from('posts_view')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false })
          .limit(5)
        return posts ?? []
      })()
    : []

  if (!band) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === band.user_id

  const isSaved = user
    ? await supabase
        .from('saved_bands')
        .select('band_id')
        .eq('user_id', user.id)
        .eq('band_id', id)
        .maybeSingle()
        .then(({ data }) => !!data)
    : false

  const ownerProfile = band.user_id
    ? await supabaseAdmin
        .from('profiles')
        .select('display_name, avatar_url, username')
        .eq('id', band.user_id)
        .single()
        .then(({ data }) => data)
    : null

  const waLink = band.contact_wa ? `https://wa.me/${band.contact_wa}` : null
  const youtubeEmbed = (band.youtube ? getYouTubeEmbedUrl(band.youtube) : null)
    ?? (band.youtube_music ? getYouTubeEmbedUrl(band.youtube_music) : null)
  const spotifyEmbed = band.spotify ? getSpotifyEmbedUrl(band.spotify) : null
  const spotifyHeight = spotifyEmbed ? getSpotifyEmbedHeight(spotifyEmbed) : 352
  const appleMusicEmbed = band.apple_music ? getAppleMusicEmbedUrl(band.apple_music) : null
  const appleMusicHeight = appleMusicEmbed ? getAppleMusicEmbedHeight(appleMusicEmbed) : 450

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors min-h-11 py-2"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </Link>
        <div className="flex items-center gap-2">
          <SaveBandButton bandId={id} initialSaved={isSaved} isLoggedIn={!!user} />
          {isOwner && (
            <Link
              href={`/bands/${id}/edit`}
              className="inline-flex items-center gap-1.5 text-xs border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 px-2.5 py-1.5 rounded-lg hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('editBand')}</span><span className="sm:hidden">{t('edit')}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {/* Cover photo */}
        <div className="aspect-video bg-linear-to-br from-amber-100 to-orange-100 relative">
          {band.photo_url ? (
            <Image src={band.photo_url} alt={band.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Music className="w-16 h-16 text-amber-400" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">{band.name}</h1>
              {band.username && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">@{band.username}</p>
              )}
              {ownerProfile && band.user_id && (
                <Link href={`/u/${ownerProfile.username ?? band.user_id}`} className="text-xs text-stone-400 hover:text-amber-600 transition-colors mt-0.5 inline-block">
                  {t('by', { name: ownerProfile.display_name ?? t('user') })}
                </Link>
              )}
              {(band.city_name || band.province_name) && (
                <p className="flex items-center gap-1 text-stone-500 dark:text-stone-400 mt-1">
                  <MapPin className="w-4 h-4" />
                  {band.city_name && `${band.city_name}, `}{band.province_name}
                </p>
              )}
              {band.formed_year && (
                <p className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('founded', { year: band.formed_year })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PlayButton
                bandId={band.id}
                bandName={band.name}
                photoUrl={band.photo_url}
                youtubeEmbed={youtubeEmbed}
                spotifyEmbed={spotifyEmbed}
                spotifyHeight={spotifyHeight}
                appleMusicEmbed={appleMusicEmbed}
                appleMusicHeight={appleMusicHeight}
              />
              {band.is_looking_for_members && (
                <Badge variant="green" className="text-sm px-3 py-1">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {t('lookingForMembers')}
                </Badge>
              )}
            </div>
          </div>

          {/* Genres */}
          {Array.isArray(band.genres) && band.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {band.genres.map((g) => (
                <Badge key={g.id}>{g.name}</Badge>
              ))}
            </div>
          )}

          {/* Bio */}
          {band.bio && (
            <div>
              <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-2">{t('about')}</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">{band.bio}</p>
            </div>
          )}

          {/* AI Insights */}
          <BandInsights
            band={{
              id: band.id,
              name: band.name,
              bio: band.bio,
              formed_year: band.formed_year,
              province_name: band.province_name,
              city_name: band.city_name,
              genres: band.genres,
            }}
          />

          {/* ── YouTube Player ────────────────────────────────── */}
          {youtubeEmbed ? (
            <div>
              <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                YouTube
              </h2>
              <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 aspect-video">
                <iframe
                  src={youtubeEmbed}
                  title={`${band.name} — YouTube`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          ) : (band.youtube || band.youtube_music) ? (
            <div className="flex flex-wrap gap-2">
              {band.youtube && (
                <a href={band.youtube} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500" /> {t('openYouTube')}
                </a>
              )}
              {band.youtube_music && (
                <a href={band.youtube_music} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                >
                  <YoutubeIcon className="w-4 h-4 text-red-500" /> {t('openYouTubeMusic')}
                </a>
              )}
            </div>
          ) : null}

          {/* ── Spotify Player ────────────────────────────────── */}
          {spotifyEmbed ? (
            <div>
              <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-green-500" />
                Spotify
              </h2>
              <iframe
                src={spotifyEmbed}
                title={`${band.name} — Spotify`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full rounded-xl"
                style={{ height: spotifyHeight }}
              />
            </div>
          ) : band.spotify ? (
            <a
              href={band.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm"
            >
              <Music className="w-4 h-4" /> {t('openSpotify')}
            </a>
          ) : null}

          {/* ── Apple Music Player ────────────────────────────── */}
          {appleMusicEmbed ? (
            <div>
              <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-500" />
                Apple Music
              </h2>
              <iframe
                src={appleMusicEmbed}
                title={`${band.name} — Apple Music`}
                allow="autoplay *; encrypted-media *; fullscreen *"
                loading="lazy"
                className="w-full rounded-xl"
                style={{ height: appleMusicHeight }}
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
              />
            </div>
          ) : band.apple_music ? (
            <a
              href={band.apple_music}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
            >
              <Music className="w-4 h-4 text-pink-500" /> {t('openAppleMusic')}
            </a>
          ) : null}

          {/* ── Bandcamp ──────────────────────────────────────── */}
          {band.bandcamp && (
            <div>
              <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-teal-500" />
                Bandcamp
              </h2>
              <a
                href={band.bandcamp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-teal-400 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" /> {t('openBandcamp')}
              </a>
            </div>
          )}

          {/* ── Contact & Social ──────────────────────────────── */}
          <div>
            <h2 className="font-semibold text-stone-700 dark:text-stone-300 mb-3">{t('contactSocial')}</h2>
            <div className="flex flex-wrap gap-2">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium min-h-11"
                >
                  {t('contactWhatsApp')}
                </a>
              )}
              {band.contact_email && (
                <a
                  href={`mailto:${band.contact_email}`}
                  className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm min-h-11"
                >
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              {band.instagram && (
                <a
                  href={`https://instagram.com/${band.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm min-h-11"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {band.youtube && !youtubeEmbed && (
                <a
                  href={band.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm min-h-11"
                >
                  <YoutubeIcon className="w-4 h-4" /> YouTube
                </a>
              )}
              {band.spotify && !spotifyEmbed && (
                <a
                  href={band.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-4 py-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm min-h-11"
                >
                  <Music className="w-4 h-4" /> Spotify
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flag */}
      <div className="mt-4 flex justify-end">
        <FlagBandButton bandId={id} />
      </div>

      {/* Gigs & Posts */}
      {bandPostsData.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Gigs & Posts</h2>
            <a
              href={`/feed?band_id=${band.id}`}
              className="text-sm text-amber-600 hover:underline"
            >
              Lihat semua →
            </a>
          </div>
          <div className="space-y-3">
            {bandPostsData.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Bands */}
      {similarBands.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">{t('similarBands')}</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {similarBands.map((b) => (
              <BandCard key={b.id} band={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
