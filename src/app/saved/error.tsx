'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function SavedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { segment: 'saved' } })
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Gagal memuat band tersimpan
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          Terjadi kesalahan saat mengambil daftar simpananmu.
        </p>
        <button
          onClick={reset}
          className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
