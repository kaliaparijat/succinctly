import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'

describe('useMarkdownFace — state', () => {
  it('starts with empty text and not editing by default', () => {
    const { result } = renderHook(() => useMarkdownFace())
    expect(result.current.text).toBe('')
    expect(result.current.editing).toBe(false)
  })

  it('starts with the given initial text and editing flag', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialText: 'Hello', initialEditing: true }))
    expect(result.current.text).toBe('Hello')
    expect(result.current.editing).toBe(true)
  })

  it('open() sets editing to true', () => {
    const { result } = renderHook(() => useMarkdownFace())
    act(() => result.current.open())
    expect(result.current.editing).toBe(true)
  })

  it('close() sets editing to false', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialEditing: true }))
    act(() => result.current.close())
    expect(result.current.editing).toBe(false)
  })

  it('preserves text across an open/close cycle', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialEditing: true }))
    act(() => result.current.setText('**bold** text'))
    act(() => result.current.close())
    expect(result.current.text).toBe('**bold** text')
    act(() => result.current.open())
    expect(result.current.text).toBe('**bold** text')
  })
})

describe('useMarkdownFace — fmt()', () => {
  it('applies bold using the textarea selection when editing', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialText: 'Hello world', initialEditing: true }))
    const ta = document.createElement('textarea')
    document.body.appendChild(ta)
    ta.value = 'Hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    act(() => { result.current.textareaRef.current = ta })

    act(() => result.current.fmt('bold'))

    expect(result.current.text).toBe('Hello **world**')
    document.body.removeChild(ta)
  })

  it('restores focus and selection on the textarea after fmt()', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialText: 'Hello world', initialEditing: true }))
    const ta = document.createElement('textarea')
    document.body.appendChild(ta)
    ta.value = 'Hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    const setSelectionRange = vi.spyOn(ta, 'setSelectionRange')
    act(() => { result.current.textareaRef.current = ta })

    act(() => result.current.fmt('bold'))

    // The real <textarea>'s value updates to the new text as part of the
    // same render that commits this ref (MarkdownFace binds value={text}),
    // so setSelectionRange's args — not jsdom's post-hoc clamped read-back
    // against this test's detached, not-re-valued element — are the
    // meaningful assertion here.
    expect(document.activeElement).toBe(ta)
    expect(setSelectionRange).toHaveBeenCalledWith(8, 13)
    document.body.removeChild(ta)
  })

  it('falls back to appending at the end when not editing (no selection to read)', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialText: 'Hello', initialEditing: false }))
    act(() => result.current.fmt('bold'))
    expect(result.current.text).toBe('Hello****')
  })

  it('switches a non-editing face into editing mode', () => {
    const { result } = renderHook(() => useMarkdownFace({ initialText: 'Hello', initialEditing: false }))
    act(() => result.current.fmt('italic'))
    expect(result.current.editing).toBe(true)
  })
})
