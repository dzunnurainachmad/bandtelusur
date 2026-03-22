'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { X, Send, Bot, Maximize2, Trash2, Sparkles } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { useAuth } from '@/contexts/AuthContext'
import type { UIMessage } from '@ai-sdk/react'
import type { Band } from '@/types'

const STORAGE_KEY = 'bt-minichat-history'

function loadMessages(): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function FloatingChat() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { track } = usePlayer()
  const [open, setOpen] = useState(false)
  const { messages, sendMessage, status, setMessages } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'
  const t = useTranslations('floatingChat')

  useEffect(() => {
    const stored = loadMessages()
    if (stored.length > 0) setMessages(stored)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  function handleClear() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  if (pathname === '/chat' || loading || !user) return null

  const bottomOffset = track ? 'bottom-20' : 'bottom-6'

  const suggestions = t.raw('suggestions') as string[]

  return (
    <div className={`hidden lg:block fixed ${bottomOffset} right-6 z-50 transition-[bottom] duration-200`}>
      {open && (
        <div className="absolute bottom-16 right-0 w-80 h-[480px] bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('title')}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title={t('clearHistory')}
                  className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <Link
                href="/chat"
                title={t('openFull')}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <Bot className="w-8 h-8 text-amber-600 mx-auto opacity-60" />
                <p className="text-xs text-stone-400">{t('emptyHint')}</p>
                <div className="flex flex-col gap-1.5 items-center">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs border border-stone-300 dark:border-stone-600 rounded-full px-3 py-1.5 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-1.5">
                {message.parts.map((part, i) => {
                  if (part.type === 'text' && part.text) {
                    return (
                      <div key={i} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                          <Bot className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-xs max-w-[82%] leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-amber-700 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                        }`}>
                          {part.text}
                        </div>
                      </div>
                    )
                  }

                  if ((part.type === 'tool-searchBands' || part.type === 'tool-semanticSearch') && part.state === 'output-available') {
                    const result = part.output as { bands?: Band[] }
                    if (!result?.bands?.length) return null
                    return (
                      <div key={i} className="ml-6 space-y-1.5">
                        {result.bands.slice(0, 3).map((band) => (
                          <Link
                            key={band.id}
                            href={`/bands/${band.id}`}
                            onClick={() => setOpen(false)}
                            className="block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">{band.name}</p>
                            {(band.city_name || band.province_name) && (
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {[band.city_name, band.province_name].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {Array.isArray(band.genres) && band.genres.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {band.genres.slice(0, 3).map((g) => (
                                  <span key={g.id} className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                    {g.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </Link>
                        ))}
                        {result.bands.length > 3 && (
                          <Link href="/chat" onClick={() => setOpen(false)} className="text-[10px] text-amber-600 hover:underline pl-1">
                            +{result.bands.length - 3} {t('moreResults').replace(`+{count} `, '')}
                          </Link>
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <Bot className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 pb-3 pt-2 shrink-0 border-t border-stone-200 dark:border-stone-700">
            <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                autoFocus
                className="flex-1 bg-transparent px-2 py-1 text-xs outline-none placeholder:text-stone-400 text-stone-900 dark:text-stone-100"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-amber-700 text-white p-1.5 rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        title={t('title')}
        className="w-12 h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>
    </div>
  )
}
