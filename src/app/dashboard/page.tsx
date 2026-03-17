import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Music, Pencil } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { BandCard } from '@/components/BandCard'
import type { Band } from '@/types'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: bands } = await supabase
    .from('bands_view')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const myBands: Band[] = bands ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{user.email}</p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Band
        </Link>
      </div>

      {myBands.length === 0 ? (
        <div className="text-center py-24 text-stone-400 dark:text-stone-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Belum ada band terdaftar</p>
          <p className="text-sm mt-1">
            <Link href="/submit" className="text-amber-600 hover:underline">
              Daftarkan band pertamamu
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{myBands.length} band</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBands.map((band) => (
              <div key={band.id} className="relative group/card">
                <BandCard band={band} />
                <Link
                  href={`/bands/${band.id}/edit`}
                  className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
