import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyViewer from '@/components/cards/StudyViewer'
import { updateCardInline } from '@/app/actions/cards'

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
  vi.mocked(updateCardInline).mockClear()
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
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Q1')
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

describe('StudyViewer — mobile card fills available height', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('does not cap the card to a fixed/viewport-width-relative height — it fills its flex-1 stage', () => {
    // This only confirms the style *declares* height:100% (a regression guard against
    // reintroducing the clamp) — jsdom does no real layout, so it can't confirm 100%
    // actually resolves against the viewport. That requires a definite-height ancestor
    // (see the h-dvh test below) and real browser layout (verified via browser-qa).
    const { getByTestId } = render(<StudyViewer deck={deck} cards={oneCard} />)
    const card = getByTestId('mobile-card')
    expect(card.style.height).toBe('100%')
  })

  it('roots the page in a definite height (h-dvh), not min-h-screen — required for the card\'s 100% height to resolve at all (jsdom can\'t verify the actual layout resolution; see browser-qa for that)', () => {
    const { container } = render(<StudyViewer deck={deck} cards={oneCard} />)
    expect(container.firstChild).toHaveClass('h-dvh')
    expect(container.firstChild).not.toHaveClass('min-h-screen')
  })
})

describe('StudyViewer — blur saves the inline edit (#15)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('blurring away from the card (not to the Q/A toggle) saves the edited text', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const editable = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.change(editable, { target: { value: 'Updated question' } })
    // userEvent.click replicates real browser focus handling: it fires blur on the
    // previously-focused element (with the correct relatedTarget) before the click
    // lands on the target — no manual event construction needed.
    await user.click(within(screen.getByRole('banner')).getByText('Test Deck'))

    await waitFor(() =>
      expect(updateCardInline).toHaveBeenCalledWith('c1', 'deck-1', 'Updated question', 'A1')
    )
  })

  it('blurring to the Q/A toggle does not short-circuit the toggle\'s own save-and-switch-face behavior', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const editable = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.change(editable, { target: { value: 'Updated question' } })
    const toggleToAnswer = screen.getByRole('button', { name: 'A' })

    await user.click(toggleToAnswer)

    await waitFor(() =>
      expect(updateCardInline).toHaveBeenCalledWith('c1', 'deck-1', 'Updated question', 'A1')
    )
    // Still editing — now the answer face, not exited. A naive "always save+exit on
    // blur" would have closed editingFace before the toggle's handler ran.
    expect(screen.getByRole('textbox', { name: 'Answer' })).toBeInTheDocument()
  })

  it('QAToggle prevents its default click-focus (#15 WebKit fix) — mousedown stays prevented regardless of what the click eventually re-focuses', () => {
    // The real bug (confirmed via browser-qa against real WebKit, not reproducible
    // in jsdom): WebKit doesn't focus <button> on click by default the way Chromium/
    // Firefox do, so handleEditBlur's relatedTarget-based "was this the toggle"
    // check silently fails there, and blur falls through to a full save+exit instead
    // of the toggle's own save+switch-face. The fix is QAToggle calling
    // preventDefault in onMouseDown so the click never triggers a focus-shift (and
    // therefore never triggers blur) in the first place — regardless of where the
    // toggle's own onClick logic subsequently moves focus to (the new face, via
    // StudyViewer's own re-focus effect). jsdom can't reproduce WebKit's divergent
    // default behavior to prove the bug or the fix end-to-end; this only confirms
    // the mechanism — that the mousedown is actually prevented — is in place. Real
    // verification is via browser-qa against real WebKit.
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const toggleToAnswer = screen.getByRole('button', { name: 'A' })
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    fireEvent(toggleToAnswer, event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('Escape-to-cancel followed by blur does not trigger a save', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const editable = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.change(editable, { target: { value: 'Should not save' } })
    fireEvent.keyDown(editable, { key: 'Escape' })
    fireEvent.blur(editable, { relatedTarget: null })

    expect(updateCardInline).not.toHaveBeenCalled()
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
    render(<StudyViewer deck={deck} cards={twoCards} initialCardId="c1" />)
    fireEvent.doubleClick(screen.getByText('Q1'))

    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Q1')
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

describe('StudyViewer — inline edit with empty faces (#21)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('clearing a face then toggling saves the empty face and moves editing to the other face', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    const editable = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.change(editable, { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'A' }))

    await waitFor(() =>
      expect(updateCardInline).toHaveBeenCalledWith('c1', 'deck-1', '', 'A1')
    )
    expect(screen.getByRole('textbox', { name: 'Answer' })).toBeInTheDocument()
  })

  const emptyAnswerCard = [{ id: 'c1', question: 'Q1', reference_answer: '' }]

  it('clearing the only filled face saves nothing, but the toggle still moves editing to the other face', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={emptyAnswerCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'A' }))

    expect(updateCardInline).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Answer' })).toBeInTheDocument()
  })

  it('blurring after clearing the only filled face saves nothing and shows the last saved text', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={emptyAnswerCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: '   ' } })
    await user.click(within(screen.getByRole('banner')).getByText('Test Deck'))

    expect(updateCardInline).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Question' })).not.toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
  })
})

