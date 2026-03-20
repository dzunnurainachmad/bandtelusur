import { Suspense } from 'react'
import { LogoBT } from '@/components/LogoBT'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoBT className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Masuk ke BandTelusur</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Daftarkan dan kelola band kamu
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
