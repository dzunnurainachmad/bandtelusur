import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { MiniPlayer } from '@/components/MiniPlayer'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bandly — Temukan Band Indonesia',
  description:
    'Platform untuk menemukan band dan project musik di seluruh Indonesia. Filter berdasarkan provinsi, kota, dan genre.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geist.className} bg-[#faf6f0] dark:bg-[#1a1510] text-stone-900 dark:text-stone-100 antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <PlayerProvider>
              <Navbar />
              <main className="pb-24">{children}</main>
              <MiniPlayer />
            </PlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
