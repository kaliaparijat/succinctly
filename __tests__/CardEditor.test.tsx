import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CardEditor from '@/components/cards/CardEditor'

const mockPush = vi.fn()
const mockNavigateWithTransition = vi.fn()
const mockUseIsMobile = vi.fn()

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

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: (...args: unknown[]) => mockNavigateWithTransition(...args),
}))

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const mockDeck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }

beforeEach(() => {
  mockPush.mockClear()
  mockNavigateWithTransition.mockClear()
  mockUseIsMobile.mockReturnValue(false)
})

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
  it('navigates to the new card URL via navigateWithTransition, forward', async () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save card/i }))
    })

    expect(mockNavigateWithTransition).toHaveBeenCalledWith(
      expect.anything(),
      '/decks/deck-1/cards/new-card-id',
      'forward'
    )
  })
})

describe('CardEditor — mobile skeleton', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('renders a Save pill in the mobile top bar that submits the form', async () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    })

    expect(mockNavigateWithTransition).toHaveBeenCalledWith(
      expect.anything(),
      '/decks/deck-1/cards/new-card-id',
      'forward'
    )
  })

  it('does not render the desktop footer Save/Cancel buttons', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.queryByRole('button', { name: /save card/i })).toBeNull()
  })

  it('back-chevron navigates to the previous card when previousCardId is provided', () => {
    render(<CardEditor deck={mockDeck} cardNumber={2} previousCardId="card-0" />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/decks/deck-1/cards/card-0')
  })

  it('back-chevron navigates to /library when previousCardId is omitted', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('retains Tab-to-flip on the mobile textareas', () => {
    vi.useFakeTimers()
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [questionTextarea] = screen.getAllByRole('textbox')

    fireEvent.keyDown(questionTextarea, { key: 'Tab' })
    vi.advanceTimersByTime(350)

    const [, answerTextarea] = screen.getAllByRole('textbox')
    expect(answerTextarea).toHaveFocus()
    vi.useRealTimers()
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
