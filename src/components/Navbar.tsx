'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, LayoutDashboard, LogIn, ShieldCheck, Menu, X, MessageSquare, Settings, Bookmark } from 'lucide-react'
import { LogoBT } from './LogoBT'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  function navLinkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return active
      ? 'px-3 py-2 text-amber-700 dark:text-amber-500 font-medium transition-colors relative after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-amber-700 dark:after:bg-amber-500 after:rounded-full'
      : 'px-3 py-2 text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-500 transition-colors'
  }

  function mobileNavLinkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return active
      ? 'flex items-center gap-2.5 px-3 py-3 text-sm text-amber-700 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 rounded-lg transition-colors'
      : 'flex items-center gap-2.5 px-3 py-3 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors'
  }

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
    <nav className="bg-[#fefaf4]/95 dark:bg-[#231d15]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-amber-700 text-lg">
            <LogoBT className="w-7 h-7" />
            BandTelusur
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/browse" className={navLinkClass('/browse')}>
              Jelajahi
            </Link>
            <Link href="/chat" className={`flex items-center gap-1.5 ${navLinkClass('/chat')}`}>
              <MessageSquare className="w-4 h-4" />
              Discover AI
            </Link>

            {!loading && (
              user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" className={`flex items-center gap-1.5 ${navLinkClass('/admin')}`}>
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link href="/dashboard" className={`flex items-center gap-1.5 ${navLinkClass('/dashboard')}`}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/saved" className={`flex items-center gap-1.5 ${navLinkClass('/saved')}`}>
                    <Bookmark className="w-4 h-4" />
                    Tersimpan
                  </Link>
                  <Link href="/submit" className="bg-amber-700 text-white px-4 py-1.5 rounded-lg hover:bg-amber-800 transition-colors">
                    Daftarkan Band
                  </Link>
                  <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-700">
                    <Link href="/settings" title="Profil" className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-amber-400 transition-all">
                      {initials}
                    </Link>
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
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" className="p-2.5 -mr-1 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden border-t border-stone-200 dark:border-stone-800 bg-[#fefaf4]/95 dark:bg-[#231d15]/95 backdrop-blur-md px-4 overflow-y-auto overscroll-contain transition-all duration-200 ease-out ${
          menuOpen ? 'max-h-[calc(100dvh-3.5rem)] py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
        }`}
      >
        <div className="space-y-0.5">
          <Link href="/browse" className={mobileNavLinkClass('/browse')}>
            Jelajahi
          </Link>
          <Link href="/chat" className={mobileNavLinkClass('/chat')}>
            <MessageSquare className="w-4 h-4" />
            Discover AI
          </Link>

          {!loading && user && (
            <>
              {isAdmin && (
                <Link href="/admin" className={mobileNavLinkClass('/admin')}>
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className={mobileNavLinkClass('/dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/saved" className={mobileNavLinkClass('/saved')}>
                <Bookmark className="w-4 h-4" />
                Tersimpan
              </Link>
              <Link href="/submit" className="flex items-center justify-center gap-2 px-3 py-3 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium">
                Daftarkan Band
              </Link>
              <Link href="/settings" className={mobileNavLinkClass('/settings')}>
                <Settings className="w-4 h-4" />
                Edit Profil
              </Link>
              <div className="flex items-center justify-between px-3 py-3 border-t border-stone-200 dark:border-stone-700 mt-2 pt-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm text-stone-500 dark:text-stone-400 truncate">{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors shrink-0 ml-3 py-1">
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className={mobileNavLinkClass('/login')}>
                <LogIn className="w-4 h-4" />
                Masuk
              </Link>
              <Link href="/submit" className="flex items-center justify-center gap-2 px-3 py-3 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium">
                Daftarkan Band
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
