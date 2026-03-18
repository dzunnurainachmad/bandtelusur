import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LogoBT } from '@/components/LogoBT'

describe('LogoBT', () => {
  it('renders an SVG element', () => {
    const { container } = render(<LogoBT />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<LogoBT className="w-10 h-10" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('w-10 h-10')
  })

  it('is hidden from accessibility tree', () => {
    const { container } = render(<LogoBT />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
