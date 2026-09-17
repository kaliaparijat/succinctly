import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LibraryScreen from '@/components/library/LibraryScreen'

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

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: (...args: unknown[]) => mockNavigateWithTransition(...args),
}))

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock('@/app/actions/decks', () => ({
  createDeck: vi.fn(),
  updateDeck: vi.fn(),
  deleteDeck: vi.fn(),
}))

vi.mock('@/app/actions/auth', () => ({
  signOut: vi.fn(),
}))

const mockDecks = [
  { id: 'deck-1', title: 'Algorithms', palette: 'butter' },
  { id: 'deck-2', title: 'Linear Algebra', palette: 'sky' },
]
const mockCardCounts = [3, 1]

beforeEach(() => {
  mockPush.mockClear()
  mockNavigateWithTransition.mockClear()
})

describe('LibraryScreen — mobile (useIsMobile true)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('renders a flat row list instead of the desktop grid', () => {
    const { container } = render(
      <LibraryScreen decks={mockDecks} cardCounts={mockCardCounts} userName="Ada" greeting="Good evening." />
    )
    expect(container.querySelector('.grid')).toBeNull()
    expect(screen.getByText('Algorithms')).toBeInTheDocument()
    expect(screen.getByText('Linear Algebra')).toBeInTheDocument()
  })

  it('gives each row a view-transition-name keyed by deck id', () => {
    render(
      <LibraryScreen decks={mockDecks} cardCounts={mockCardCounts} userName="Ada" greeting="Good evening." />
    )
    const row = screen.getByText('Algorithms').closest('button')
    expect(row?.getAttribute('style')).toContain('view-transition-name: card-deck-1')
  })

  it('tapping a row navigates via navigateWithTransition to the deck route', () => {
    render(
      <LibraryScreen decks={mockDecks} cardCounts={mockCardCounts} userName="Ada" greeting="Good evening." />
    )
    fireEvent.click(screen.getByText('Algorithms'))
    expect(mockNavigateWithTransition).toHaveBeenCalledWith(
      expect.anything(),
      '/decks/deck-1',
      'forward'
    )
  })
})

describe('LibraryScreen — desktop (useIsMobile false)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(false))

  it('still renders the existing desktop grid with DeckThumb', () => {
    const { container } = render(
      <LibraryScreen decks={mockDecks} cardCounts={mockCardCounts} userName="Ada" greeting="Good evening." />
    )
    expect(container.querySelector('.grid')).not.toBeNull()
    expect(screen.getByText('Algorithms')).toBeInTheDocument()
  })

  it('deck navigation is a plain Link, not navigateWithTransition', () => {
    render(
      <LibraryScreen decks={mockDecks} cardCounts={mockCardCounts} userName="Ada" greeting="Good evening." />
    )
    const link = screen.getByText('Algorithms').closest('a')
    expect(link).toHaveAttribute('href', '/decks/deck-1')
    expect(mockNavigateWithTransition).not.toHaveBeenCalled()
  })
})
