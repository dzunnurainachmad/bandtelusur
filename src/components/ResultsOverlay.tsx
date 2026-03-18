'use client'

import { useFilterLoading } from './FilterLoadingContext'

export function ResultsOverlay({ children }: { children: React.ReactNode }) {
  const { isPending } = useFilterLoading()

  return (
    <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
      {children}
    </div>
  )
}
