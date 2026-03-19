'use client'

import { experimental_useObject as useObject } from '@ai-sdk/react'
import { Sparkles, Loader2 } from 'lucide-react'
import { BandInsightsSchema } from '@/app/api/analyze-band/route'
import type { Band } from '@/types'

interface Props {
  band: Pick<Band, 'id' | 'name' | 'bio' | 'formed_year' | 'province_name' | 'city_name' | 'genres'>
}

export function BandInsights({ band }: Props) {
  const { object: insights, submit, isLoading, error, clear } = useObject({
    api: '/api/analyze-band',
    schema: BandInsightsSchema,
  })

  function analyze() {
    submit({
      name: band.name,
      bio: band.bio,
      genres: band.genres?.map((g) => g.name),
      province: band.province_name,
      city: band.city_name,
      formed_year: band.formed_year,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Insights
        </h2>
        {!insights && (
          <button
            onClick={analyze}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-sm border border-amber-400 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Analisis
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">Gagal menganalisis band</p>
      )}

      {(insights || isLoading) && (
        <div className="space-y-4 text-sm">
          {/* Style tags + Mood */}
          <div className="flex flex-wrap gap-2">
            {insights?.style_tags?.filter((tag): tag is string => !!tag).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {insights?.mood?.filter((m): m is string => !!m).map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full text-xs"
              >
                {m}
              </span>
            ))}
            {isLoading && !insights?.style_tags?.length && (
              <span className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-xs text-stone-400 animate-pulse">
                Menganalisis...
              </span>
            )}
          </div>

          {/* Target audience */}
          {insights?.target_audience && (
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-500 uppercase tracking-wide mb-1">Target Pendengar</p>
              <p className="text-stone-600 dark:text-stone-400">{insights.target_audience}</p>
            </div>
          )}

          {/* Strengths */}
          {insights?.strengths && insights.strengths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-500 uppercase tracking-wide mb-1">Kelebihan</p>
              <ul className="space-y-1">
                {insights.strengths.filter((s): s is string => !!s).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking pitch */}
          {insights?.booking_pitch && (
            <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wide mb-1">Booking Pitch</p>
              <p className="text-stone-700 dark:text-stone-300 italic">&ldquo;{insights.booking_pitch}&rdquo;</p>
            </div>
          )}

          {!isLoading && (
            <button
              onClick={clear}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}
