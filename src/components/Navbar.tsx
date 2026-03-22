'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LogOut, LayoutDashboard, LogIn, ShieldCheck, MessageSquare, Bookmark, Compass, Plus, Newspaper } from 'lucide-react'
import { LogoBT } from './LogoBT'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

// Label that slides + fades in when the sidebar group is hovered
function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-3 transition-all duration-200 text-sm leading-none">
      {children}
    </span>
  )
}

export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const t = useTranslations('nav')

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
    router.push('/')
    router.refresh()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? ''

  function navLinkClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return active
      ? 'flex items-center px-3 py-2.5 rounded-xl text-amber-700 dark:text-amber-500 font-semibold bg-amber-50 dark:bg-amber-900/20 transition-colors'
      : 'flex items-center px-3 py-2.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors'
  }

  function bottomTabClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return active
      ? 'flex flex-col items-center gap-0.5 flex-1 py-2 text-amber-700 dark:text-amber-500'
      : 'flex flex-col items-center gap-0.5 flex-1 py-2 text-stone-500 dark:text-stone-400'
  }

  return (
    <>
      {/* ── Desktop: Left sidebar (icon-only, expands on hover) ── */}
      <aside className="group/sidebar hidden lg:flex fixed left-0 top-0 h-full w-16 hover:w-60 flex-col bg-[#fefaf4] dark:bg-[#231d15] border-r border-stone-200 dark:border-stone-800 z-50 transition-[width] duration-200 overflow-hidden">

        {/* Logo */}
        <div className="px-3 pt-6 pb-2 shrink-0">
          <Link href="/" title="BandTelusur" className="flex items-center px-2 py-1.5 font-bold text-amber-700 hover:text-amber-800 transition-colors">
            <LogoBT className="w-7 h-7 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-2 transition-all duration-200 text-lg font-bold leading-none">
              BandTelusur
            </span>
          </Link>
        </div>

        {/* Nav items — centered vertically */}
        <nav className="flex-1 flex flex-col justify-center px-2 gap-2 overflow-hidden">
          <Link href="/browse" className={navLinkClass('/browse')} title={t('browse')}>
            <Compass className="w-5 h-5 shrink-0" />
            <NavLabel>{t('browse')}</NavLabel>
          </Link>
          <Link href="/chat" className={navLinkClass('/chat')} title={t('discover')}>
            <MessageSquare className="w-5 h-5 shrink-0" />
            <NavLabel>{t('discover')}</NavLabel>
          </Link>
          <Link href="/feed" className={navLinkClass('/feed')} title={t('feed')}>
            <Newspaper className="w-5 h-5 shrink-0" />
            <NavLabel>{t('feed')}</NavLabel>
          </Link>

          {!loading && user && (
            <>
              {isAdmin && (
                <Link href="/admin" className={navLinkClass('/admin')} title={t('admin')}>
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <NavLabel>{t('admin')}</NavLabel>
                </Link>
              )}
              <Link href="/dashboard" className={navLinkClass('/dashboard')} title={t('dashboard')}>
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <NavLabel>{t('dashboard')}</NavLabel>
              </Link>
              <Link href="/saved" className={navLinkClass('/saved')} title={t('saved')}>
                <Bookmark className="w-5 h-5 shrink-0" />
                <NavLabel>{t('saved')}</NavLabel>
              </Link>
            </>
          )}

          <Link
            href="/submit"
            title={t('submit')}
            className="flex items-center px-3 py-2.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 transition-colors font-medium mt-1"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-3 transition-all duration-200 text-sm font-medium leading-none">
              {t('submit')}
            </span>
          </Link>
        </nav>

        {/* Bottom: theme + user */}
        <div className="px-2 pb-4 pt-2 border-t border-stone-200 dark:border-stone-800 space-y-0.5 shrink-0">
          <ThemeToggle />

          {!loading && user && (
            <>
              <Link href="/settings" className={navLinkClass('/settings')} title={user.email}>
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-3 transition-all duration-200 text-sm truncate leading-none">
                  {user.email}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                title={t('signOut')}
                className="flex items-center w-full px-3 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <NavLabel>{t('signOut')}</NavLabel>
              </button>
            </>
          )}

          {!loading && !user && (
            <Link href="/login" className={navLinkClass('/login')} title={t('signIn')}>
              <LogIn className="w-5 h-5 shrink-0" />
              <NavLabel>{t('signIn')}</NavLabel>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile: Bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fefaf4]/95 dark:bg-[#231d15]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 safe-b">
        <div className="flex items-center h-16">
          <Link href="/browse" className={bottomTabClass('/browse')}>
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('browse')}</span>
          </Link>

          <Link href="/chat" className={bottomTabClass('/chat')}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Discover</span>
          </Link>

          <Link href="/submit" className="flex flex-col items-center gap-0.5 flex-1 py-2">
            <div className="w-8 h-8 rounded-xl bg-amber-700 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-medium text-amber-700">{t('submitShort')}</span>
          </Link>

          {loading ? (
            // Placeholder during auth load — same slot count as logged-out state
            <div className="flex flex-1 items-center justify-center opacity-0 pointer-events-none">
              <LogIn className="w-5 h-5" />
            </div>
          ) : user ? (
            <>
              <Link href="/saved" className={bottomTabClass('/saved')}>
                <Bookmark className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t('saved')}</span>
              </Link>
              <Link href="/dashboard" className={bottomTabClass('/dashboard')}>
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t('dashboard')}</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className={bottomTabClass('/login')}>
              <LogIn className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t('signIn')}</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
