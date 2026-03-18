'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import { Send, Bot, User, MessageSquare } from 'lucide-react'
import type { Band } from '@/types'

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="text-center mb-8">
        <MessageSquare className="w-10 h-10 text-amber-600 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Discover Band</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Tanya apa aja soal band Indonesia
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-stone-400 dark:text-stone-500">
            <p className="text-sm">Coba tanya seperti:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {[
                'Band punk dari Jogja',
                'Cari band yang butuh drummer',
                'Band metal dari Bandung',
                'Ada band jazz di Jakarta?',
              ].map((q) => (
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
                          : 'bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{part.text}</p>
                    </div>
                    {message.role === 'user' && (
                      <User className="w-6 h-6 text-stone-400 shrink-0 mt-1" />
                    )}
                  </div>
                )
              }

              // Render band cards from tool results
              if ((part.type === 'tool-searchBands' || part.type === 'tool-semanticSearch') && part.state === 'output-available') {
                const result = part.output as { bands?: Band[] }
                if (result?.bands && result.bands.length > 0) {
                  return (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 ml-9">
                      {result.bands.map((band) => (
                        <Link
                          key={band.id}
                          href={`/bands/${band.id}`}
                          className="block bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-xl p-3 hover:border-amber-500 transition-colors"
                        >
                          <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                            {band.name}
                          </p>
                          {(band.city_name || band.province_name) && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              {[band.city_name, band.province_name].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {Array.isArray(band.genres) && band.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {band.genres.map((g) => (
                                <span
                                  key={g.id}
                                  className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {band.is_looking_for_members && (
                            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                              Mencari anggota baru
                            </p>
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
            <div className="bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5">
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
        <div className="flex gap-2 bg-[#fefaf4] dark:bg-[#231d15] border border-stone-300 dark:border-stone-600 rounded-2xl p-2 shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari band... misal: band metal dari Bandung"
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
