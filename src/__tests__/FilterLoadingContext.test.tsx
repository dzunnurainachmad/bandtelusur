import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterLoadingProvider, useFilterLoading } from '@/components/FilterLoadingContext'

// Mock next/navigation
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function TestConsumer() {
  const { isPending, navigate } = useFilterLoading()
  return (
    <div>
      <span data-testid="pending">{isPending ? 'loading' : 'idle'}</span>
      <button onClick={() => navigate('/browse?genre=1')}>Filter</button>
    </div>
  )
}

describe('FilterLoadingContext', () => {
  it('provides isPending as false by default', () => {
    render(
      <FilterLoadingProvider>
        <TestConsumer />
      </FilterLoadingProvider>
    )
    expect(screen.getByTestId('pending')).toHaveTextContent('idle')
  })

  it('calls router.push when navigate is called', async () => {
    const user = userEvent.setup()
    render(
      <FilterLoadingProvider>
        <TestConsumer />
      </FilterLoadingProvider>
    )
    await user.click(screen.getByText('Filter'))
    expect(pushMock).toHaveBeenCalledWith('/browse?genre=1')
  })

  it('provides default values when used outside provider', () => {
    render(<TestConsumer />)
    expect(screen.getByTestId('pending')).toHaveTextContent('idle')
  })
})
