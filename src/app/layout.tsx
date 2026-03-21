import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { MiniPlayer } from '@/components/MiniPlayer'
import { FloatingChat } from '@/components/FloatingChat'
import { MainContent } from '@/components/MainContent'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BandTelusur — Temukan Band Indonesia',
  description:
    'Platform untuk menemukan band dan project musik di seluruh Indonesia. Filter berdasarkan provinsi, kota, dan genre.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${geist.className} bg-[#faf6f0] dark:bg-[#1a1510] text-stone-900 dark:text-stone-100 antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <PlayerProvider>
              <Navbar />
              <MainContent>{children}</MainContent>
              <MiniPlayer />
              <FloatingChat />
            </PlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
