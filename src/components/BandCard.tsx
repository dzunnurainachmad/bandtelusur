import Link from 'next/link'
import { MapPin, Music, UserPlus, ChevronRight } from 'lucide-react'
import { Badge } from './ui/Badge'
import { PlayButton } from './PlayButton'
import { SaveBandButton } from './SaveBandButton'
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl, getSpotifyEmbedHeight, getAppleMusicEmbedUrl, getAppleMusicEmbedHeight } from '@/lib/embed'
import type { Band } from '@/types'

interface BandCardProps {
  band: Band
  isLoggedIn?: boolean
  isSaved?: boolean
}

export function BandCard({ band, isLoggedIn, isSaved = false }: BandCardProps) {
  const waLink = band.contact_wa ? `https://wa.me/${band.contact_wa}` : null
  const emailLink = band.contact_email ? `mailto:${band.contact_email}` : null
  const contactLink = waLink ?? emailLink
  const contactLabel = waLink ? 'WhatsApp' : 'Email'
  const contactStyle = waLink
    ? 'flex-1 text-center text-sm border border-emerald-500 text-emerald-600 px-2 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors min-h-11 flex items-center justify-center'
    : 'flex-1 text-center text-sm border border-sky-500 text-sky-600 px-2 py-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors min-h-11 flex items-center justify-center'
  const youtubeEmbed = (band.youtube ? getYouTubeEmbedUrl(band.youtube) : null)
    ?? (band.youtube_music ? getYouTubeEmbedUrl(band.youtube_music) : null)
  const spotifyEmbed = band.spotify ? getSpotifyEmbedUrl(band.spotify) : null
  const appleMusicEmbed = band.apple_music ? getAppleMusicEmbedUrl(band.apple_music) : null
  const hasMedia = !!(youtubeEmbed || spotifyEmbed || appleMusicEmbed)

  return (
    <div className="bg-[#fefaf4] dark:bg-[#231d15] rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200 group flex flex-col h-full">

      {/* ── Mobile: horizontal list row ── */}
      <div className="flex sm:hidden items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="shrink-0 relative">
          <Link href={`/bands/${band.id}`}>
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-amber-100 to-orange-100 overflow-hidden">
              {band.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={band.photo_url} alt={band.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Music className="w-6 h-6 text-amber-400" />
                </div>
              )}
            </div>
          </Link>
          {hasMedia && (
            <div className="absolute -bottom-1.5 -right-1.5">
              <PlayButton
                bandId={band.id}
                bandName={band.name}
                photoUrl={band.photo_url}
                youtubeEmbed={youtubeEmbed}
                spotifyEmbed={spotifyEmbed}
                spotifyHeight={spotifyEmbed ? getSpotifyEmbedHeight(spotifyEmbed) : 352}
                appleMusicEmbed={appleMusicEmbed}
                appleMusicHeight={appleMusicEmbed ? getAppleMusicEmbedHeight(appleMusicEmbed) : 450}
                variant="circle-sm"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <Link href={`/bands/${band.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">{band.name}</h3>
            {band.is_looking_for_members && (
              <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full leading-none">
                Open
              </span>
            )}
          </div>
          {(band.city_name || band.province_name) && (
            <p className="flex items-center gap-1 text-xs text-stone-400 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{band.city_name ?? band.province_name}</span>
            </p>
          )}
          {Array.isArray(band.genres) && band.genres.length > 0 && (
            <div className="flex gap-1 mt-1.5 overflow-hidden">
              {band.genres.slice(0, 3).map((g) => (
                <span key={g.id} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  {g.name}
                </span>
              ))}
              {band.genres.length > 3 && (
                <span className="text-[10px] text-stone-400 self-center">+{band.genres.length - 3}</span>
              )}
            </div>
          )}
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn !== undefined && (
            <SaveBandButton bandId={band.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} variant="icon" />
          )}
          <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
        </div>
      </div>

      {/* ── Desktop: card layout ── */}
      <div className="hidden sm:flex flex-col flex-1">
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

        <div className="p-4 flex flex-col flex-1">
          <Link href={`/bands/${band.id}`} className="hover:underline">
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 truncate">{band.name}</h3>
          </Link>

          {(band.city_name || band.province_name) && (
            <p className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{band.city_name && `${band.city_name}, `}{band.province_name}</span>
            </p>
          )}

          {band.bio && (
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-snug">{band.bio}</p>
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

          <div className="mt-auto pt-3 flex gap-2">
            {band.instagram && (
              <a
                href={`https://instagram.com/${band.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-sm border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 px-2 py-2 rounded-lg hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors min-h-11 flex items-center justify-center"
              >
                Instagram
              </a>
            )}
            {contactLink && (
              <a
                href={contactLink}
                target="_blank"
                rel="noopener noreferrer"
                className={contactStyle}
              >
                {contactLabel}
              </a>
            )}
            {isLoggedIn !== undefined && (
              <SaveBandButton bandId={band.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} variant="icon" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
