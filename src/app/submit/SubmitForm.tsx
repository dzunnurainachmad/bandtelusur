'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ImagePlus, Sparkles, X, Globe, Loader2 } from 'lucide-react'
import type { SubmitBandAgentResult } from '@/lib/schemas'
import { getProvinces, getCitiesByProvince, getGenres, uploadBandPhoto } from '@/lib/queries'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextArea } from '@/components/ui/TextArea'
import { ImageCropper } from '@/components/ui/ImageCropper'
import { Button } from '@/components/ui/Button'
import type { Province, City, Genre } from '@/types'

export function SubmitForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('submit')
  const f = useTranslations('bandForm')

  const [provinces, setProvinces] = useState<Province[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoSuggestions, setPhotoSuggestions] = useState<{ suggested_genres: string[]; vibe_tags: string[] } | null>(null)
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    formed_year: '',
    province_id: '',
    city_id: '',
    contact_wa: '',
    contact_email: '',
    instagram: '',
    youtube: '',
    spotify: '',
    youtube_music: '',
    apple_music: '',
    bandcamp: '',
    is_looking_for_members: false,
    genre_ids: [] as number[],
  })

  useEffect(() => {
    getProvinces().then(setProvinces)
    getGenres().then(setGenres)
  }, [])

  useEffect(() => {
    if (form.province_id) {
      getCitiesByProvince(Number(form.province_id)).then(setCities)
      setForm((f) => ({ ...f, city_id: '' }))
    } else {
      setCities([])
    }
  }, [form.province_id])

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleUsernameChange = useCallback((val: string) => {
    const lower = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    set('username', lower)
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (!lower) { setUsernameStatus('idle'); return }
    if (!/^[a-z0-9_]{3,30}$/.test(lower)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/bands/check-username?username=${lower}`)
      const { available } = await res.json()
      setUsernameStatus(available ? 'available' : 'taken')
    }, 400)
  }, [])

  function toggleGenre(id: number) {
    setForm((f) => ({
      ...f,
      genre_ids: f.genre_ids.includes(id)
        ? f.genre_ids.filter((g) => g !== id)
        : [...f.genre_ids, id],
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError(t('errors.photoSize')); return }
    setCropSrc(URL.createObjectURL(file))
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCropConfirm(croppedFile: File) {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(croppedFile)
    setPhotoPreview(URL.createObjectURL(croppedFile))
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setPhotoSuggestions(null)

    setAnalyzingPhoto(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(croppedFile)
      })
      const availableGenres = genres.map((g) => g.name).join(', ')
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: croppedFile.type, availableGenres }),
      })
      if (res.ok) setPhotoSuggestions(await res.json())
    } catch {
      // Suggestions are optional, ignore errors
    } finally {
      setAnalyzingPhoto(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function removePhoto() {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) return setError(t('errors.nameRequired'))
    if (!form.username) return setError(f('username.errorRequired'))
    if (usernameStatus === 'invalid') return setError(f('username.invalid'))
    if (usernameStatus === 'taken') return setError(f('username.taken'))
    if (usernameStatus === 'checking') return setError(f('username.checking'))
    setSubmitting(true)
    setError('')

    try {
      let photo_url: string | undefined
      if (photoFile) {
        setUploading(true)
        photo_url = await uploadBandPhoto(photoFile)
        setUploading(false)
      }

      const res = await fetch('/api/bands/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username,
          bio: form.bio || null,
          formed_year: form.formed_year ? Number(form.formed_year) : null,
          province_id: form.province_id ? Number(form.province_id) : null,
          city_id: form.city_id ? Number(form.city_id) : null,
          contact_wa: form.contact_wa || null,
          contact_email: form.contact_email || null,
          instagram: form.instagram || null,
          youtube: form.youtube || null,
          spotify: form.spotify || null,
          youtube_music: form.youtube_music || null,
          apple_music: form.apple_music || null,
          bandcamp: form.bandcamp || null,
          photo_url: photo_url ?? null,
          is_looking_for_members: form.is_looking_for_members,
          genre_ids: form.genre_ids,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('errors.genericError'))
      }
      const { id, username } = await res.json()
      router.push(`/bands/${username ?? id}`)
    } catch (err) {
      setError((err as Error).message ?? t('errors.genericError'))
      setSubmitting(false)
      setUploading(false)
    }
  }

  const [fillUrl, setFillUrl] = useState('')
  const [fillingFromUrl, setFillingFromUrl] = useState(false)
  const [fillResult, setFillResult] = useState<SubmitBandAgentResult | null>(null)

  async function handleFillFromUrl() {
    if (!fillUrl.trim()) return
    setFillingFromUrl(true)
    setFillResult(null)
    try {
      const res = await fetch('/api/agents/submit-band', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fillUrl }),
      })
      if (!res.ok) throw new Error(t('errors.fetchFailed'))
      const data: SubmitBandAgentResult = await res.json()
      setFillResult(data)
      if (data.name) set('name', data.name)
      if (data.bio) set('bio', data.bio)
      if (data.instagram) set('instagram', data.instagram)
      if (data.youtube) set('youtube', data.youtube)
      if (data.spotify) set('spotify', data.spotify)
      if (data.formed_year) set('formed_year', data.formed_year)
      if (data.suggested_genres.length > 0) {
        const matchedIds = genres
          .filter((g) => data.suggested_genres.some((sg) => g.name.toLowerCase() === sg.toLowerCase()))
          .map((g) => g.id)
        if (matchedIds.length > 0) set('genre_ids', matchedIds)
      }
    } catch {
      setError(t('errors.fillFromUrlFailed'))
    } finally {
      setFillingFromUrl(false)
    }
  }

  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerateBio() {
    if (!form.name.trim()) { setError(t('errors.bioNameRequired')); return }
    setError('')
    setIsGenerating(true)
    set('bio', '')

    try {
      const selectedProvince = provinces.find((p) => String(p.id) === form.province_id)
      const selectedCity = cities.find((c) => String(c.id) === form.city_id)
      const location = [selectedCity?.name, selectedProvince?.name].filter(Boolean).join(', ')
      const selectedGenres = genres.filter((g) => form.genre_ids.includes(g.id)).map((g) => g.name).join(', ')

      const res = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, genre: selectedGenres, formedYear: form.formed_year, location }),
      })

      if (!res.ok) throw new Error()

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let bio = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        bio += decoder.decode(value, { stream: true })
        set('bio', bio)
      }
    } catch {
      setError(t('errors.bioFailed'))
    } finally {
      setIsGenerating(false)
    }
  }

  const submitLabel = uploading ? t('uploading') : submitting ? t('submitting') : t('submitBtn')

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl p-4 sm:p-6">

      {/* Fill from URL */}
      <div className="border border-dashed border-amber-300 dark:border-amber-800 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-amber-600" /> {t('fillFromUrl')}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{t('fillFromUrlHint')}</p>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <Input type="url" value={fillUrl} onChange={(e) => setFillUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button
            type="button"
            onClick={handleFillFromUrl}
            disabled={!fillUrl.trim()}
            loading={fillingFromUrl}
            className="whitespace-nowrap"
          >
            {fillingFromUrl ? t('analyzing') : t('fillForm')}
          </Button>
        </div>
        {fillResult && !fillingFromUrl && (
          <p className="text-xs text-green-700 dark:text-green-400">
            {t('fillSuccess')}
            {fillResult.flags.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400"> · {fillResult.flags.join(', ')}</span>
            )}
          </p>
        )}
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{f('photo')}</label>
        {photoPreview ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview foto band" className="w-full h-full object-cover" />
            <button type="button" onClick={removePhoto} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors">
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
            <span className="text-sm">{f('photoUpload')}</span>
            <span className="text-xs">{f('photoHint')}</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />

        {analyzingPhoto && (
          <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> {t('analyzingPhoto')}
          </p>
        )}
        {photoSuggestions && (
          <div className="mt-3 space-y-2">
            {photoSuggestions.suggested_genres.length > 0 && (
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> {t('photoGenreSuggestion')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {photoSuggestions.suggested_genres.map((name) => {
                    const genre = genres.find((g) => g.name.toLowerCase() === name.toLowerCase())
                    if (!genre) return null
                    const selected = form.genre_ids.includes(genre.id)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => !selected && toggleGenre(genre.id)}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          selected
                            ? 'bg-amber-700 text-white border-amber-700 opacity-60 cursor-default'
                            : 'border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}{name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {photoSuggestions.vibe_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {photoSuggestions.vibe_tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          {f('nameLabel')} <span className="text-red-500">*</span>
        </label>
        <Input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={f('namePlaceholder')} />
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{f('username.label')} <span className="text-red-500">*</span></label>
        <Input
          type="text"
          value={form.username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder={f('username.placeholder')}
          prefix="@"
        />
        {form.username ? (
          <p className={`text-xs mt-1 ${
            usernameStatus === 'available' ? 'text-emerald-600 dark:text-emerald-400' :
            usernameStatus === 'taken' ? 'text-red-500' :
            usernameStatus === 'invalid' ? 'text-amber-600' :
            'text-stone-400'
          }`}>
            {usernameStatus === 'checking' && f('username.checking')}
            {usernameStatus === 'available' && `✓ ${f('username.available')} · bands/${form.username}`}
            {usernameStatus === 'taken' && f('username.taken')}
            {usernameStatus === 'invalid' && f('username.invalid')}
          </p>
        ) : (
          <p className="text-xs mt-1 text-stone-400">{f('username.hint')}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{f('bioLabel')}</label>
          <Button
            type="button"
            variant="ghost-amber"
            size="sm"
            onClick={handleGenerateBio}
            disabled={isGenerating || !form.name.trim()}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? f('generating') : f('generateBio')}
          </Button>
        </div>
        <TextArea value={form.bio} onChange={(e) => set('bio', e.target.value)} readOnly={isGenerating} rows={3} placeholder={f('bioPlaceholder')} />
      </div>

      {/* Formed year */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{f('formedYear')}</label>
        <Input type="text" inputMode="numeric" pattern="[0-9]*" value={form.formed_year} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) set('formed_year', e.target.value) }} placeholder="2010" maxLength={4} />
      </div>

      {/* Province + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label={f('province')} placeholder={f('provincePlaceholder')} value={form.province_id} options={provinces.map((p) => ({ value: String(p.id), label: p.name }))} onChange={(val) => set('province_id', val)} searchable searchPlaceholder={f('selectSearch')} notFoundText={f('selectNotFound')} />
        <Select label={f('city')} placeholder={f('cityPlaceholder')} value={form.city_id} options={cities.map((c) => ({ value: String(c.id), label: c.name }))} onChange={(val) => set('city_id', val)} disabled={cities.length === 0} searchable searchPlaceholder={f('selectSearch')} notFoundText={f('selectNotFound')} />
      </div>

      {/* Genres */}
      <div>
        <label className="block text-sm font-medium mb-2">{f('genre')}</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
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
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{f('whatsapp')}</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-stone-300 dark:border-stone-600 rounded-l-lg bg-stone-50 dark:bg-stone-700 text-stone-500 dark:text-stone-400 text-sm">+62</span>
          <input
            type="text"
            value={form.contact_wa.replace(/^62/, '')}
            onChange={(e) => set('contact_wa', '62' + e.target.value.replace(/^0/, ''))}
            className="flex-1 border border-stone-300 dark:border-stone-600 bg-surface dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="8123456789"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{f('email')}</label>
        <Input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="band@email.com" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: f('instagram'), field: 'instagram', placeholder: '@bandkamu' },
          { label: f('youtubeUrl'), field: 'youtube', placeholder: 'youtube.com/c/...' },
          { label: f('spotifyUrl'), field: 'spotify', placeholder: 'open.spotify.com/artist/...' },
          { label: f('youtubeMusicUrl'), field: 'youtube_music', placeholder: 'music.youtube.com/channel/...' },
          { label: f('appleMusicUrl'), field: 'apple_music', placeholder: 'music.apple.com/id/artist/...' },
          { label: f('bandcampUrl'), field: 'bandcamp', placeholder: 'bandname.bandcamp.com' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</label>
            <Input type="text" value={(form as unknown as Record<string, string>)[field]} onChange={(e) => set(field, e.target.value)} placeholder={placeholder} />
          </div>
        ))}
      </div>

      {/* Looking for members */}
      <Checkbox checked={form.is_looking_for_members} onChange={(e) => set('is_looking_for_members', e.target.checked)}>
        <span className="text-sm text-stone-700 dark:text-stone-300">{f('openMember')}</span>
      </Checkbox>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {submitLabel}
      </Button>

      {cropSrc && <ImageCropper src={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />}
    </form>
  )
}
