'use client'

import { usePlayer } from '@/contexts/PlayerContext'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { track } = usePlayer()

  return (
    <main className={`lg:ml-16 ${track ? 'pb-40 lg:pb-0' : 'pb-20 lg:pb-0'}`}>
      {children}
    </main>
  )
}
