'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
      className="flex items-center w-full px-3 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-700 dark:hover:text-amber-500 transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100 group-hover/sidebar:ml-3 transition-all duration-200 text-sm leading-none">
        {isDark ? 'Mode Terang' : 'Mode Gelap'}
      </span>
    </button>
  )
}
