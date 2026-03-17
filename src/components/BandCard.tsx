import Link from 'next/link'
import { MapPin, Music, UserPlus } from 'lucide-react'
import { Badge } from './ui/Badge'
import { PlayButton } from './PlayButton'
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl, getSpotifyEmbedHeight, getAppleMusicEmbedUrl, getAppleMusicEmbedHeight } from '@/lib/embed'
import type { Band } from '@/types'

export function BandCard({ band }: { band: Band }) {
  const waLink = band.contact_wa ? `https://wa.me/${band.contact_wa}` : null
  const youtubeEmbed = (band.youtube ? getYouTubeEmbedUrl(band.youtube) : null)
    ?? (band.youtube_music ? getYouTubeEmbedUrl(band.youtube_music) : null)
  const spotifyEmbed = band.spotify ? getSpotifyEmbedUrl(band.spotify) : null
  const appleMusicEmbed = band.apple_music ? getAppleMusicEmbedUrl(band.apple_music) : null
  const hasMedia = !!(youtubeEmbed || spotifyEmbed || appleMusicEmbed)

  return (
    <div className="bg-[#fefaf4] dark:bg-[#231d15] rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      <div className="aspect-video bg-linear-to-br from-amber-100 to-orange-100 relative">
        {band.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={band.photo_url} alt={band.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Music className="w-12 h-12 text-amber-400" />
          </div>
        )}

        {band.is_looking_for_members && (
          <div className="absolute top-2 right-2">
            <Badge variant="green">
              <UserPlus className="w-3 h-3 mr-1" />
              Open Member
            </Badge>
          </div>
        )}

        {/* Play overlay on thumbnail */}
        {hasMedia && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 transform duration-150">
              <PlayButton
                bandId={band.id}
                bandName={band.name}
                photoUrl={band.photo_url}
                youtubeEmbed={youtubeEmbed}
                spotifyEmbed={spotifyEmbed}
                spotifyHeight={spotifyEmbed ? getSpotifyEmbedHeight(spotifyEmbed) : 352}
                appleMusicEmbed={appleMusicEmbed}
                appleMusicHeight={appleMusicEmbed ? getAppleMusicEmbedHeight(appleMusicEmbed) : 450}
                variant="circle"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link href={`/bands/${band.id}`} className="hover:underline">
          <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 truncate">{band.name}</h3>
        </Link>

        {(band.city_name || band.province_name) && (
          <p className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {band.city_name && `${band.city_name}, `}{band.province_name}
          </p>
        )}

        {band.bio && (
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">{band.bio}</p>
        )}

        {Array.isArray(band.genres) && band.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 overflow-hidden max-h-14">
            {band.genres.slice(0, 4).map((g) => (
              <Badge key={g.id}>{g.name}</Badge>
            ))}
            {band.genres.length > 4 && (
              <span className="text-xs text-stone-400 self-center">+{band.genres.length - 4}</span>
            )}
          </div>
        )}

        {(band.instagram || waLink) && (
          <div className="mt-4 flex gap-2">
            {band.instagram && (
              <a
                href={`https://instagram.com/${band.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-sm border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 px-3 py-1.5 rounded-lg hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors"
              >
                Instagram
              </a>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-sm border border-emerald-500 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
