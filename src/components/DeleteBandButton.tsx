'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteBand } from '@/lib/queries'

interface Props {
  bandId: string
  bandName: string
  redirectTo?: string
}

export function DeleteBandButton({ bandId, bandName, redirectTo = '/dashboard' }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteBand(bandId)
      router.push(redirectTo)
      router.refresh()
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500 dark:text-stone-400">Hapus &quot;{bandName}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-sm border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 px-3 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          Batal
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Hapus Band
    </button>
  )
}
