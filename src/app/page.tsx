import Link from 'next/link'
import { Music2, MapPin, Guitar, Users } from 'lucide-react'
import { getGenres } from '@/lib/queries'

const FEATURED_SLUGS = ['rock', 'metal', 'indie', 'jazz', 'pop', 'dangdut', 'reggae', 'electronic', 'folk', 'punk']

export default async function Home() {
  const allGenres = await getGenres()
  const genres = allGenres.filter((g) => FEATURED_SLUGS.includes(g.slug))
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-700 to-amber-900 text-white py-12 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Music2 className="w-10 h-10 sm:w-12 sm:h-12 opacity-80" />
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
      <section className="max-w-5xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        <div className="text-center">
          <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="font-bold text-lg mb-1">Filter Lokasi</h3>
          <p className="text-stone-500 text-sm">
            Cari band berdasarkan 34 provinsi dan ratusan kota di Indonesia.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Guitar className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="font-bold text-lg mb-1">Filter Genre</h3>
          <p className="text-stone-500 text-sm">
            Dari Rock, Metal, Jazz, Dangdut hingga Electronic — semua ada di sini.
          </p>
        </div>
        <div className="text-center">
          <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-bold text-lg mb-1">Cari Member</h3>
          <p className="text-stone-500 text-sm">
            Band yang buka lowongan member mudah ditemukan dengan filter khusus.
          </p>
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
    </div>
  )
}
