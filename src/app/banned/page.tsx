import { ShieldX } from 'lucide-react'

export default function BannedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <ShieldX className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">Akun Dinonaktifkan</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
          Akun kamu telah dinonaktifkan karena melanggar ketentuan penggunaan Bandly.
          Jika kamu merasa ini adalah kesalahan, hubungi admin.
        </p>
      </div>
    </div>
  )
}
