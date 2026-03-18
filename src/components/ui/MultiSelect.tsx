'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import clsx from 'clsx'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  label,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean)

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
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  function toggleOption(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  function removeTag(val: string) {
    onChange(value.filter((v) => v !== val))
  }

  return (
    <div className="space-y-1">
      {label && (
        <span className="block text-xs font-medium text-stone-500">{label}</span>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={clsx(
            'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border transition-all',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer',
            open
              ? 'border-amber-500 ring-2 ring-amber-500 bg-[#fefaf4] dark:bg-stone-800'
              : 'border-stone-300 dark:border-stone-600 bg-[#fefaf4] dark:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-500',
          )}
        >
          <span className={clsx('truncate', value.length > 0 ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500')}>
            {value.length > 0 ? `${value.length} genre dipilih` : placeholder}
          </span>
          <ChevronDown
            className={clsx('w-4 h-4 shrink-0 text-stone-400 dark:text-stone-500 transition-transform', open && 'rotate-180')}
          />
        </button>

        {/* Selected tags */}
        {value.length > 0 && !open && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedLabels.map((label, i) => (
              <span
                key={value[i]}
                className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs px-2 py-0.5 rounded-full"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTag(value[i]) }}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-[#fefaf4] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700">
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-700 rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari genre..."
                  className="w-full bg-transparent text-sm text-stone-700 dark:text-stone-200 placeholder-stone-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Clear all */}
            {!query && value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full flex items-center px-3 py-2 text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors border-b border-stone-100 dark:border-stone-700"
              >
                {placeholder}
              </button>
            )}

            <div className="overflow-y-auto max-h-52">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-center text-stone-400 dark:text-stone-500">Tidak ditemukan</p>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOption(opt.value)}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
