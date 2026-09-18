import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MobileDeckRow from '@/components/library/MobileDeckRow'

const mockPush = vi.fn()
const mockNavigateWithTransition = vi.fn()
const mockUpdateDeck = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: (...args: unknown[]) => mockNavigateWithTransition(...args),
}))

vi.mock('@/app/actions/decks', () => ({
  updateDeck: (...args: unknown[]) => mockUpdateDeck(...args),
}))

beforeEach(() => {
  mockPush.mockClear()
  mockNavigateWithTransition.mockClear()
  mockUpdateDeck.mockReset()
})

describe('MobileDeckRow — rename', () => {
  it('renders a pencil rename button (not quick-add-card), and tapping it swaps the title into a focused pre-filled input without navigating', () => {
    render(<MobileDeckRow id="deck-1" title="Algorithms" palette="butter" cardCount={3} />)
    expect(screen.getByRole('button', { name: /rename deck/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add card/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /rename deck/i }))

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Algorithms')
    expect(input).toHaveFocus()
    expect(mockNavigateWithTransition).not.toHaveBeenCalled()
  })

  it('confirming calls updateDeck with the id, trimmed title, and unchanged palette', async () => {
    mockUpdateDeck.mockResolvedValue(undefined)
    render(<MobileDeckRow id="deck-1" title="Algorithms" palette="butter" cardCount={3} />)

    fireEvent.click(screen.getByRole('button', { name: /rename deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Data Structures  ' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockUpdateDeck).toHaveBeenCalledOnce())
    const formData = mockUpdateDeck.mock.calls[0][1] as FormData
    expect(formData.get('id')).toBe('deck-1')
    expect(formData.get('title')).toBe('Data Structures')
    expect(formData.get('palette')).toBe('butter')
  })

  it('blur without confirming reverts and never calls updateDeck', () => {
    render(<MobileDeckRow id="deck-1" title="Algorithms" palette="butter" cardCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /rename deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Something else' } })
    fireEvent.blur(screen.getByRole('textbox'))

    expect(mockUpdateDeck).not.toHaveBeenCalled()
    expect(screen.getByText('Algorithms')).toBeInTheDocument()
  })

  it('empty/whitespace confirm is a no-op', () => {
    render(<MobileDeckRow id="deck-1" title="Algorithms" palette="butter" cardCount={3} />)
    fireEvent.click(screen.getByRole('button', { name: /rename deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(mockUpdateDeck).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('a rejected updateDeck keeps the row in edit state with the typed text intact', async () => {
    mockUpdateDeck.mockRejectedValue(new Error('update failed'))
    render(<MobileDeckRow id="deck-1" title="Algorithms" palette="butter" cardCount={3} />)

    fireEvent.click(screen.getByRole('button', { name: /rename deck/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Graph Theory' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockUpdateDeck).toHaveBeenCalledOnce())
    expect(screen.getByRole('textbox')).toHaveValue('Graph Theory')
  })
})
