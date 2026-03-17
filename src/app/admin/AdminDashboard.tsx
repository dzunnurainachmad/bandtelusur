'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Music, ShieldX, ShieldCheck, Trash2, Search } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { deleteBand } from '@/lib/queries'

interface Profile {
  id: string
  email: string | null
  role: string
  is_banned: boolean
  banned_reason: string | null
  created_at: string
}

interface BandRow {
  id: string
  name: string
  user_id: string | null
  province_name?: string
  city_name?: string
  created_at: string
}

interface Props {
  users: Profile[]
  bands: BandRow[]
}

export function AdminDashboard({ users: initialUsers, bands: initialBands }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'users' | 'bands'>('users')
  const [users, setUsers] = useState(initialUsers)
  const [bands, setBands] = useState(initialBands)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [banReason, setBanReason] = useState<Record<string, string>>({})

  async function toggleBan(user: Profile) {
    setLoading(user.id)
    const update = user.is_banned
      ? { is_banned: false, banned_reason: null, banned_at: null }
      : { is_banned: true, banned_reason: banReason[user.id] || 'Pelanggaran ketentuan', banned_at: new Date().toISOString() }

    await supabaseBrowser.from('profiles').update(update).eq('id', user.id)
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...update } : u))
    setLoading(null)
  }

  async function handleDeleteBand(id: string) {
    if (!confirm('Hapus band ini?')) return
    setLoading(id)
    await deleteBand(id)
    setBands((prev) => prev.filter((b) => b.id !== id))
    setLoading(null)
    router.refresh()
  }

  const filteredUsers = users.filter((u) =>
    (u.email ?? '').toLowerCase().includes(query.toLowerCase())
  )
  const filteredBands = bands.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-fit mb-6">
        {([['users', 'Users', Users], ['bands', 'Bands', Music]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setQuery('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[#fefaf4] dark:bg-[#231d15] text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs px-1.5 py-0.5 rounded-full">
              {key === 'users' ? users.length : bands.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'users' ? 'Cari email...' : 'Cari nama band...'}
          className="w-full pl-9 pr-3 py-2 border border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Alasan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3 text-stone-900 dark:text-stone-100 font-medium">{user.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-medium">Banned</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">Aktif</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!user.is_banned && (
                      <input
                        type="text"
                        placeholder="Alasan ban..."
                        value={banReason[user.id] ?? ''}
                        onChange={(e) => setBanReason((r) => ({ ...r, [user.id]: e.target.value }))}
                        className="text-xs border border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg px-2 py-1 w-full min-w-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    )}
                    {user.is_banned && (
                      <span className="text-xs text-stone-500 dark:text-stone-400 italic">{user.banned_reason ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => toggleBan(user)}
                        disabled={loading === user.id}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          user.is_banned
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100'
                        }`}
                      >
                        {user.is_banned
                          ? <><ShieldCheck className="w-3.5 h-3.5" /> Unban</>
                          : <><ShieldX className="w-3.5 h-3.5" /> Ban</>
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Tidak ada user</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bands table */}
      {tab === 'bands' && (
        <div className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Nama Band</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Lokasi</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-stone-400 font-medium">Owner</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredBands.map((band) => {
                const ownerEmail = users.find((u) => u.id === band.user_id)?.email
                return (
                  <tr key={band.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="px-4 py-3 text-stone-900 dark:text-stone-100 font-medium">{band.name}</td>
                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400">
                      {[band.city_name, band.province_name].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 dark:text-stone-400 text-xs">{ownerEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteBand(band.id)}
                        disabled={loading === band.id}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredBands.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-400">Tidak ada band</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
