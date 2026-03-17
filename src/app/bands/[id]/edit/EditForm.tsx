'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X } from 'lucide-react'
import { getProvinces, getCitiesByProvince, getGenres, updateBand, uploadBandPhoto } from '@/lib/queries'
import { Select } from '@/components/ui/Select'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { DeleteBandButton } from '@/components/DeleteBandButton'
import type { Band, Province, City, Genre } from '@/types'

interface Props { band: Band }

export function EditForm({ band }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(band.photo_url)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const [form, setFormState] = useState({
    name: band.name ?? '',
    bio: band.bio ?? '',
    formed_year: band.formed_year ? String(band.formed_year) : '',
    province_id: band.province_id ? String(band.province_id) : '',
    city_id: band.city_id ? String(band.city_id) : '',
    contact_wa: band.contact_wa ?? '',
    instagram: band.instagram ?? '',
    youtube: band.youtube ?? '',
    spotify: band.spotify ?? '',
    youtube_music: band.youtube_music ?? '',
    apple_music: band.apple_music ?? '',
    bandcamp: band.bandcamp ?? '',
    is_looking_for_members: band.is_looking_for_members ?? false,
    genre_ids: Array.isArray(band.genres) ? band.genres.map((g) => g.id) : [],
  })

  useEffect(() => {
    getProvinces().then(setProvinces)
    getGenres().then(setGenres)
    if (band.province_id) {
      getCitiesByProvince(band.province_id).then(setCities)
    }
  }, [band.province_id])

  // Load cities when province changes (but not on initial mount)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (form.province_id) {
      getCitiesByProvince(Number(form.province_id)).then(setCities)
      set('city_id', '')
    } else {
      setCities([])
      set('city_id', '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.province_id])

  function set(field: string, value: unknown) {
    setFormState((f) => ({ ...f, [field]: value }))
  }

  function toggleGenre(id: number) {
    setFormState((f) => ({
      ...f,
      genre_ids: f.genre_ids.includes(id)
        ? f.genre_ids.filter((g) => g !== id)
        : [...f.genre_ids, id],
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran foto maksimal 5 MB.'); return }
    setCropSrc(URL.createObjectURL(file))
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleCropConfirm(croppedFile: File) {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoFile(croppedFile)
    setPhotoPreview(URL.createObjectURL(croppedFile))
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Nama band wajib diisi.')
    setSubmitting(true)
    setError('')

    try {
      let photo_url: string | undefined = band.photo_url ?? undefined
      if (photoFile) {
        setUploading(true)
        photo_url = await uploadBandPhoto(photoFile)
        setUploading(false)
      } else if (photoPreview === null) {
        photo_url = undefined
      }

      await updateBand(band.id, {
        name: form.name.trim(),
        bio: form.bio || null,
        formed_year: form.formed_year ? Number(form.formed_year) : null,
        province_id: form.province_id ? Number(form.province_id) : null,
        city_id: form.city_id ? Number(form.city_id) : null,
        contact_wa: form.contact_wa || null,
        instagram: form.instagram || null,
        youtube: form.youtube || null,
        spotify: form.spotify || null,
        youtube_music: form.youtube_music || null,
        apple_music: form.apple_music || null,
        bandcamp: form.bandcamp || null,
        photo_url,
        is_looking_for_members: form.is_looking_for_members,
        genre_ids: form.genre_ids,
      })

      router.push(`/bands/${band.id}`)
      router.refresh()
    } catch (err) {
      setError((err as Error).message ?? 'Terjadi kesalahan.')
      setSubmitting(false)
      setUploading(false)
    }
  }

  const inputClass =
    'w-full border border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500'
  const labelClass = 'block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1'
  const submitLabel = uploading ? 'Mengupload foto...' : submitting ? 'Menyimpan...' : 'Simpan Perubahan'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl p-4 sm:p-6">

      {/* Photo */}
      <div>
        <label className={`${labelClass} mb-2`}>Foto Band</label>
        {photoPreview ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center justify-center gap-2 text-stone-400 dark:text-stone-500 hover:border-amber-500 hover:text-amber-600 transition-colors"
          >
            <ImagePlus className="w-8 h-8" />
            <span className="text-sm">Klik untuk upload foto</span>
            <span className="text-xs">JPG, PNG, WebP · Maks 5 MB</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Name */}
      <div>
        <label className={labelClass}>Nama Band / Project <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="Contoh: Burgerkill, Padi Reborn" />
      </div>

      {/* Bio */}
      <div>
        <label className={labelClass}>Bio / Deskripsi</label>
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} className={inputClass} placeholder="Ceritakan sedikit tentang band kamu..." />
      </div>

      {/* Formed year */}
      <div>
        <label className={labelClass}>Tahun Berdiri</label>
        <input type="number" value={form.formed_year} onChange={(e) => set('formed_year', e.target.value)} className={inputClass} placeholder="2010" min="1950" max={new Date().getFullYear()} />
      </div>

      {/* Province + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Provinsi" placeholder="Pilih provinsi" value={form.province_id} options={provinces.map((p) => ({ value: String(p.id), label: p.name }))} onChange={(val) => set('province_id', val)} searchable />
        <Select label="Kota / Kabupaten" placeholder="Pilih kota" value={form.city_id} options={cities.map((c) => ({ value: String(c.id), label: c.name }))} onChange={(val) => set('city_id', val)} disabled={cities.length === 0} searchable />
      </div>

      {/* Genres */}
      <div>
        <label className={`${labelClass} mb-2`}>Genre</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                form.genre_ids.includes(g.id)
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-amber-500'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className={labelClass}>Nomor WhatsApp</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-stone-300 dark:border-stone-600 rounded-l-lg bg-stone-50 dark:bg-stone-700 text-stone-500 dark:text-stone-400 text-sm">+62</span>
          <input type="text" value={form.contact_wa.replace(/^62/, '')} onChange={(e) => set('contact_wa', '62' + e.target.value.replace(/^0/, ''))} className="flex-1 border border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="8123456789" />
        </div>
      </div>

      {/* Social */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Instagram</label>
          <input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} className={inputClass} placeholder="@bandkamu" />
        </div>
        <div>
          <label className={labelClass}>YouTube URL</label>
          <input type="text" value={form.youtube} onChange={(e) => set('youtube', e.target.value)} className={inputClass} placeholder="youtube.com/c/..." />
        </div>
        <div>
          <label className={labelClass}>Spotify URL</label>
          <input type="text" value={form.spotify} onChange={(e) => set('spotify', e.target.value)} className={inputClass} placeholder="open.spotify.com/artist/..." />
        </div>
        <div>
          <label className={labelClass}>YouTube Music URL</label>
          <input type="text" value={form.youtube_music} onChange={(e) => set('youtube_music', e.target.value)} className={inputClass} placeholder="music.youtube.com/channel/..." />
        </div>
        <div>
          <label className={labelClass}>Apple Music URL</label>
          <input type="text" value={form.apple_music} onChange={(e) => set('apple_music', e.target.value)} className={inputClass} placeholder="music.apple.com/id/artist/..." />
        </div>
        <div>
          <label className={labelClass}>Bandcamp URL</label>
          <input type="text" value={form.bandcamp} onChange={(e) => set('bandcamp', e.target.value)} className={inputClass} placeholder="bandname.bandcamp.com" />
        </div>
      </div>

      {/* Looking for members */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.is_looking_for_members} onChange={(e) => set('is_looking_for_members', e.target.checked)} className="rounded text-amber-700 w-4 h-4" />
        <span className="text-sm text-stone-700 dark:text-stone-300">Band kami sedang membuka lowongan untuk member baru</span>
      </label>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="flex-1 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
          Batal
        </button>
        <button type="submit" disabled={submitting} className="flex-1 bg-amber-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-800 transition-colors disabled:opacity-60">
          {submitLabel}
        </button>
      </div>

      <div className="pt-4 border-t border-stone-200 dark:border-stone-700 flex justify-end">
        <DeleteBandButton bandId={band.id} bandName={band.name} />
      </div>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </form>
  )
}
