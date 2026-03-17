'use client'

import { Music, Youtube, X, ChevronDown, ChevronUp } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import clsx from 'clsx'

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208A7.66 7.66 0 00.08 5.026a73.65 73.65 0 00-.013.5v13.948c.01.314.024.625.067.936.167 1.19.647 2.23 1.5 3.07a5.15 5.15 0 003.083 1.427c.413.04.827.05 1.24.05h13.04c.42 0 .84-.01 1.256-.06a5.26 5.26 0 002.957-1.354 5.243 5.243 0 001.498-3.012c.05-.406.067-.813.067-1.22V6.124zM12 3.5c2.35 0 4.25 1.9 4.25 4.25S14.35 12 12 12s-4.25-1.9-4.25-4.25S9.65 3.5 12 3.5zm6 12.5a1 1 0 110-2 1 1 0 010 2zm-3-2H9a1 1 0 110-2h6a1 1 0 110 2z"/>
    </svg>
  )
}

export function MiniPlayer() {
  const { track, expanded, close, switchSource, setExpanded } = usePlayer()

  if (!track) return null

  const hasYoutube = !!track.youtubeEmbed
  const hasSpotify = !!track.spotifyEmbed
  const hasAppleMusic = !!track.appleMusicEmbed

  const sourceCount = [hasYoutube, hasSpotify, hasAppleMusic].filter(Boolean).length

  const embedSrc =
    track.source === 'youtube'
      ? `${track.youtubeEmbed}?autoplay=1`
      : track.source === 'spotify'
      ? `${track.spotifyEmbed}?autoplay=1`
      : `${track.appleMusicEmbed}`

  const embedHeight =
    track.source === 'spotify'
      ? track.spotifyHeight
      : track.source === 'apple_music'
      ? track.appleMusicHeight
      : undefined

  const isVideo = track.source === 'youtube'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Iframe */}
      <div
        className={clsx(
          'bg-stone-950 transition-all duration-300 overflow-hidden',
          expanded
            ? isVideo
              ? 'aspect-video max-h-50 sm:max-h-70'
              : ''
            : 'h-0'
        )}
        style={expanded && !isVideo && embedHeight ? { height: embedHeight } : undefined}
      >
        <iframe
          key={`${track.bandId}-${track.source}`}
          src={embedSrc}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* Bottom bar */}
      <div className="bg-stone-900 border-t border-stone-700 px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
        {/* Thumbnail */}
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-stone-700 flex items-center justify-center">
          {track.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.photoUrl} alt={track.bandName} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-5 h-5 text-stone-400" />
          )}
        </div>

        {/* Band name + source label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{track.bandName}</p>
          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
            {track.source === 'youtube' && <><Youtube className="w-3 h-3" /> YouTube</>}
            {track.source === 'spotify' && <><Music className="w-3 h-3" /> Spotify</>}
            {track.source === 'apple_music' && <><AppleMusicIcon className="w-3 h-3" /> Apple Music</>}
          </p>
        </div>

        {/* Source switch */}
        {sourceCount > 1 && (
          <div className="flex items-center gap-1 bg-stone-800 rounded-lg p-1">
            {hasYoutube && (
              <button
                onClick={() => switchSource('youtube')}
                title="YouTube"
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  track.source === 'youtube' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-white'
                )}
              >
                <Youtube className="w-3.5 h-3.5" />
              </button>
            )}
            {hasSpotify && (
              <button
                onClick={() => switchSource('spotify')}
                title="Spotify"
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  track.source === 'spotify' ? 'bg-green-600 text-white' : 'text-stone-400 hover:text-white'
                )}
              >
                <Music className="w-3.5 h-3.5" />
              </button>
            )}
            {hasAppleMusic && (
              <button
                onClick={() => switchSource('apple_music')}
                title="Apple Music"
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  track.source === 'apple_music' ? 'bg-pink-600 text-white' : 'text-stone-400 hover:text-white'
                )}
              >
                <AppleMusicIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Close */}
        <button
          onClick={close}
          className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
