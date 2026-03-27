import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { BandCard } from '@/components/BandCard'
import type { Band } from '@/types'
import messages from '../../messages/en.json'

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock PlayerContext
vi.mock('@/contexts/PlayerContext', () => ({
  usePlayer: () => ({ play: vi.fn(), currentTrack: null }),
}))

function makeBand(overrides: Partial<Band> = {}): Band {
  return {
    id: 'test-1',
    name: 'Test Band',
    bio: null,
    formed_year: null,
    province_id: null,
    city_id: null,
    contact_wa: null,
    contact_email: null,
    instagram: null,
    youtube: null,
    spotify: null,
    youtube_music: null,
    apple_music: null,
    bandcamp: null,
    photo_url: null,
    is_looking_for_members: false,
    user_id: 'user-1',
    username: 'test-band',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  }
}

describe('BandCard', () => {
  it('renders band name', () => {
    renderWithIntl(<BandCard band={makeBand({ name: 'Burgerkill' })} />)
    expect(screen.getAllByText('Burgerkill').length).toBeGreaterThan(0)
  })

  it('renders location when province and city provided', () => {
    renderWithIntl(<BandCard band={makeBand({ city_name: 'Bandung', province_name: 'Jawa Barat' })} />)
    expect(screen.getByText('Bandung, Jawa Barat')).toBeInTheDocument()
  })

  it('renders only province when no city', () => {
    renderWithIntl(<BandCard band={makeBand({ province_name: 'DKI Jakarta' })} />)
    expect(screen.getAllByText('DKI Jakarta').length).toBeGreaterThan(0)
  })

  it('does not render location when neither provided', () => {
    renderWithIntl(<BandCard band={makeBand()} />)
    expect(screen.queryByText(/,/)).not.toBeInTheDocument()
  })

  it('renders bio when provided', () => {
    renderWithIntl(<BandCard band={makeBand({ bio: 'Band metal dari Bandung' })} />)
    expect(screen.getByText('Band metal dari Bandung')).toBeInTheDocument()
  })

  it('does not render bio when null', () => {
    renderWithIntl(<BandCard band={makeBand({ bio: null })} />)
    expect(screen.queryByText('Band metal dari Bandung')).not.toBeInTheDocument()
  })

  it('renders genre badges', () => {
    renderWithIntl(<BandCard band={makeBand({
      genres: [
        { id: 1, name: 'Metal', slug: 'metal' },
        { id: 2, name: 'Hardcore', slug: 'hardcore' },
      ],
    })} />)
    expect(screen.getAllByText('Metal').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hardcore').length).toBeGreaterThan(0)
  })

  it('shows +N when more than 4 genres', () => {
    renderWithIntl(<BandCard band={makeBand({
      genres: [
        { id: 1, name: 'Metal', slug: 'metal' },
        { id: 2, name: 'Rock', slug: 'rock' },
        { id: 3, name: 'Punk', slug: 'punk' },
        { id: 4, name: 'Grunge', slug: 'grunge' },
        { id: 5, name: 'Pop', slug: 'pop' },
      ],
    })} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('shows Open Member badge when looking for members', () => {
    renderWithIntl(<BandCard band={makeBand({ is_looking_for_members: true })} />)
    expect(screen.getByText('Open Member')).toBeInTheDocument()
  })

  it('renders Instagram link when provided', () => {
    renderWithIntl(<BandCard band={makeBand({ instagram: '@testband' })} />)
    const link = screen.getByText('Instagram')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://instagram.com/testband')
  })

  it('renders WhatsApp link when contact_wa provided', () => {
    renderWithIntl(<BandCard band={makeBand({ contact_wa: '628123456789' })} />)
    const link = screen.getByText('WhatsApp')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://wa.me/628123456789')
  })

  it('links band name to detail page using username', () => {
    renderWithIntl(<BandCard band={makeBand({ username: 'my-band' })} />)
    const link = screen.getAllByText('Test Band')[0].closest('a')
    expect(link).toHaveAttribute('href', '/bands/my-band')
  })

  it('falls back to id when no username', () => {
    renderWithIntl(<BandCard band={makeBand({ username: null as unknown as string, id: 'band-42' })} />)
    const link = screen.getAllByText('Test Band')[0].closest('a')
    expect(link).toHaveAttribute('href', '/bands/band-42')
  })
})
