'use client'

import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePlayer, type PlayerSource } from '@/contexts/PlayerContext'
import { getSpotifyEmbedHeight, getAppleMusicEmbedHeight } from '@/lib/embed'

interface PlayButtonProps {
  bandId: string
  bandName: string
  photoUrl: string | null
  youtubeEmbed: string | null
  spotifyEmbed: string | null
  spotifyHeight?: number
  appleMusicEmbed: string | null
  appleMusicHeight?: number
  preferredSource?: PlayerSource
  variant?: 'default' | 'icon' | 'circle' | 'circle-sm'
}

export function PlayButton({
  bandId,
  bandName,
  photoUrl,
  youtubeEmbed,
  spotifyEmbed,
  spotifyHeight,
  appleMusicEmbed,
  appleMusicHeight,
  preferredSource,
  variant = 'default',
}: PlayButtonProps) {
  const { play, track } = usePlayer()
  const t = useTranslations('playButton')

  if (!youtubeEmbed && !spotifyEmbed && !appleMusicEmbed) return null

  const isPlaying = track?.bandId === bandId

  const source: PlayerSource =
    preferredSource ??
    (youtubeEmbed ? 'youtube' : appleMusicEmbed ? 'apple_music' : 'spotify')

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    play({
      bandId,
      bandName,
      photoUrl,
      youtubeEmbed,
      spotifyEmbed,
      spotifyHeight: spotifyHeight ?? (spotifyEmbed ? getSpotifyEmbedHeight(spotifyEmbed) : 352),
      appleMusicEmbed,
      appleMusicHeight: appleMusicHeight ?? (appleMusicEmbed ? getAppleMusicEmbedHeight(appleMusicEmbed) : 450),
      source,
    })
  }

  if (variant === 'circle-sm') {
    return (
      <button
        onClick={handlePlay}
        title={t('play')}
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
          isPlaying ? 'bg-amber-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
        }`}
      >
        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
      </button>
    )
  }

  if (variant === 'circle') {
    return (
      <button
        onClick={handlePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer ${
          isPlaying ? 'bg-amber-600 text-white' : 'bg-[#fefaf4] text-amber-700 hover:bg-amber-50'
        }`}
      >
        <Play className="w-5 h-5 fill-current translate-x-0.5" />
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePlay}
        title={t('play')}
        className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
          isPlaying
            ? 'border-amber-600 bg-amber-50 text-amber-700'
            : 'border-stone-300 text-stone-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50'
        }`}
      >
        <Play className="w-4 h-4 fill-current" />
      </button>
    )
  }

  return (
    <button
      onClick={handlePlay}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-700 hover:bg-amber-800 text-white transition-colors cursor-pointer"
    >
      <Play className="w-4 h-4 fill-current" />
      {isPlaying ? t('playing') : t('play')}
    </button>
  )
}
