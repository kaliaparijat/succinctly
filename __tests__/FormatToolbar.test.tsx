import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormatToolbar from '@/components/cards/markdown/FormatToolbar'

describe('FormatToolbar — buttons', () => {
  it('renders exactly 5 buttons: Bold, Italic, Code, Math, List — no Image', () => {
    render(<FormatToolbar onFmt={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    expect(screen.getByTitle(/bold/i)).toBeInTheDocument()
    expect(screen.getByTitle(/italic/i)).toBeInTheDocument()
    expect(screen.getByTitle(/code/i)).toBeInTheDocument()
    expect(screen.getByTitle(/math/i)).toBeInTheDocument()
    expect(screen.getByTitle(/list/i)).toBeInTheDocument()
    expect(screen.queryByTitle(/image/i)).toBeNull()
  })

  it('calls onFmt with the right kind for each button', () => {
    const onFmt = vi.fn()
    render(<FormatToolbar onFmt={onFmt} />)
    fireEvent.click(screen.getByTitle(/bold/i))
    fireEvent.click(screen.getByTitle(/italic/i))
    fireEvent.click(screen.getByTitle(/code/i))
    fireEvent.click(screen.getByTitle(/math/i))
    fireEvent.click(screen.getByTitle(/list/i))
    expect(onFmt.mock.calls.map((c) => c[0])).toEqual(['bold', 'italic', 'code', 'math', 'list'])
  })
})

describe('FormatToolbar — focus retention', () => {
  it('mousedown on a button preventDefaults so the textarea never loses focus', () => {
    render(
      <div>
        <textarea data-testid="ta" />
        <FormatToolbar onFmt={() => {}} />
      </div>
    )
    const textarea = screen.getByTestId('ta')
    textarea.focus()
    expect(document.activeElement).toBe(textarea)

    const event = fireEvent.mouseDown(screen.getByTitle(/bold/i))
    // fireEvent returns false when preventDefault() was called on a cancelable event.
    expect(event).toBe(false)
    expect(document.activeElement).toBe(textarea)
  })
})

describe('FormatToolbar — sizing', () => {
  it('applies the given size to each button', () => {
    render(<FormatToolbar onFmt={() => {}} size={38} />)
    const button = screen.getByTitle(/bold/i)
    expect(button).toHaveStyle({ width: '38px', height: '38px' })
  })

  it('defaults to a compact 26px size', () => {
    render(<FormatToolbar onFmt={() => {}} />)
    const button = screen.getByTitle(/bold/i)
    expect(button).toHaveStyle({ width: '26px', height: '26px' })
  })
})
