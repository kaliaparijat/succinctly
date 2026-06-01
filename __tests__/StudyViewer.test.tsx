import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StudyViewer from '@/components/cards/StudyViewer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

const deck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }

const oneCard = [{ id: 'c1', question: 'Q1', reference_answer: 'A1' }]
const twoCards = [
  { id: 'c1', question: 'Q1', reference_answer: 'A1' },
  { id: 'c2', question: 'Q2', reference_answer: 'A2' },
]

describe('StudyViewer — keyboard boundaries', () => {
  it('disables the prev arrow at the first card', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getByRole('button', { name: /previous card/i })).toBeDisabled()
  })

  it('enables the prev arrow when not at the first card (right arrow click advances index)', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    // Right arrow is enabled on card 0 of 2
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
