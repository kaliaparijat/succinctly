import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import MarkdownFace from '@/components/cards/markdown/MarkdownFace'
import { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'

function TestFace({
  initialText = '',
  initialEditing = false,
  name = 'question',
  onKeyDown,
  textareaClassName,
  paddingClassName,
}: {
  initialText?: string
  initialEditing?: boolean
  name?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  textareaClassName?: string
  paddingClassName?: string
}) {
  const face = useMarkdownFace({ initialText, initialEditing })
  return (
    <MarkdownFace
      name={name}
      face={face}
      placeholder="What's the question?"
      onKeyDown={onKeyDown}
      textareaClassName={textareaClassName}
      paddingClassName={paddingClassName}
    />
  )
}

describe('MarkdownFace — render/edit toggle', () => {
  it('shows a textarea, no rendered content, when editing', () => {
    const { container } = render(<TestFace initialText="Hello" initialEditing />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    // '.rt' is MarkdownRenderer's text-block wrapper — its absence (rather
    // than a textContent-based query) distinguishes "not rendered" from the
    // textarea's own value, which testing-library's getByText would also
    // match against since React mounts a textarea's value as a text node.
    expect(container.querySelector('.rt')).toBeNull()
  })

  it('shows rendered Markdown content, no textarea, when not editing', () => {
    render(<TestFace initialText="Hello" initialEditing={false} />)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows the placeholder when not editing and empty', () => {
    render(<TestFace initialText="" initialEditing={false} />)
    expect(screen.getByText("What's the question?")).toBeInTheDocument()
  })
})

describe('MarkdownFace — always-present hidden input', () => {
  it('carries the current text in a hidden input while editing', () => {
    const { container } = render(<TestFace initialText="Hello" initialEditing name="question" />)
    const hidden = container.querySelector('input[type="hidden"][name="question"]') as HTMLInputElement
    expect(hidden).not.toBeNull()
    expect(hidden.value).toBe('Hello')
  })

  it('carries the current text in a hidden input while rendered (not editing)', () => {
    const { container } = render(<TestFace initialText="Hello" initialEditing={false} name="reference_answer" />)
    const hidden = container.querySelector('input[type="hidden"][name="reference_answer"]') as HTMLInputElement
    expect(hidden).not.toBeNull()
    expect(hidden.value).toBe('Hello')
  })

  it('updates the hidden input as the textarea is typed into', () => {
    const { container } = render(<TestFace initialText="" initialEditing name="question" />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'typed text' } })
    const hidden = container.querySelector('input[type="hidden"][name="question"]') as HTMLInputElement
    expect(hidden.value).toBe('typed text')
  })
})

describe('MarkdownFace — click to edit', () => {
  it('opens editing when the rendered view is clicked', () => {
    render(<TestFace initialText="Hello" initialEditing={false} />)
    fireEvent.mouseDown(screen.getByText('Hello'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})

describe('MarkdownFace — blur closes editing', () => {
  it('closes editing when focus moves outside the face', () => {
    render(
      <div>
        <TestFace initialText="Hello" initialEditing />
        <button>outside</button>
      </div>
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.blur(textarea, { relatedTarget: screen.getByText('outside') })
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})

describe('MarkdownFace — composed onKeyDown', () => {
  it('calls the outer onKeyDown after the face handles a key it does not consume', () => {
    const outer = vi.fn()
    render(<TestFace initialText="plain text" initialEditing onKeyDown={outer} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(outer).toHaveBeenCalled()
  })

  it('does not call the outer onKeyDown when the face stops propagation (Tab inside an open fence)', () => {
    const outer = vi.fn()
    render(<TestFace initialText={'```python\ncode'} initialEditing onKeyDown={outer} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length
    fireEvent.keyDown(textarea, { key: 'Tab' })
    expect(outer).not.toHaveBeenCalled()
  })
})

describe('MarkdownFace — textarea styling', () => {
  it('applies the caller-supplied textareaClassName to the editing textarea', () => {
    render(<TestFace initialText="" initialEditing textareaClassName="font-display text-[25px]" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea.className).toContain('font-display')
    expect(textarea.className).toContain('text-[25px]')
    // Base layout classes (fills the padded editing view) are still present alongside the caller's.
    expect(textarea.className).toContain('flex-1')
  })
})

describe('MarkdownFace — layout (the one jsdom can pin at the class level)', () => {
  it('the face root fills its positioned flex-item parent via absolute inset-0, not flex:1 on an unpositioned wrapper', () => {
    // Regression: an earlier version used style={position:'relative', flex:1}
    // on this root div. flex:1 only resolves against a `display:flex` parent —
    // the real parent here is a plain block div — so the root collapsed to
    // 0 height, and the textarea's `inset-0`/`h-full` (which resolve against
    // the *nearest positioned ancestor*, this root) then resolved against
    // that zero-height box. jsdom doesn't compute real layout, so this only
    // pins the class-level fix; see the plan's note that textarea auto-grow/
    // real layout resolution needs the Phase 6.2 live browser check.
    const { container } = render(<TestFace initialText="Hello" initialEditing />)
    const root = container.querySelector('[data-face]')
    expect(root).toHaveClass('absolute', 'inset-0')
  })
})

describe('MarkdownFace — padding lives on the face itself (#18 follow-up)', () => {
  // A parent's padding doesn't inset an absolutely-positioned child, so the face
  // must carry its own padding in both of its states.
  it('applies paddingClassName to the editing view (the textarea and the footer sit inside it)', () => {
    render(<TestFace initialText="Hello" initialEditing paddingClassName="px-[44px]" />)
    const padded = screen.getByRole('textbox').closest('.px-\\[44px\\]')
    expect(padded).not.toBeNull()
    expect(padded!.contains(screen.getByText('Markdown supported'))).toBe(true)
  })

  it('applies paddingClassName to the rendered view', () => {
    const { container } = render(<TestFace initialText="Hello" paddingClassName="px-[44px]" />)
    expect(container.querySelector('.rt')!.closest('.px-\\[44px\\]')).not.toBeNull()
  })
})

describe('MarkdownFace — "Markdown supported" footer', () => {
  it('shows the footer under the textarea while editing', () => {
    render(<TestFace initialText="Hello" initialEditing />)
    expect(screen.getByText('Markdown supported')).toBeInTheDocument()
  })

  it('does not show the footer when rendered', () => {
    render(<TestFace initialText="Hello" />)
    expect(screen.queryByText('Markdown supported')).toBeNull()
  })
})
