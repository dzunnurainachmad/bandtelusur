'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  searchable?: boolean
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  label,
  searchable = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchable) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open, searchable])

  function handleSelect(val: string) {
    onChange(val === value ? '' : val)
    setOpen(false)
  }

  return (
    <div className="space-y-1">
      {label && (
        <span className="block text-xs font-medium text-stone-500">{label}</span>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-all',
            'focus:outline-none focus:ring-2 focus:ring-amber-500',
            open
              ? 'border-amber-500 ring-2 ring-amber-500 bg-[#fefaf4] dark:bg-stone-800'
              : 'border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-500',
            disabled && 'bg-stone-50 dark:bg-[#231d15] text-stone-400 cursor-not-allowed hover:border-stone-300 dark:hover:border-stone-600',
            !disabled && 'cursor-pointer'
          )}
        >
          <span className={clsx('truncate', selected ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={clsx('w-4 h-4 shrink-0 text-stone-400 dark:text-stone-500 transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-[#fefaf4] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
            {/* Search input */}
            {searchable && (
              <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-700 rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari..."
                    className="w-full bg-transparent text-sm text-stone-700 dark:text-stone-200 placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Clear / all option */}
            {!query && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                  !value
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-medium'
                    : 'text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700'
                )}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-4 h-4" />}
              </button>
            )}

            <div className={clsx('overflow-y-auto', searchable ? 'max-h-52' : 'max-h-56', !query && 'border-t border-stone-100 dark:border-stone-700')}>
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-center text-stone-400 dark:text-stone-500">Tidak ditemukan</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                      opt.value === value
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
