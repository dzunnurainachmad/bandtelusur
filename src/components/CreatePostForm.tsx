'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Input } from './ui/Input'
import { TextArea } from './ui/TextArea'
import { Button } from './ui/Button'
import { BandTagPicker } from './BandTagPicker'
import type { TaggedBand } from '@/types'

// Convert datetime-local value to ISO with browser's local timezone offset
// e.g. "2026-04-15T20:00" in WIB (UTC+7) → "2026-04-15T20:00:00+07:00"
function localDatetimeToISO(value: string): string {
  const offset = new Date().getTimezoneOffset() // minutes, negative = ahead of UTC
  const sign = offset <= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${value}:00${sign}${hh}:${mm}`
}

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
  const [isGenerating, setIsGenerating] = useState(false)
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
          event_date: eventDate ? localDatetimeToISO(eventDate) : null,
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

  async function handleGenerateDesc() {
    if (!title.trim()) { setError('Isi judul dulu sebelum generate deskripsi.'); return }
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/generate-gig-desc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          bands: taggedBands.map((b) => b.name),
          location,
          eventDate: eventDate ? `${eventDate}:00+07:00` : null,
          ticketPrice,
        }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let desc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        desc += decoder.decode(value, { stream: true })
        setBody(desc)
      }
    } catch {
      setError('Gagal generate deskripsi. Coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div>
        <p className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          Tipe Post
        </p>
        <div className="flex gap-2">
          {(['gig', 'general'] as const).map((t) => (
            <Button
              key={t}
              type="button"
              variant={type === t ? 'primary' : 'secondary'}
              onClick={() => setType(t)}
              className="flex-1 justify-center"
            >
              {t === 'gig' ? '🎸 Gigs' : '📢 Post Umum'}
            </Button>
          ))}
        </div>
      </div>

      {/* Title */}
      <Input
        label="Judul *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={type === 'gig' ? 'Contoh: Gigs Malam Minggu di Bandung' : 'Contoh: Kami mencari drummer!'}
        maxLength={200}
      />

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Deskripsi
          </label>
          {type === 'gig' && (
            <Button
              type="button"
              variant="ghost-amber"
              size="sm"
              onClick={handleGenerateDesc}
              disabled={isGenerating || !title.trim()}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating...' : 'Generate dengan AI'}
            </Button>
          )}
        </div>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ceritakan lebih lanjut..."
          rows={4}
          readOnly={isGenerating}
          maxLength={2000}
        />
      </div>

      {/* Gig-specific fields */}
      {type === 'gig' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal & Waktu"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="Lokasi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Rossi Musik, Jakarta"
              maxLength={200}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Harga Tiket"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              placeholder="Contoh: Gratis / Rp50.000"
              maxLength={100}
            />
            <Input
              label="Link Beli Tiket"
              type="url"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder="https://loket.com/..."
            />
          </div>
        </>
      )}

      {/* Band tags */}
      <div>
        <p className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          Tag Band
        </p>
        <BandTagPicker selected={taggedBands} onChange={setTaggedBands} />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={submitting} size="lg">
        {submitting ? 'Memposting...' : 'Buat Post'}
      </Button>
    </form>
  )
}
