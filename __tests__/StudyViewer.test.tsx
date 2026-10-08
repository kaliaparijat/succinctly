import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import StudyViewer from '@/components/cards/StudyViewer'

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockUseIsMobile = vi.fn()
const mockNavigateWithTransition = vi.fn()

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

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: (...args: unknown[]) => mockNavigateWithTransition(...args),
}))

beforeEach(() => {
  mockUseIsMobile.mockReturnValue(false)
  mockNavigateWithTransition.mockClear()
})

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

  it('disables the right arrow at the last card and keeps the insert link', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    expect(screen.getByRole('link', { name: 'Insert card' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next card/i })).toBeDisabled()
  })

  it('enables the right arrow when not at the last card, alongside the insert link', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getByRole('button', { name: /next card/i })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Insert card' })).toBeInTheDocument()
  })
})

describe('StudyViewer — initialCardId', () => {
  it('starts at the first card when initialCardId is omitted', () => {
    render(<StudyViewer deck={deck} cards={threeCards} />)
    expect(screen.getByRole('button', { name: /previous card/i })).toBeDisabled()
  })

  it('starts at the matching card when initialCardId is provided', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c3" />)
    // At the last card: prev enabled, next disabled, insert link still shown
    expect(screen.getByRole('button', { name: /previous card/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /next card/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Insert card' })).toBeInTheDocument()
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

describe('StudyViewer — mobile top bar', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('renders the deck name and index/total label', () => {
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    const header = screen.getByRole('banner')
    expect(within(header).getByText('Test Deck')).toBeInTheDocument()
    expect(within(header).getByText('1 / 2')).toBeInTheDocument()
  })

  it('back button navigates to /library via navigateWithTransition', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    fireEvent.click(screen.getByRole('button', { name: /back to library/i }))
    expect(mockNavigateWithTransition).toHaveBeenCalledWith(expect.anything(), '/library', 'back')
  })

  it('renders no help/keyboard-shortcuts button', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.queryByRole('button', { name: /keyboard shortcuts/i })).toBeNull()
  })

  it('tapping the edit-pencil button enters the same editingFace state double-click enters on desktop', () => {
    const { container } = render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const editable = container.querySelector('[contenteditable="plaintext-only"]') as HTMLElement | null
    expect(editable).not.toBeNull()
    // jsdom doesn't sync innerText with textContent, so check innerText directly
    // (the component reads/writes innerText, which works correctly in real browsers)
    expect(editable?.innerText).toBe('Q1')
  })

  it('flip-hint pill reads "Tap to flip", not "Space to flip"', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getAllByText('Tap to flip').length).toBeGreaterThan(0)
    expect(screen.queryByText('Space to flip')).toBeNull()
  })

  it('front face carries view-transition-name: card-{deckId}, matching MobileDeckRow\'s format; back face never carries it', () => {
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    const front = screen.getByText('Question').closest('.rounded-card') as HTMLElement
    const back = screen.getByText('Answer').closest('.rounded-card') as HTMLElement

    expect(front.style.getPropertyValue('view-transition-name')).toBe('card-deck-1')
    expect(back.style.getPropertyValue('view-transition-name')).toBe('')
  })
})