describe('StudyViewer — saved text shows immediately (#21)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('shows the edited text right after blur, before the save or refresh completes', async () => {
    vi.mocked(updateCardInline).mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Updated question' } })
    await user.click(within(screen.getByRole('banner')).getByText('Test Deck'))

    expect(screen.getByText('Updated question')).toBeInTheDocument()
    expect(screen.queryByText('Q1')).not.toBeInTheDocument()
  })

  it('keeps an edited face when toggling to the other face and back', async () => {
    vi.mocked(updateCardInline).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Edited Q' } })
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'Q' }))

    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Edited Q')
  })

  it('saves the other face against the edited text, not the stale server text', async () => {
    vi.mocked(updateCardInline).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Edited Q' } })
    await user.click(screen.getByRole('button', { name: 'A' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Answer' }), { target: { value: 'Edited A' } })
    await user.click(within(screen.getByRole('banner')).getByText('Test Deck'))

    expect(updateCardInline).toHaveBeenLastCalledWith('c1', 'deck-1', 'Edited Q', 'Edited A')
  })
})

describe('StudyViewer — failed save rolls back (#21)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('restores the last saved text when updateCardInline rejects', async () => {
    vi.mocked(updateCardInline).mockRejectedValueOnce(new Error('boom'))
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Updated question' } })
    await user.click(within(screen.getByRole('banner')).getByText('Test Deck'))

    await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument())
    expect(screen.queryByText('Updated question')).not.toBeInTheDocument()
  })
})

describe('StudyViewer — renders Markdown on the card faces (#20)', () => {
  // One card exercising every format. Per-format rendering is covered by the markdown and
  // MarkdownRenderer tests; this only proves the viewer renders through the Markdown renderer.
  const markdownCard = [{
    id: 'c1',
    question: 'A **bold** and *italic* word with `inline`\n\n- item one\n- item two',
    reference_answer: '```python\nprint(1)\n```\n\n$$x^2$$',
  }]

  function expectMarkdownRendered(container: HTMLElement) {
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('code.ic')).toHaveTextContent('inline')
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(screen.getByText('python')).toBeInTheDocument()
    expect(container.querySelector('.hljs-built_in')).toHaveTextContent('print')
    expect(container.querySelector('.katex')).not.toBeNull()
    // None of the raw Markdown syntax is shown as text.
    for (const raw of ['**bold**', '*italic*', '`inline`', '- item one', '```', '$$']) {
      expect(container).not.toHaveTextContent(raw)
    }
  }

  it('desktop: bold, italic, inline code, list, fenced code and math render', () => {
    mockUseIsMobile.mockReturnValue(false)
    const { container } = render(<StudyViewer deck={deck} cards={markdownCard} />)
    expectMarkdownRendered(container)
  })

  it('mobile: bold, italic, inline code, list, fenced code and math render', () => {
    mockUseIsMobile.mockReturnValue(true)
    const { container } = render(<StudyViewer deck={deck} cards={markdownCard} />)
    expectMarkdownRendered(container)
  })
})

