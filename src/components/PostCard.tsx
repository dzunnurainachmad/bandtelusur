'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Ticket, User, Trash2, ExternalLink, ImageDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Post } from '@/types'

interface Props {
  post: Post
  onDelete?: (id: string) => void
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  return `${date} · ${time}`
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PostCard({ post, onDelete }: Props) {
  const { user } = useAuth()
  const isOwner = !!user && user.id === post.user_id
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDelete?.(post.id)
    else setDeleting(false)
    setConfirming(false)
  }

  return (
    <article className="bg-[#fefaf4] dark:bg-[#231d15] rounded-2xl border border-stone-200 dark:border-stone-700 p-4 sm:p-5 space-y-3">
      {/* Header: type badge + actions */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={
            post.type === 'gig'
              ? 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              : 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
          }
        >
          {post.type === 'gig' ? '🎸 Gigs' : '📢 Post'}
        </span>
        <div className="flex items-center gap-1">
          {post.type === 'gig' && !confirming && (
            <a
              href={`/api/posts/${post.id}/poster`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Download poster"
            >
              <ImageDown className="w-3.5 h-3.5" />
            </a>
          )}
          {isOwner && onDelete && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Hapus post"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirming && (
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">Hapus post ini?</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-stone-900 dark:text-stone-100 leading-snug">{post.title}</h3>

      {/* Body */}
      {post.body && (
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line line-clamp-4">
          {post.body}
        </p>
      )}

      {/* Gig details */}
      {post.type === 'gig' && (
        <div className="space-y-1.5 text-sm text-stone-600 dark:text-stone-400">
          {post.event_date && (
            <p className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{formatEventDate(post.event_date)}</span>
            </p>
          )}
          {post.location && (
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{post.location}</span>
            </p>
          )}
          {(post.ticket_price || post.ticket_url) && (
            <p className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              {post.ticket_price && <span>{post.ticket_price}</span>}
              {post.ticket_url && (
                <a
                  href={post.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-600 hover:underline"
                >
                  Beli Tiket <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          )}
        </div>
      )}

      {/* Tagged bands */}
      {post.tagged_bands && post.tagged_bands.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tagged_bands.map((band) => (
            <Link
              key={band.id}
              href={`/bands/${band.username ?? band.id}`}
              className="inline-flex items-center gap-1.5 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 px-2 py-1 rounded-full transition-colors"
            >
              {band.photo_url ? (
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 relative">
                  <Image src={band.photo_url} alt={band.name} fill className="object-cover" sizes="16px" />
                </div>
              ) : null}
              {band.name}
            </Link>
          ))}
        </div>
      )}

      {/* Footer: author + date */}
      <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
        {post.author_avatar_url ? (
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 relative">
            <Image src={post.author_avatar_url} alt={post.author_display_name ?? ''} fill className="object-cover" sizes="20px" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-amber-700 dark:text-amber-400" />
          </div>
        )}
        <span className="text-xs text-stone-400 dark:text-stone-500 truncate">
          {post.author_display_name ?? post.author_username ?? 'Pengguna'}
        </span>
        <span className="text-xs text-stone-300 dark:text-stone-600 ml-auto shrink-0">
          {formatRelative(post.created_at)}
        </span>
      </div>
    </article>
  )
}
