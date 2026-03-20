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
      <section className="bg-linear-to-br from-amber-700 via-amber-800 to-amber-900 text-white py-14 sm:py-24 px-4 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(255,255,255,0.04),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="flex justify-center mb-5">
            <LogoBT className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Temukan Band<br />di Seluruh Indonesia
          </h1>
          <p className="text-amber-100/90 text-sm sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Jelajahi ratusan band dan project musik dari Sabang sampai Merauke.
            Filter berdasarkan provinsi, kota, dan genre favoritmu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-white text-amber-800 font-semibold px-7 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-lg shadow-amber-900/20"
            >
              Jelajahi Band
            </Link>
            <Link
              href="/submit"
              className="border-2 border-white/80 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Daftarkan Band Kamu
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 text-stone-900 dark:text-stone-100">Fitur Unggulan</h2>
        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mb-10 sm:mb-14 max-w-md mx-auto">Semua yang kamu butuhkan untuk menemukan dan terhubung dengan band di Indonesia.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: MapPin, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', title: 'Filter Lokasi', desc: 'Cari band berdasarkan 34 provinsi dan ratusan kota di Indonesia.' },
            { icon: Guitar, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', title: 'Filter Genre', desc: 'Dari Rock, Metal, Jazz, Dangdut hingga Electronic — semua ada di sini.' },
            { icon: Users, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', title: 'Cari Member', desc: 'Band yang buka lowongan member mudah ditemukan dengan filter khusus.' },
            { icon: MessageCircle, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', title: 'Discover AI', desc: 'Tanya AI untuk rekomendasi band sesuai selera — cukup ceritakan musik yang kamu suka.' },
            { icon: Sparkles, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', title: 'AI Bio Generator', desc: 'Buat bio band secara otomatis dengan AI. Cukup isi detail, bio langsung jadi.' },
            { icon: Music, iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400', title: 'Dengarkan Langsung', desc: 'Putar musik dari Spotify, YouTube, dan Apple Music langsung di halaman band.' },
          ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
            <div key={title} className="text-center p-5 rounded-2xl border border-transparent hover:border-stone-200 dark:hover:border-stone-700 hover:bg-[#fefaf4] dark:hover:bg-[#231d15] transition-all duration-200">
              <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">{title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-12 sm:pb-20">
        <div className="bg-linear-to-br from-purple-600 via-purple-700 to-amber-700 rounded-2xl p-6 sm:p-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="relative">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Bingung Mau Dengerin Apa?</h2>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed">
              Ceritakan selera musikmu ke AI kami, dan dapatkan rekomendasi band Indonesia yang cocok buatmu.
            </p>
            <Link
              href="/chat"
              className="inline-block bg-white text-purple-700 font-semibold px-7 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20"
            >
              Coba Discover AI
            </Link>
          </div>
        </div>
      </section>

      {/* Genre pills */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-stone-100">Jelajahi Genre</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/browse?genre=${g.id}`}
              className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-4 py-1.5 rounded-full text-sm hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors"
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
