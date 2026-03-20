'use client'

import { usePlayer } from '@/contexts/PlayerContext'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { track } = usePlayer()

  return (
    <main className={track ? 'pb-16 sm:pb-20' : ''}>
      {children}
    </main>
  )
}
