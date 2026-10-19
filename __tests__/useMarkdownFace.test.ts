import { describe, it, expect } from 'vitest'
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
