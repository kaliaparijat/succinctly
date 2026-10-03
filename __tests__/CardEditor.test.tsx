import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CardEditor from '@/components/cards/CardEditor'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/app/actions/cards', () => ({
  createCard: vi.fn().mockResolvedValue({ id: 'new-card-id', deck_id: 'deck-1' }),
}))

const mockDeck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }

beforeEach(() => mockPush.mockClear())

describe('CardEditor — create mode', () => {
  it('shows "Save card" on the submit button', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getByRole('button', { name: /save card/i })).toBeInTheDocument()
  })

  it('does not render a hidden id field', () => {
    const { container } = render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(container.querySelector('input[name="id"]')).toBeNull()
  })

  it('renders empty textareas', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [question, answer] = screen.getAllByRole('textbox')
    expect(question).toHaveValue('')
    expect(answer).toHaveValue('')
  })
})

describe('CardEditor — Tab to flip', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('moves focus to the answer textarea after Tab in the question textarea', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [questionTextarea] = screen.getAllByRole('textbox')

    fireEvent.keyDown(questionTextarea, { key: 'Tab' })
    vi.advanceTimersByTime(350)

    const [, answerTextarea] = screen.getAllByRole('textbox')
    expect(answerTextarea).toHaveFocus()
  })
})

describe('CardEditor — Cancel navigation', () => {
  it('navigates to the previous card when previousCardId is provided', () => {
    render(<CardEditor deck={mockDeck} cardNumber={2} previousCardId="card-0" />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/decks/deck-1/cards/card-0')
  })

  it('navigates to /library when previousCardId is null', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} previousCardId={null} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('navigates to /library when previousCardId is omitted', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/library')
  })
})

describe('CardEditor — Save navigation (create mode)', () => {
  it('navigates to the new card URL after successful save', async () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save card/i }))
    })

    expect(mockPush).toHaveBeenCalledWith('/decks/deck-1/cards/new-card-id')
  })
})

describe('CardEditor — flip duration', () => {
  it('defaults the flip transition duration to 380ms', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getByTestId('flip-card')).toHaveStyle({ transitionDuration: '380ms' })
  })

  it('uses the flipDuration prop when provided', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} flipDuration={570} />)
    expect(screen.getByTestId('flip-card')).toHaveStyle({ transitionDuration: '570ms' })
  })
})
