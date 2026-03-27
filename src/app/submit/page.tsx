import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/admin-queries'
import { getActiveBandsCount } from '@/lib/queries'
import { SubmitForm } from './SubmitForm'

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/submit')

  const t = await getTranslations('submit')

  const [admin, activeCount] = await Promise.all([
    isAdmin(),
    getActiveBandsCount(user.id),
  ])

  const atLimit = !admin && activeCount >= 1

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-stone-500 text-sm mb-8">{t('subtitle')}</p>

      {atLimit ? (
        <div className="flex flex-col items-center text-center gap-4 py-16 px-6 bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-700 dark:text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Kamu sudah punya 1 band aktif
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Upgrade ke Pro untuk daftarkan lebih banyak band.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Pelajari Pro →
          </Link>
        </div>
      ) : (
        <SubmitForm />
      )}
    </div>
  )
}
