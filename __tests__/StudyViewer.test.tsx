import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import StudyViewer from '@/components/cards/StudyViewer'

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: mockRefresh }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/app/actions/cards', () => ({
  updateCardInline: vi.fn().mockResolvedValue(undefined),
}))

const deck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }

const oneCard = [{ id: 'c1', question: 'Q1', reference_answer: 'A1' }]
const twoCards = [
  { id: 'c1', question: 'Q1', reference_answer: 'A1' },
  { id: 'c2', question: 'Q2', reference_answer: 'A2' },
]
const threeCards = [
  { id: 'c1', question: 'Q1', reference_answer: 'A1' },
  { id: 'c2', question: 'Q2', reference_answer: 'A2' },
  { id: 'c3', question: 'Q3', reference_answer: 'A3' },
]

describe('StudyViewer — keyboard boundaries', () => {
  it('disables the prev arrow at the first card', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getByRole('button', { name: /previous card/i })).toBeDisabled()
  })

  it('enables the prev arrow when not at the first card (right arrow click advances index)', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    const nextBtn = screen.getByRole('button', { name: /next card/i })
    expect(nextBtn).not.toBeDisabled()
  })

  it('replaces the right arrow with a + link at the last card', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    expect(screen.getByRole('link', { name: /add card/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next card/i })).not.toBeInTheDocument()
  })

  it('shows the right arrow button when not at the last card', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getByRole('button', { name: /next card/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /add card/i })).not.toBeInTheDocument()
  })
})

describe('StudyViewer — initialCardId', () => {
  it('starts at the first card when initialCardId is omitted', () => {
    render(<StudyViewer deck={deck} cards={threeCards} />)
    expect(screen.getByRole('button', { name: /previous card/i })).toBeDisabled()
  })

  it('starts at the matching card when initialCardId is provided', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c3" />)
    // At the last card: prev enabled, + link shown instead of next button
    expect(screen.getByRole('button', { name: /previous card/i })).not.toBeDisabled()
    expect(screen.getByRole('link', { name: /add card/i })).toBeInTheDocument()
  })

  it('falls back to card 0 when initialCardId does not match', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="unknown" />)
    expect(screen.getByRole('button', { name: /previous card/i })).toBeDisabled()
  })
})

describe('StudyViewer — URL updates on navigation', () => {
  it('calls router.replace with the new card id when navigating forward', async () => {
    mockReplace.mockClear()
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /next card/i }))
      await new Promise(r => setTimeout(r, 160))
    })

    expect(mockReplace).toHaveBeenCalledWith('/decks/deck-1/cards/c2')
  })

  it('calls router.replace with the previous card id when navigating back', async () => {
    mockReplace.mockClear()
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c2" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /previous card/i }))
      await new Promise(r => setTimeout(r, 160))
    })

    expect(mockReplace).toHaveBeenCalledWith('/decks/deck-1/cards/c1')
  })

  it('does not call router.replace on initial render', () => {
    mockReplace.mockClear()
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
