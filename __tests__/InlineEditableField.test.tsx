import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InlineEditableField from '@/components/ui/InlineEditableField'

describe('InlineEditableField', () => {
  it('autofocuses the input on mount', () => {
    render(<InlineEditableField onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('blur reverts and calls onCancel without submitting', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<InlineEditableField onConfirm={onConfirm} onCancel={onCancel} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New name' } })
    fireEvent.blur(screen.getByRole('textbox'))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('tapping confirm with a whitespace-only value is a no-op', async () => {
    const onConfirm = vi.fn()
    render(<InlineEditableField onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('tapping confirm with a valid value calls onConfirm with the trimmed value', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<InlineEditableField onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Biology  ' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Biology'))
  })

  it('preserves typed text and stays in edit state when onConfirm rejects', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('network error'))
    render(<InlineEditableField onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Chemistry' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
    expect(screen.getByRole('textbox')).toHaveValue('Chemistry')
  })

  it('pre-fills the input with an initial value', () => {
    render(<InlineEditableField initialValue="Existing deck" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('Existing deck')
  })

  it('clicking confirm does not blur/cancel first', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()
    render(<InlineEditableField onConfirm={onConfirm} onCancel={onCancel} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Physics' } })
    fireEvent.mouseDown(screen.getByRole('button', { name: /confirm/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Physics'))
    expect(onCancel).not.toHaveBeenCalled()
  })
})
