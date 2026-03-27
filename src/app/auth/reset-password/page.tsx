'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Supabase embeds the token in the URL hash after redirect
    // onAuthStateChange fires PASSWORD_RECOVERY when the token is valid
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabaseBrowser.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Password Baru</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Masukkan password baru untuk akunmu
          </p>
        </div>

        <div className="bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl p-6">
          {!ready ? (
            <p className="text-sm text-center text-stone-400 py-4">Memverifikasi link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
