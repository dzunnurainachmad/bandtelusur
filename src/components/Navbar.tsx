'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Music2, LogOut, LayoutDashboard, LogIn, ShieldCheck, Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    supabaseBrowser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'))
  }, [user])

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? ''

  return (
    <nav className="bg-[#fefaf4] dark:bg-[#231d15] border-b border-stone-200 dark:border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-amber-700 text-lg">
            <Music2 className="w-5 h-5" />
            Bandly
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link href="/browse" className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
              Jelajahi
            </Link>

            {!loading && (
              user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 text-amber-700 dark:text-amber-500 hover:text-amber-800 transition-colors">
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/submit" className="bg-amber-700 text-white px-4 py-1.5 rounded-lg hover:bg-amber-800 transition-colors">
                    Daftarkan Band
                  </Link>
                  <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-700">
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <button onClick={handleSignOut} title="Keluar" className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-500 transition-colors">
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </Link>
                  <Link href="/submit" className="bg-amber-700 text-white px-4 py-1.5 rounded-lg hover:bg-amber-800 transition-colors">
                    Daftarkan Band
                  </Link>
                </>
              )
            )}
            <ThemeToggle />
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-[#fefaf4] dark:bg-[#231d15] px-4 py-3 space-y-1">
          <Link href="/browse" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
            Jelajahi
          </Link>

          {!loading && user && (
            <>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/submit" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
                Daftarkan Band
              </Link>
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-stone-200 dark:border-stone-700 mt-2 pt-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <span className="text-sm text-stone-500 dark:text-stone-400 truncate max-w-45">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                <LogIn className="w-4 h-4" />
                Masuk
              </Link>
              <Link href="/submit" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
                Daftarkan Band
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
