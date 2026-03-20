'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { ImageCropper } from '@/components/ui/ImageCropper'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [originalUsername, setOriginalUsername] = useState<string | null>(null)

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/settings')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    supabaseBrowser
      .from('profiles')
      .select('display_name, bio, avatar_url, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setDisplayName(data.display_name ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url)
        setAvatarPreview(data.avatar_url)
        setUsername(data.username ?? '')
        setOriginalUsername(data.username ?? null)
      })
  }, [user])

  function handleUsernameChange(value: string) {
    const lower = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(lower)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!lower) { setUsernameStatus('idle'); return }
    if (!USERNAME_RE.test(lower)) { setUsernameStatus('invalid'); return }
    if (lower === originalUsername) { setUsernameStatus('available'); return }

    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/profile/check-username?username=${lower}`)
      const { available, reason } = await res.json()
      setUsernameStatus(reason === 'format' ? 'invalid' : available ? 'available' : 'taken')
    }, 500)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Ukuran foto maksimal 2 MB.'); return }
    setError(null)
    setCropSrc(URL.createObjectURL(file))
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleCropConfirm(croppedFile: File) {
    if (!user) return
    setCropSrc(null)
    setUploadingAvatar(true)
    setError(null)

    const filename = `${user.id}.webp`
    const { error: uploadError } = await supabaseBrowser.storage
      .from('avatars')
      .upload(filename, croppedFile, { upsert: true, contentType: 'image/webp' })

    if (uploadError) {
      setError('Gagal upload foto: ' + uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data } = supabaseBrowser.storage.from('avatars').getPublicUrl(filename)
    const url = data.publicUrl + `?t=${Date.now()}`
    setAvatarUrl(url)
    setAvatarPreview(url)
    setUploadingAvatar(false)
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        username: username || null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Gagal menyimpan')
      return
    }

    setOriginalUsername(username || null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading || !user) return null

  const initials = (displayName || user.email || '?').slice(0, 2).toUpperCase()

  const usernameHint = {
    idle: null,
    checking: <span className="text-stone-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Mengecek...</span>,
    available: <span className="text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Tersedia</span>,
    taken: <span className="text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Sudah dipakai</span>,
    invalid: <span className="text-red-500">3–30 karakter, hanya huruf kecil, angka, dan _</span>,
  }[usernameStatus]

  const canSave = usernameStatus !== 'taken' && usernameStatus !== 'invalid' && usernameStatus !== 'checking'

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">Pengaturan Profil</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">{user.email}</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-stone-200 dark:border-stone-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-2xl font-bold border-2 border-stone-200 dark:border-stone-700">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 bg-amber-700 text-white rounded-full flex items-center justify-center hover:bg-amber-800 transition-colors"
            >
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Foto Profil</p>
            <p className="text-xs text-stone-400 mt-0.5">JPEG, PNG, atau WebP · Maks 2 MB</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Username
          </label>
          <div className="flex items-center border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 rounded-lg px-3 py-2.5 text-sm focus-within:ring-2 focus-within:ring-amber-500 min-h-11">
            <span className="text-stone-400 mr-1 text-xs sm:text-sm whitespace-nowrap">bandtelusur.com/u/</span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={30}
              placeholder="namamu"
              className="flex-1 bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>
          <div className="text-xs mt-1.5 min-h-[16px]">{usernameHint}</div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Nama Tampilan
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder="Nama yang terlihat publik"
            className="w-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-11"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Ceritakan sedikit tentang dirimu..."
            className="w-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
          <p className="text-xs text-stone-400 mt-1 text-right">{bio.length}/200</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving || !canSave}
          className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-11"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> Tersimpan</>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </form>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          square
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
