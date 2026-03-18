'use client'

import { createContext, useContext, useTransition, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface FilterLoadingContextValue {
  isPending: boolean
  navigate: (url: string) => void
}

const FilterLoadingContext = createContext<FilterLoadingContextValue>({
  isPending: false,
  navigate: () => {},
})

export function FilterLoadingProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url)
      })
    },
    [router, startTransition]
  )

  return (
    <FilterLoadingContext.Provider value={{ isPending, navigate }}>
      {children}
    </FilterLoadingContext.Provider>
  )
}

export function useFilterLoading() {
  return useContext(FilterLoadingContext)
}
