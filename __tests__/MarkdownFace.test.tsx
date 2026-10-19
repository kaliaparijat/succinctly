import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import MarkdownFace from '@/components/cards/markdown/MarkdownFace'
import { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'

function TestFace({
  initialText = '',
  initialEditing = false,
  name = 'question',
  onKeyDown,
}: {
  initialText?: string
  initialEditing?: boolean
  name?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  const face = useMarkdownFace({ initialText, initialEditing })
  return <MarkdownFace name={name} face={face} placeholder="What's the question?" onKeyDown={onKeyDown} />
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