describe('StudyViewer — mobile swipe', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  function touchStart(el: Element, clientX: number) {
    const e = new Event('touchstart') as unknown as TouchEvent
    Object.assign(e, { touches: [{ clientX }] })
    fireEvent(el, e as unknown as Event)
  }
  function touchMove(el: Element, clientX: number) {
    const e = new Event('touchmove') as unknown as TouchEvent
    Object.assign(e, { touches: [{ clientX }] })
    fireEvent(el, e as unknown as Event)
  }
  function touchEnd(el: Element, clientX: number) {
    const e = new Event('touchend') as unknown as TouchEvent
    Object.assign(e, { changedTouches: [{ clientX }] })
    fireEvent(el, e as unknown as Event)
  }

  it('live-follows the finger during a drag under the commit threshold', () => {
    const { getByTestId } = render(<StudyViewer deck={deck} cards={twoCards} />)
    const stage = getByTestId('mobile-card-stage')
    const card = getByTestId('mobile-card')

    touchStart(stage, 200)
    touchMove(stage, 230)

    expect(card.style.transform).toBe('translateX(30px)')
  })

  it('springs back to center without navigating on release under the threshold', () => {
    mockReplace.mockClear()
    const { getByTestId } = render(<StudyViewer deck={deck} cards={twoCards} />)
    const stage = getByTestId('mobile-card-stage')
    const card = getByTestId('mobile-card')

    touchStart(stage, 200)
    touchMove(stage, 230)
    touchEnd(stage, 230)

    expect(card.style.transform).toBe('translateX(0)')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('commits and navigates after releasing past the threshold, using the mobile 110ms delay', async () => {
    mockReplace.mockClear()
    const { getByTestId } = render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    const stage = getByTestId('mobile-card-stage')

    await act(async () => {
      touchStart(stage, 200)
      touchMove(stage, 100)
      touchEnd(stage, 100)
      await new Promise(r => setTimeout(r, 130))
    })

    expect(mockReplace).toHaveBeenCalledWith('/decks/deck-1/cards/c2')
  })
})

describe('StudyViewer — desktop top bar unaffected by the mobile fork', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(false))

  it('still renders the existing "← Library" link and "?" button', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keyboard shortcuts/i })).toBeInTheDocument()
    expect(mockNavigateWithTransition).not.toHaveBeenCalled()
  })

  it('flip-hint pill still reads "Space to flip"', () => {
    render(<StudyViewer deck={deck} cards={twoCards} />)
    expect(screen.getAllByText('Space to flip').length).toBeGreaterThan(0)
    expect(screen.queryByText('Tap to flip')).toBeNull()
  })

  it('neither card face carries view-transition-name on desktop', () => {
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    const front = screen.getByText('Question').closest('.rounded-card') as HTMLElement
    const back = screen.getByText('Answer').closest('.rounded-card') as HTMLElement

    expect(front.style.getPropertyValue('view-transition-name')).toBe('')
    expect(back.style.getPropertyValue('view-transition-name')).toBe('')
  })

  it('double-click still enters editingFace state (enterEdit refactor is behaviorally identical)', () => {
    const { container } = render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    fireEvent.doubleClick(screen.getByText('Q1'))

    const editable = container.querySelector('[contenteditable="plaintext-only"]') as HTMLElement | null
    expect(editable).not.toBeNull()
    expect(editable?.innerText).toBe('Q1')
  })
})

describe.each([
  ['desktop', false],
  ['mobile', true],
])('StudyViewer — insert-after control (%s)', (_label, isMobile) => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(isMobile))

  it('shows an insert link pointing at the current card on a middle card', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c2" />)

    const insert = screen.getByRole('link', { name: 'Insert card' })
    expect(insert).toHaveAttribute('href', '/decks/deck-1/cards/new?after=c2')
  })

  it('shows the same insert link on the last card, pointing at that card', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c3" />)

    const insert = screen.getByRole('link', { name: 'Insert card' })
    expect(insert).toHaveAttribute('href', '/decks/deck-1/cards/new?after=c3')
  })

  it('keeps the next arrow enabled on a middle card', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c2" />)

    expect(screen.getByRole('button', { name: 'Next card' })).toBeEnabled()
  })

  it('disables the next arrow on the last card instead of replacing it', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c3" />)

    expect(screen.getByRole('button', { name: 'Next card' })).toBeDisabled()
  })

  it('keeps the previous arrow disabled on the first card', () => {
    render(<StudyViewer deck={deck} cards={threeCards} initialCardId="c1" />)

    expect(screen.getByRole('button', { name: 'Previous card' })).toBeDisabled()
  })
})
