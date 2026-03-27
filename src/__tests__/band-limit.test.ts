import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing queries
const mockCount = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: mockCount(), error: null }),
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/supabase-browser', () => ({
  supabaseBrowser: {
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
  },
}))

import { getActiveBandsCount } from '@/lib/queries'

describe('getActiveBandsCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 0 when user has no active bands', async () => {
    mockCount.mockReturnValue(0)
    const result = await getActiveBandsCount('user-123')
    expect(result).toBe(0)
  })

  it('returns 1 when user has one active band', async () => {
    mockCount.mockReturnValue(1)
    const result = await getActiveBandsCount('user-123')
    expect(result).toBe(1)
  })
})
