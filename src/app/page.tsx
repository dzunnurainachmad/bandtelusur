import Link from 'next/link'
import { MapPin, Guitar, Users, MessageCircle, Sparkles, Music } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { LogoBT } from '@/components/LogoBT'
import { getGenres } from '@/lib/queries'

const FEATURED_SLUGS = ['rock', 'metal', 'indie', 'jazz', 'pop', 'dangdut', 'reggae', 'electronic', 'folk', 'punk']

export default async function Home() {
  const allGenres = await getGenres()
  const genres = allGenres.filter((g) => FEATURED_SLUGS.includes(g.slug))
  const t = await getTranslations('home')

  const features = [
    { icon: MapPin, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', titleKey: 'features.location.title', descKey: 'features.location.desc' },
    { icon: Guitar, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', titleKey: 'features.genre.title', descKey: 'features.genre.desc' },
    { icon: Users, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', titleKey: 'features.member.title', descKey: 'features.member.desc' },
    { icon: MessageCircle, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', titleKey: 'features.discoverAI.title', descKey: 'features.discoverAI.desc' },
    { icon: Sparkles, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', titleKey: 'features.bioGenerator.title', descKey: 'features.bioGenerator.desc' },
    { icon: Music, iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400', titleKey: 'features.player.title', descKey: 'features.player.desc' },
  ] as const

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-amber-700 via-amber-800 to-amber-900 text-white py-14 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(255,255,255,0.04),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="flex justify-center mb-5">
            <LogoBT className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight whitespace-pre-line">
            {t('hero.title')}
          </h1>
          <p className="text-amber-100/90 text-sm sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-white text-amber-800 font-semibold px-7 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-lg shadow-amber-900/20"
            >
              {t('hero.ctaBrowse')}
            </Link>
            <Link
              href="/submit"
              className="border-2 border-white/80 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              {t('hero.ctaSubmit')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 text-stone-900 dark:text-stone-100">{t('features.title')}</h2>
        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mb-10 sm:mb-14 max-w-md mx-auto">{t('features.subtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map(({ icon: Icon, iconBg, iconColor, titleKey, descKey }) => (
            <div key={titleKey} className="text-center p-5 rounded-2xl border border-transparent hover:border-stone-200 dark:hover:border-stone-700 hover:bg-surface dark:hover:bg-[#231d15] transition-all duration-200">
              <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-lg mb-1 text-stone-900 dark:text-stone-100">{t(titleKey)}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{t(descKey)}</p>
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
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('aiCta.title')}</h2>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg mx-auto leading-relaxed">
              {t('aiCta.subtitle')}
            </p>
            <Link
              href="/chat"
              className="inline-block bg-white text-purple-700 font-semibold px-7 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20"
            >
              {t('aiCta.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Genre pills */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold mb-4 text-stone-900 dark:text-stone-100">{t('exploreGenres')}</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/browse?genre=${g.id}`}
              className="bg-surface border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-4 py-1.5 rounded-full text-sm hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 transition-colors"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 font-bold text-amber-700 text-lg mb-3">
                <LogoBT className="w-6 h-6" />
                BandTelusur
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('footer.tagline')}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">{t('footer.nav')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">{t('hero.ctaBrowse')}</Link></li>
                <li><Link href="/chat" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">Discover AI</Link></li>
                <li><Link href="/submit" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">{t('hero.ctaSubmit')}</Link></li>
                <li><Link href="/terms" className="text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>

            {/* Genre */}
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">{t('footer.popularGenres')}</h4>
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
                {t('footer.terms')}
              </Link>
              <span>·</span>
              <p>{t('footer.madeWith')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
