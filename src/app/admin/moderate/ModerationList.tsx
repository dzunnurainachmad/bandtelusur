'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ModerationVerdict } from '@/lib/schemas'
import { Button } from '@/components/ui/Button'

interface Flag {
  id: string
  band_id: string
  reason: string | null
  status: string
  created_at: string
  moderation_result: ModerationVerdict | null
  band: {
    name: string
    bio: string | null
    photo_url: string | null
    province_name: string | null
  }
}

export function ModerationList({ flags: initial }: { flags: Flag[] }) {
  const t = useTranslations('moderate')
  const [flags, setFlags] = useState<Flag[]>(initial)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  async function runModeration(flag: Flag) {
    setRunning((r) => ({ ...r, [flag.id]: true }))
    try {
      const res = await fetch('/api/agents/moderate-band', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ band_id: flag.band_id, flag_id: flag.id }),
      })
      if (res.ok) {
        const verdict = await res.json()
        setFlags((fs) => fs.map((f) => f.id === flag.id ? { ...f, moderation_result: verdict } : f))
        setExpanded((e) => ({ ...e, [flag.id]: true }))
      }
    } finally {
      setRunning((r) => ({ ...r, [flag.id]: false }))
    }
  }

  async function updateStatus(flag: Flag, status: 'approved' | 'rejected') {
    setUpdating((u) => ({ ...u, [flag.id]: true }))
    try {
      const res = await fetch('/api/flag-band', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag_id: flag.id, status }),
      })
      if (res.ok) {
        setFlags((fs) => fs.filter((f) => f.id !== flag.id))
      }
    } finally {
      setUpdating((u) => ({ ...u, [flag.id]: false }))
    }
  }

  if (flags.length === 0) {
    return (
      <p className="text-stone-500 dark:text-stone-400 text-sm py-8 text-center">
        {t('empty')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {flags.map((flag) => {
        const verdict = flag.moderation_result
        const isExpanded = expanded[flag.id]
        return (
          <div key={flag.id} className="bg-surface border border-stone-200 dark:border-stone-700 rounded-xl p-4 space-y-3">
            {/* Band info */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">{flag.band.name}</p>
                {flag.band.province_name && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">{flag.band.province_name}</p>
                )}
                {flag.reason && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {t('reason')} <span className="italic">{flag.reason}</span>
                  </p>
                )}
              </div>
              <span className="text-xs text-stone-400">{new Date(flag.created_at).toLocaleDateString('id-ID')}</span>
            </div>

            {/* Bio preview */}
            {flag.band.bio && (
              <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{flag.band.bio}</p>
            )}

            {/* Verdict */}
            {verdict && (
              <div className="space-y-2">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [flag.id]: !isExpanded }))}
                  className="flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t('aiResult')} <span className={
                    verdict.verdict === 'approve' ? 'text-green-600 dark:text-green-400' :
                    verdict.verdict === 'reject' ? 'text-red-600 dark:text-red-400' :
                    'text-amber-600 dark:text-amber-400'
                  }>{verdict.verdict.toUpperCase()}</span>
                  ({verdict.confidence})
                </button>
                {isExpanded && (
                  <div className="pl-4 space-y-2 text-xs text-stone-600 dark:text-stone-400 border-l-2 border-stone-200 dark:border-stone-700">
                    <p>{verdict.reasoning}</p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <span className={verdict.checks.bio_quality.ok ? 'text-green-600' : 'text-red-500'}>
                          {verdict.checks.bio_quality.ok ? '✓' : '✗'} {t('checkBio')}
                        </span>
                        <p className="text-stone-400">{verdict.checks.bio_quality.notes}</p>
                      </div>
                      <div>
                        <span className={verdict.checks.photo_appropriate.ok ? 'text-green-600' : 'text-red-500'}>
                          {verdict.checks.photo_appropriate.ok ? '✓' : '✗'} {t('checkPhoto')}
                        </span>
                        <p className="text-stone-400">{verdict.checks.photo_appropriate.notes}</p>
                      </div>
                      <div>
                        <span className={verdict.checks.duplicate_risk.ok ? 'text-green-600' : 'text-red-500'}>
                          {verdict.checks.duplicate_risk.ok ? '✓' : '✗'} {t('checkDuplicate')}
                        </span>
                        <p className="text-stone-400">{verdict.checks.duplicate_risk.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {!verdict && (
                <Button
                  size="sm"
                  onClick={() => runModeration(flag)}
                  loading={running[flag.id]}
                  className="text-xs"
                >
                  {running[flag.id] ? t('analyzing') : t('runAI')}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateStatus(flag, 'approved')}
                disabled={updating[flag.id]}
                className="text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <CheckCircle className="w-3.5 h-3.5" /> {t('approve')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateStatus(flag, 'rejected')}
                disabled={updating[flag.id]}
                className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <XCircle className="w-3.5 h-3.5" /> {t('reject')}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