describe('StudyViewer — empty faces (#20)', () => {
  // createCard allows a card with one blank face, so the viewer must render it cleanly.
  const blankAnswer = [{ id: 'c1', question: 'Q1', reference_answer: '' }]
  const blankQuestion = [{ id: 'c1', question: '', reference_answer: 'A1' }]

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])('%s: a blank answer shows the answer placeholder', (_label, mobile) => {
    mockUseIsMobile.mockReturnValue(mobile)
    render(<StudyViewer deck={deck} cards={blankAnswer} />)
    expect(screen.getByText('Write the answer…')).toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
  })

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])("%s: a blank question shows the question placeholder", (_label, mobile) => {
    mockUseIsMobile.mockReturnValue(mobile)
    render(<StudyViewer deck={deck} cards={blankQuestion} />)
    expect(screen.getByText("What's the question?")).toBeInTheDocument()
  })

  it('a blank face can still be entered for editing (desktop double-click)', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(<StudyViewer deck={deck} cards={blankQuestion} />)
    fireEvent.doubleClick(screen.getByText("What's the question?"))
    expect(screen.getByRole('textbox', { name: 'Question' })).toBeInTheDocument()
  })

  it('a blank face can still be entered for editing (mobile Edit button)', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<StudyViewer deck={deck} cards={blankQuestion} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    expect(screen.getByRole('textbox', { name: 'Question' })).toBeInTheDocument()
  })
})

describe('StudyViewer — face layout (#20)', () => {
  // The face's text sits in a scroller that owns the design's padding (the bottom value clears the
  // Q/A toggle / flip hint), and the text block centers itself with my-auto: centered when short,
  // top-aligned and scrollable once it outgrows the card. jsdom can't measure layout, so the real
  // behavior is covered by the live check.
  it('desktop: 26px 44px 74px padding on the scroller, short text centered via my-auto', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(<StudyViewer deck={deck} cards={oneCard} />)
    const scroller = screen.getByText('Q1').closest('.overflow-y-auto') as HTMLElement
    expect(scroller).toHaveClass('pt-[26px]', 'px-[44px]', 'pb-[74px]')
    expect(scroller.firstElementChild).toHaveClass('my-auto')
  })

  it('mobile: 18px 20px 66px padding on the scroller, short text centered via my-auto', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<StudyViewer deck={deck} cards={oneCard} />)
    const scroller = screen.getByText('Q1').closest('.overflow-y-auto') as HTMLElement
    expect(scroller).toHaveClass('pt-[18px]', 'px-5', 'pb-[66px]')
    expect(scroller.firstElementChild).toHaveClass('my-auto')
  })
})

describe.each([
  ['desktop', false],
  ['mobile', true],
])('StudyViewer — Markdown textarea editing (#20, %s)', (_label, mobile) => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(mobile))

  function startEditing() {
    if (mobile) fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    else fireEvent.doubleClick(screen.getByText('Q1'))
  }

  it('edits in a plain textarea, not a contenteditable', () => {
    const { container } = render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    expect(screen.getByRole('textbox', { name: 'Question' }).tagName).toBe('TEXTAREA')
    expect(container.querySelector('[contenteditable]')).toBeNull()
  })

  it('puts the caret at the end of the text on entry', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    const textarea = screen.getByRole('textbox', { name: 'Question' }) as HTMLTextAreaElement
    expect(textarea.selectionStart).toBe(2)
    expect(textarea.selectionEnd).toBe(2)
  })

  it('seeds from the card each time, not from an earlier edit that was cancelled', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Thrown away' } })
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Question' }), { key: 'Escape' })
    startEditing()
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Q1')
  })

  it('⌘↵ saves and leaves edit mode', async () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    const textarea = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.change(textarea, { target: { value: 'Saved with a shortcut' } })
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await waitFor(() =>
      expect(updateCardInline).toHaveBeenCalledWith('c1', 'deck-1', 'Saved with a shortcut', 'A1')
    )
    expect(screen.queryByRole('textbox', { name: 'Question' })).not.toBeInTheDocument()
  })

  it('does not fire the flip shortcut while typing a space in the textarea', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    const textarea = screen.getByRole('textbox', { name: 'Question' })
    fireEvent.keyDown(textarea, { key: ' ' })
    expect(screen.getByRole('textbox', { name: 'Question' })).toBeInTheDocument()
  })
})

