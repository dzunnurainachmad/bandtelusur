import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from '@/components/ui/MultiSelect'

const options = [
  { value: '1', label: 'Rock' },
  { value: '2', label: 'Metal' },
  { value: '3', label: 'Jazz' },
  { value: '4', label: 'Pop' },
]

describe('MultiSelect', () => {
  it('renders placeholder when no value selected', () => {
    render(<MultiSelect options={options} value={[]} onChange={() => {}} placeholder="Semua Genre" />)
    expect(screen.getByText('Semua Genre')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<MultiSelect options={options} value={[]} onChange={() => {}} label="Genre" />)
    expect(screen.getByText('Genre')).toBeInTheDocument()
  })

  it('shows count when values selected', () => {
    render(<MultiSelect options={options} value={['1', '2']} onChange={() => {}} />)
    expect(screen.getByText('2 genre dipilih')).toBeInTheDocument()
  })

  it('shows selected tags when closed', () => {
    render(<MultiSelect options={options} value={['1', '3']} onChange={() => {}} />)
    expect(screen.getByText('Rock')).toBeInTheDocument()
    expect(screen.getByText('Jazz')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Rock')).toBeInTheDocument()
    expect(screen.getByText('Metal')).toBeInTheDocument()
    expect(screen.getByText('Jazz')).toBeInTheDocument()
    expect(screen.getByText('Pop')).toBeInTheDocument()
  })

  it('calls onChange with added value when selecting', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={['1']} onChange={onChange} />)
    await user.click(screen.getByText('1 genre dipilih'))
    await user.click(screen.getByText('Metal'))
    expect(onChange).toHaveBeenCalledWith(['1', '2'])
  })

  it('calls onChange with removed value when deselecting', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={['1', '2']} onChange={onChange} />)
    await user.click(screen.getByText('2 genre dipilih'))
    await user.click(screen.getByText('Rock'))
    expect(onChange).toHaveBeenCalledWith(['2'])
  })

  it('filters options when searching', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    const searchInput = screen.getByPlaceholderText('Cari genre...')
    await user.type(searchInput, 'me')
    expect(screen.getByText('Metal')).toBeInTheDocument()
    expect(screen.queryByText('Rock')).not.toBeInTheDocument()
    expect(screen.queryByText('Jazz')).not.toBeInTheDocument()
  })

  it('shows empty state when search has no results', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={options} value={[]} onChange={() => {}} />)
    await user.click(screen.getByRole('button'))
    const searchInput = screen.getByPlaceholderText('Cari genre...')
    await user.type(searchInput, 'dangdut')
    expect(screen.getByText('Tidak ditemukan')).toBeInTheDocument()
  })
})
