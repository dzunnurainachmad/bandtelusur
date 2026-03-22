'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BandTagPicker } from './BandTagPicker'
import type { TaggedBand } from '@/types'

export function CreatePostForm() {
  const router = useRouter()
  const [type, setType] = useState<'gig' | 'general'>('gig')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [ticketPrice, setTicketPrice] = useState('')
  const [ticketUrl, setTicketUrl] = useState('')
  const [taggedBands, setTaggedBands] = useState<TaggedBand[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Judul wajib diisi.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          body,
          event_date: eventDate || null,
          location,
          ticket_price: ticketPrice,
          ticket_url: ticketUrl,
          band_ids: taggedBands.map((b) => b.id),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Gagal membuat post')
      }
      router.push('/feed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400'

  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div>
        <p className={labelClass}>Tipe Post</p>
        <div className="flex gap-2">
          {(['gig', 'general'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={
                type === t
                  ? 'flex-1 py-2.5 text-sm font-medium rounded-lg border-2 border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 transition-colors'
                  : 'flex-1 py-2.5 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 transition-colors'
              }
            >
              {t === 'gig' ? '🎸 Gigs' : '📢 Post Umum'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>
          Judul <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'gig' ? 'Contoh: Gigs Malam Minggu di Bandung' : 'Contoh: Kami mencari drummer!'}
          className={inputClass}
          maxLength={200}
        />
      </div>

      {/* Body */}
      <div>
        <label className={labelClass}>Deskripsi</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ceritakan lebih lanjut..."
          rows={4}
          className={inputClass + ' resize-none'}
          maxLength={2000}
        />
      </div>

      {/* Gig-specific fields */}
      {type === 'gig' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tanggal & Waktu</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Rossi Musik, Jakarta"
                className={inputClass}
                maxLength={200}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Harga Tiket</label>
              <input
                type="text"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="Contoh: Gratis / Rp50.000"
                className={inputClass}
                maxLength={100}
              />
            </div>
            <div>
              <label className={labelClass}>Link Beli Tiket</label>
              <input
                type="url"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://loket.com/..."
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

      {/* Band tags */}
      <div>
        <label className={labelClass}>Tag Band</label>
        <BandTagPicker selected={taggedBands} onChange={setTaggedBands} />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
      >
        {submitting ? 'Memposting...' : 'Buat Post'}
      </button>
    </form>
  )
}
