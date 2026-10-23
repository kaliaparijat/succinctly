import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import CardEditor from '@/components/cards/CardEditor'
import { createCard } from '@/app/actions/cards'

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

  it('renders an empty, editable question textarea; the answer face starts closed (click-to-edit)', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [question] = screen.getAllByRole('textbox')
    expect(question).toHaveValue('')
    expect(screen.queryAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByText('Write the answer…')).toBeInTheDocument()
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

describe('CardEditor — mobile card body (Screen 3 tokens)', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('shows a "Done" pill on the question face (starts editing) and "Draft" on the answer face (starts closed)', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    // Only Question starts editing — see the comment on its useMarkdownFace
    // call in CardEditor.tsx for why Answer must start closed, not editing.
    // The deck title still appears once, in the top bar label.
    expect(screen.getAllByRole('button', { name: /^done$/i })).toHaveLength(1)
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getAllByText(mockDeck.title)).toHaveLength(1)
  })

  it('shows "Draft" on the question face too once it stops editing', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [done] = screen.getAllByRole('button', { name: /^done$/i })
    fireEvent.click(done)
    expect(screen.getAllByText('Draft')).toHaveLength(2)
  })

  it('renders no error text by default', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.queryByText(/boom/i)).toBeNull()
  })

  it('shows the error message centered below the card when save fails', async () => {
    vi.mocked(createCard).mockRejectedValueOnce(new Error('Boom'))
    render(<CardEditor deck={mockDeck} cardNumber={1} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    })

    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('never renders an "Auto-saved" indicator', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.queryByText(/auto-saved/i)).toBeNull()
  })

  it('mobile card fills its stage height instead of a fixed/viewport-width-relative cap', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const card = screen.getByTestId('mobile-card')
    expect(card).toHaveClass('flex-1')
    expect(card.className).not.toMatch(/clamp/)
  })

  it('roots the page in a definite height (h-dvh), not min-h-screen — required for the flex-1 card to resolve at all (jsdom can\'t verify the actual layout resolution; see browser-qa for that)', () => {
    const { container } = render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(container.firstChild).toHaveClass('h-dvh')
    expect(container.firstChild).not.toHaveClass('min-h-screen')
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

describe('CardEditor — Markdown toolbar presence', () => {
  it('renders a formatting toolbar per face on desktop', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getAllByTitle(/bold/i)).toHaveLength(2)
    expect(screen.getAllByTitle(/italic/i)).toHaveLength(2)
  })

  it('renders a single formatting toolbar in the mobile bottom bar', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getAllByTitle(/bold/i)).toHaveLength(1)
  })
})

describe('CardEditor — form submission carries both faces regardless of editing state', () => {
  it('submits both question and reference_answer even though only one face is "front" when saving', async () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [questionTextarea] = screen.getAllByRole('textbox')
    fireEvent.change(questionTextarea, { target: { value: 'What is **Big-O**?' } })

    // Answer starts closed (click-to-edit) — open it before typing into it.
    fireEvent.mouseDown(screen.getByText('Write the answer…'))
    const [, answerTextarea] = screen.getAllByRole('textbox')
    fireEvent.change(answerTextarea, { target: { value: 'A growth-rate bound.' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save card/i }))
    })

    const submittedData = vi.mocked(createCard).mock.calls.at(-1)?.[0] as FormData
    expect(submittedData.get('question')).toBe('What is **Big-O**?')
    expect(submittedData.get('reference_answer')).toBe('A growth-rate bound.')
  })
})

describe('CardEditor — Tab inside a fenced code block does not flip', () => {
  it('inserts spaces and keeps the question face front when the caret is inside an open fence', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const [questionTextarea] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]

    fireEvent.change(questionTextarea, { target: { value: '```python\ndef f():\n' } })
    questionTextarea.selectionStart = questionTextarea.value.length
    questionTextarea.selectionEnd = questionTextarea.value.length

    fireEvent.keyDown(questionTextarea, { key: 'Tab' })

    expect(screen.getByTestId('flip-card')).toHaveStyle({ transform: 'rotateY(0deg)' })
    expect((screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).value).toBe('```python\ndef f():\n    ')
  })
})

describe('CardEditor — face padding matches the design (#18 follow-up)', () => {
  it('desktop: 26px 44px 74px on the editing textarea', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getByRole('textbox')).toHaveClass('pt-[26px]', 'px-[44px]', 'pb-[74px]')
  })

  it('mobile: 18px 20px 66px on the editing textarea', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<CardEditor deck={mockDeck} />)
    expect(screen.getByRole('textbox')).toHaveClass('pt-[18px]', 'px-5', 'pb-[66px]')
  })
})

describe('CardEditor — empty editing face starts the caret at the placeholder (#18 follow-up)', () => {
  // A centered textarea puts the caret in the middle of its centered placeholder; the
  // design's editing textarea (and placeholder) is left-aligned, so the caret sits before
  // the first placeholder character like any ordinary input.
  it.each([
    ['desktop', false],
    ['mobile', true],
  ])('%s: neither the textarea nor its placeholder is centered', (_label, mobile) => {
    mockUseIsMobile.mockReturnValue(mobile)
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).not.toHaveClass('text-center')
    expect(textarea).not.toHaveClass('placeholder:text-center')
  })
})

describe('CardEditor — editing textarea matches the design (#18 follow-up)', () => {
  // design_handoff_succinctly/card_editor_improvements/README.md, "Editing state (textarea)":
  // JetBrains Mono 14px desktop / 12.5px mobile, line-height 1.65, min-height 6em, placeholder 35%.
  it('desktop: mono 14px, line-height 1.65, min-height 6em, 35% placeholder', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('font-mono', 'text-[14px]', 'leading-[1.65]', 'min-h-[6em]', 'placeholder:opacity-[0.35]')
    expect(textarea).not.toHaveClass('font-display')
  })

  it('mobile: mono 12.5px, line-height 1.65, min-height 6em, 35% placeholder', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<CardEditor deck={mockDeck} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('font-mono', 'text-[12.5px]', 'leading-[1.65]', 'min-h-[6em]', 'placeholder:opacity-[0.35]')
    expect(textarea).not.toHaveClass('font-display')
  })

  it('the editing placeholder hints at the supported syntax', () => {
    render(<CardEditor deck={mockDeck} cardNumber={1} />)
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      "What's the question?   **bold**  `code`  $math$"
    )
  })
})
