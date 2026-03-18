import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsOverlay } from '@/components/ResultsOverlay'

// Mock the context
const mockUseFilterLoading = vi.fn()
vi.mock('@/components/FilterLoadingContext', () => ({
  useFilterLoading: () => mockUseFilterLoading(),
}))

describe('ResultsOverlay', () => {
  it('renders children normally when not pending', () => {
    mockUseFilterLoading.mockReturnValue({ isPending: false })
    render(
      <ResultsOverlay>
        <p>Band list</p>
      </ResultsOverlay>
    )
    expect(screen.getByText('Band list')).toBeInTheDocument()
    const wrapper = screen.getByText('Band list').parentElement
    expect(wrapper?.className).not.toContain('pointer-events-none')
  })

  it('applies opacity and pointer-events-none when pending', () => {
    mockUseFilterLoading.mockReturnValue({ isPending: true })
    render(
      <ResultsOverlay>
        <p>Band list</p>
      </ResultsOverlay>
    )
    expect(screen.getByText('Band list')).toBeInTheDocument()
    const wrapper = screen.getByText('Band list').parentElement
    expect(wrapper?.className).toContain('opacity-50')
    expect(wrapper?.className).toContain('pointer-events-none')
  })
})
