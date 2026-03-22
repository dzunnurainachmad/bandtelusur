'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  bandId: string
  initialSaved: boolean
  isLoggedIn: boolean
  variant?: 'default' | 'icon'
}

export function SaveBandButton({ bandId, initialSaved, isLoggedIn, variant = 'default' }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('saveBand')

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname))
      return
    }

    setLoading(true)
    const res = await fetch('/api/saved-bands', {
      method: saved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ band_id: bandId }),
    })
    setLoading(false)

    if (res.ok) {
      setSaved(!saved)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        title={saved ? t('removeTitle') : t('saveTitle')}
        className={`flex-none p-2.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          saved
            ? 'bg-amber-700 text-white border-amber-700 hover:bg-amber-800'
            : 'border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={saved ? t('removeTitle') : t('saveTitle')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        saved
          ? 'bg-amber-700 text-white border-amber-700 hover:bg-amber-800 hover:border-amber-800'
          : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500'
      }`}
    >
      <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
      {saved ? t('saved') : t('save')}
    </button>
  )
}
