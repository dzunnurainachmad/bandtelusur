import Link from 'next/link'
import { Music } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <Music className="w-8 h-8 text-amber-600 dark:text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          Halaman yang kamu cari tidak ada atau sudah dihapus.
        </p>
        <Link
          href="/browse"
          className="inline-block bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Jelajahi Band
        </Link>
      </div>
    </div>
  )
}