describe.each([
  ['desktop', false],
  ['mobile', true],
])('StudyViewer — formatting toolbar (#20, %s)', (_label, mobile) => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(mobile))

  function startEditing() {
    if (mobile) fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    else fireEvent.doubleClick(screen.getByText('Q1'))
  }

  it('is absent while viewing', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    expect(screen.queryByTitle('Bold ⌘B')).not.toBeInTheDocument()
  })

  it('shows once, in the editing face, while editing', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    expect(screen.getAllByTitle('Bold ⌘B')).toHaveLength(1)
    expect(screen.getByTitle('Math')).toBeInTheDocument()
  })

  it('formats the editing face\'s selection', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    const textarea = screen.getByRole('textbox', { name: 'Question' }) as HTMLTextAreaElement
    textarea.setSelectionRange(0, 2)
    fireEvent.click(screen.getByTitle('Bold ⌘B'))
    expect(textarea).toHaveValue('**Q1**')
  })

  it('formats the answer face after toggling to it', async () => {
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    await user.click(screen.getByRole('button', { name: 'A' }))
    const textarea = screen.getByRole('textbox', { name: 'Answer' }) as HTMLTextAreaElement
    textarea.setSelectionRange(0, 2)
    fireEvent.click(screen.getByTitle('Italic ⌘I'))
    expect(textarea).toHaveValue('*A1*')
  })

  it('disappears when editing ends', () => {
    render(<StudyViewer deck={deck} cards={oneCard} />)
    startEditing()
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Question' }), { key: 'Escape' })
    expect(screen.queryByTitle('Bold ⌘B')).not.toBeInTheDocument()
  })
})

describe('StudyViewer — mobile Done button (#20)', () => {
  it('is absent while viewing', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<StudyViewer deck={deck} cards={oneCard} />)
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })

  it('saves the edit and leaves edit mode when tapped', async () => {
    mockUseIsMobile.mockReturnValue(true)
    const user = userEvent.setup()
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Question' }), { target: { value: 'Done edit' } })
    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() =>
      expect(updateCardInline).toHaveBeenCalledWith('c1', 'deck-1', 'Done edit', 'A1')
    )
    expect(screen.queryByRole('textbox', { name: 'Question' })).not.toBeInTheDocument()
    expect(screen.getByText('Done edit')).toBeInTheDocument()
  })

  it('prevents the default mousedown so the textarea does not blur first', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    fireEvent(screen.getByRole('button', { name: 'Done' }), event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('is not shown on desktop', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(<StudyViewer deck={deck} cards={oneCard} />)
    fireEvent.doubleClick(screen.getByText('Q1'))
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })
})

describe.each([
  ['desktop', false],
  ['mobile', true],
])('StudyViewer — editing keyboard (#20, %s)', (_label, mobile) => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(mobile))

  function startEditing(cards = oneCard) {
    render(<StudyViewer deck={deck} cards={cards} />)
    if (mobile) fireEvent.click(screen.getByRole('button', { name: /edit card/i }))
    else fireEvent.doubleClick(screen.getByText('Q1'))
    return screen.getByRole('textbox', { name: 'Question' }) as HTMLTextAreaElement
  }

  function setValue(textarea: HTMLTextAreaElement, value: string) {
    fireEvent.change(textarea, { target: { value } })
    textarea.setSelectionRange(value.length, value.length)
  }

  it('⌘B bolds the selection', () => {
    const textarea = startEditing()
    textarea.setSelectionRange(0, 2)
    fireEvent.keyDown(textarea, { key: 'b', metaKey: true })
    expect(textarea).toHaveValue('**Q1**')
  })

  it('⌘I italicizes the selection', () => {
    const textarea = startEditing()
    textarea.setSelectionRange(0, 2)
    fireEvent.keyDown(textarea, { key: 'i', metaKey: true })
    expect(textarea).toHaveValue('*Q1*')
  })

  it('Enter at the end of a list item continues the list', () => {
    const textarea = startEditing()
    setValue(textarea, '- one')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(textarea).toHaveValue('- one\n- ')
  })

  it('Tab inside an open code fence inserts four spaces and does not move focus', () => {
    const textarea = startEditing()
    setValue(textarea, '```\nx')
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    fireEvent(textarea, event)
    expect(event.defaultPrevented).toBe(true)
    expect(textarea).toHaveValue('```\nx    ')
  })

  it('arrow keys and Space edit the text instead of navigating or flipping the card', async () => {
    mockReplace.mockClear()
    const textarea = startEditing(twoCards)
    fireEvent.keyDown(textarea, { key: 'ArrowRight' })
    fireEvent.keyDown(textarea, { key: ' ' })
    // Navigation commits after a short slide delay (110–140ms); wait it out.
    await act(() => new Promise(resolve => setTimeout(resolve, 200)))
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Q1')
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
