import Link from 'next/link'
import { MapPin, Guitar, Users, MessageCircle, Sparkles, Music } from 'lucide-react'
import { LogoBT } from '@/components/LogoBT'
import { getGenres } from '@/lib/queries'

const FEATURED_SLUGS = ['rock', 'metal', 'indie', 'jazz', 'pop', 'dangdut', 'reggae', 'electronic', 'folk', 'punk']

export default async function Home() {
  const allGenres = await getGenres()
  const genres = allGenres.filter((g) => FEATURED_SLUGS.includes(g.slug))
  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-amber-700 to-amber-900 text-white py-12 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <LogoBT className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Temukan Band<br />di Seluruh Indonesia
          </h1>
          <p className="text-amber-100 text-sm sm:text-lg mb-8 max-w-xl mx-auto">
            Jelajahi ratusan band dan project musik dari Sabang sampai Merauke.
            Filter berdasarkan provinsi, kota, dan genre favoritmu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-[#fefaf4] text-amber-800 font-semibold px-6 py-3 rounded-xl hover:bg-amber-50 transition-colors"
            >
              Jelajahi Band
            </Link>
            <Link
              href="/submit"
              className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#fefaf4]/10 transition-colors"
            >
              Daftarkan Band Kamu
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-12 text-stone-900 dark:text-stone-100">Fitur Unggulan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">Filter Lokasi</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Cari band berdasarkan 34 provinsi dan ratusan kota di Indonesia.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Guitar className="w-6 h-6 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">Filter Genre</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Dari Rock, Metal, Jazz, Dangdut hingga Electronic — semua ada di sini.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">Cari Member</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Band yang buka lowongan member mudah ditemukan dengan filter khusus.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">Discover AI</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Tanya AI untuk rekomendasi band sesuai selera — cukup ceritakan musik yang kamu suka.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">AI Bio Generator</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Buat bio band secara otomatis dengan AI. Cukup isi detail, bio langsung jadi.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-rose-100 dark:bg-rose-900/30 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Music className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">Dengarkan Langsung</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Putar musik dari Spotify, YouTube, dan Apple Music langsung di halaman band.
            </p>
          </div>
        </div>
      </section>

      {/* AI CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-10 sm:pb-16">
        <div className="bg-linear-to-r from-purple-600 to-amber-700 rounded-2xl p-6 sm:p-10 text-white text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Bingung Mau Dengerin Apa?</h2>
          <p className="text-white/80 text-sm sm:text-base mb-5 max-w-lg mx-auto">
            Ceritakan selera musikmu ke AI kami, dan dapatkan rekomendasi band Indonesia yang cocok buatmu.
          </p>
          <Link
            href="/chat"
            className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors"
          >
            Coba Discover AI
          </Link>
        </div>
      </section>

      {/* Genre pills */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold mb-4">Jelajahi Genre</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/browse?genre=${g.id}`}
              className="bg-[#fefaf4] border border-stone-200 text-stone-700 px-4 py-1.5 rounded-full text-sm hover:border-amber-500 hover:text-amber-700 transition-colors"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-[#fefaf4] dark:bg-[#231d15]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 font-bold text-amber-700 text-lg mb-3">
                <LogoBT className="w-6 h-6" />
                BandTelusur
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Platform direktori band Indonesia. Temukan, daftarkan, dan hubungkan musisi dari seluruh nusantara.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">Navigasi</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">Jelajahi Band</Link></li>
                <li><Link href="/chat" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">Discover AI</Link></li>
                <li><Link href="/submit" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">Daftarkan Band</Link></li>
                <li><Link href="/terms" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>

            {/* Genre */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">Genre Populer</h4>
              <ul className="space-y-2 text-sm">
                {genres.slice(0, 5).map((g) => (
                  <li key={g.id}>
                    <Link href={`/browse?genre=${g.id}`} className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 dark:text-stone-500">
            <p>&copy; {new Date().getFullYear()} BandTelusur. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
                Syarat & Ketentuan
              </Link>
              <span>·</span>
              <p>Dibuat dengan semangat untuk musik Indonesia.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
