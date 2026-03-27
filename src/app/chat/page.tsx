'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Send, Bot, User, MessageSquare, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Band } from '@/types'
import type { UIMessage } from '@ai-sdk/react'

const STORAGE_KEY = 'bt-chat-history'

function loadMessages(): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function ChatPage() {
  const { messages, sendMessage, status, setMessages } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'
  const t = useTranslations('chat')

  useEffect(() => {
    const stored = loadMessages()
    if (stored.length > 0) setMessages(stored)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  function handleClear() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const suggestions = t.raw('suggestions') as string[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <MessageSquare className="w-10 h-10 text-amber-600 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('title')}</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('subtitle')}</p>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-0 top-0 flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('clearHistory')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-stone-400 dark:text-stone-500">
            <p className="text-sm">{t('tryAsk')}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="text-xs border border-stone-300 dark:border-stone-600 rounded-full px-3 py-1.5 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, i) => {
              if (part.type === 'text' && part.text) {
                return (
                  <div key={i} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <Bot className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-amber-700 text-white'
                          : 'bg-surface border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div className="text-sm prose prose-stone dark:prose-invert prose-sm max-w-none
                          prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2
                          prose-a:text-amber-700 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-stone-900 dark:prose-strong:text-stone-100
                          prose-code:bg-stone-100 dark:prose-code:bg-stone-800 prose-code:px-1 prose-code:rounded prose-code:text-xs">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <User className="w-6 h-6 text-stone-400 shrink-0 mt-1" />
                    )}
                  </div>
                )
              }

              if (part.type === 'tool-getBandDetail' && part.state === 'output-available') {
                const result = part.output as { band?: Band }
                const band = result?.band
                if (!band) return null
                return (
                  <div key={i} className="my-4 ml-9">
                    <Link
                      href={`/bands/${band.id}`}
                      className="block bg-surface border border-stone-200 dark:border-stone-700 rounded-xl p-4 hover:border-amber-500 transition-colors"
                    >
                      <p className="font-bold text-base text-stone-900 dark:text-stone-100">{band.name}</p>
                      {(band.city_name || band.province_name) && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {[band.city_name, band.province_name].filter(Boolean).join(', ')}
                          {band.formed_year ? ` · est. ${band.formed_year}` : ''}
                        </p>
                      )}
                      {Array.isArray(band.genres) && band.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {band.genres.map((g) => (
                            <span key={g.id} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {band.bio && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-3">{band.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-amber-700 dark:text-amber-400">
                        {band.instagram && <span>Instagram</span>}
                        {band.youtube && <span>YouTube</span>}
                        {band.spotify && <span>Spotify</span>}
                        {band.bandcamp && <span>Bandcamp</span>}
                        {band.contact_wa && <span>WhatsApp</span>}
                      </div>
                      {band.is_looking_for_members && (
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-2">{t('lookingForMembers')}</p>
                      )}
                    </Link>
                  </div>
                )
              }

              if ((part.type === 'tool-searchBands' || part.type === 'tool-semanticSearch') && part.state === 'output-available') {
                const result = part.output as { bands?: Band[] }
                if (result?.bands && result.bands.length > 0) {
                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 ml-9">
                      {result.bands.map((band) => (
                        <Link
                          key={band.id}
                          href={`/bands/${band.id}`}
                          className="block bg-surface border border-stone-200 dark:border-stone-700 rounded-xl p-3 hover:border-amber-500 transition-colors"
                        >
                          <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">{band.name}</p>
                          {(band.city_name || band.province_name) && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {[band.city_name, band.province_name].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {Array.isArray(band.genres) && band.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {band.genres.map((g) => (
                                <span key={g.id} className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {band.is_looking_for_members && (
                            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">{t('lookingForMembers')}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )
                }
              }

              return null
            })}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <Bot className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="sticky bottom-4">
        <div className="flex gap-2 bg-surface border border-stone-300 dark:border-stone-600 rounded-2xl p-2 shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-stone-400 text-stone-900 dark:text-stone-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-700 text-white p-2.5 rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
