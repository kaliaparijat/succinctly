import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CardEditor from '@/components/cards/CardEditor'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/app/actions/cards', () => ({
  createCard: vi.fn().mockResolvedValue(undefined),
  updateCard: vi.fn().mockResolvedValue(undefined),
}))

const mockDeck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }
const mockCard = { id: 'card-1', question: 'What is React?', reference_answer: 'A UI library' }

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

describe('CardEditor — edit mode', () => {
  it('shows "Save changes" on the submit button', () => {
    render(<CardEditor deck={mockDeck} card={mockCard} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('renders a hidden id field with the card id', () => {
    const { container } = render(<CardEditor deck={mockDeck} card={mockCard} />)
    const idInput = container.querySelector('input[name="id"]') as HTMLInputElement
    expect(idInput).not.toBeNull()
    expect(idInput.value).toBe(mockCard.id)
  })

  it('pre-populates textareas with the card content', () => {
    render(<CardEditor deck={mockDeck} card={mockCard} />)
    expect(screen.getByDisplayValue(mockCard.question)).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockCard.reference_answer)).toBeInTheDocument()
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
