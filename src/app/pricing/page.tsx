import { Check } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">Pilih Plan</h1>
        <p className="text-stone-500 dark:text-stone-400">Mulai gratis, upgrade kapan saja.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-6">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Free</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Rp 0</p>
          <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              1 band aktif
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Profil band lengkap
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Muncul di browse & pencarian
            </li>
          </ul>
        </div>

        {/* Pro */}
        <div className="border-2 border-amber-600 dark:border-amber-500 rounded-2xl p-6 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-medium px-3 py-1 rounded-full">
            Segera Hadir
          </span>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-500 mb-1">Pro</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">TBD</p>
          <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Band aktif tidak terbatas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Semua fitur Free
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Prioritas di hasil pencarian
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
