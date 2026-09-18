import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MobileNewDeckRow from '@/components/library/MobileNewDeckRow'

const mockPush = vi.fn()
const mockNavigateWithTransition = vi.fn()
const mockCreateDeck = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: (...args: unknown[]) => mockNavigateWithTransition(...args),
}))

vi.mock('@/app/actions/decks', () => ({
  createDeck: (...args: unknown[]) => mockCreateDeck(...args),
}))

beforeEach(() => {
  mockPush.mockClear()
  mockNavigateWithTransition.mockClear()
  mockCreateDeck.mockReset()
})

describe('MobileNewDeckRow', () => {
  it('renders the dashed row and swaps to a focused input on tap', () => {
    render(<MobileNewDeckRow existingPalettes={[]} />)
    expect(screen.getByText('New deck')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /new deck/i }))

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('blur without confirming reverts and never calls createDeck', () => {
    render(<MobileNewDeckRow existingPalettes={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /new deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chemistry' } })
    fireEvent.blur(screen.getByRole('textbox'))

    expect(mockCreateDeck).not.toHaveBeenCalled()
    expect(screen.getByText('New deck')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('confirming creates the deck with the trimmed name and navigates into its new-card editor', async () => {
    mockCreateDeck.mockResolvedValue({ id: 'new-deck-id' })
    render(<MobileNewDeckRow existingPalettes={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /new deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Biology  ' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockCreateDeck).toHaveBeenCalledOnce())
    const formData = mockCreateDeck.mock.calls[0][0] as FormData
    expect(formData.get('title')).toBe('Biology')

    await waitFor(() =>
      expect(mockNavigateWithTransition).toHaveBeenCalledWith(
        expect.anything(),
        '/decks/new-deck-id/cards/new',
        'forward'
      )
    )
  })

  it('computes the next unused palette from the existing decks', async () => {
    mockCreateDeck.mockResolvedValue({ id: 'new-deck-id' })
    render(<MobileNewDeckRow existingPalettes={['butter', 'sky']} />)

    fireEvent.click(screen.getByRole('button', { name: /new deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Physics' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockCreateDeck).toHaveBeenCalledOnce())
    const formData = mockCreateDeck.mock.calls[0][0] as FormData
    expect(formData.get('palette')).toBe('coral')
  })

  it('a rejected createDeck keeps the row in edit state with the typed text intact', async () => {
    mockCreateDeck.mockRejectedValue(new Error('insert failed'))
    render(<MobileNewDeckRow existingPalettes={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /new deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Geology' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockCreateDeck).toHaveBeenCalledOnce())
    expect(screen.getByRole('textbox')).toHaveValue('Geology')
    expect(mockNavigateWithTransition).not.toHaveBeenCalled()
  })
})
