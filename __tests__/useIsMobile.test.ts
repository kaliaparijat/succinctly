import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/useIsMobile'

function mockMatchMedia(initialMatches: boolean) {
  let changeHandler: (() => void) | null = null
  let matches = initialMatches

  const mql = {
    get matches() { return matches },
    media: '(max-width: 767px)',
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'change') changeHandler = cb
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  window.matchMedia = vi.fn().mockReturnValue(mql)

  return {
    setMatches(next: boolean) {
      matches = next
      changeHandler?.()
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useIsMobile', () => {
  it('returns false when the media query does not match', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when the media query matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates when the media query change event fires', () => {
    const control = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => { control.setMatches(true) })
    expect(result.current).toBe(true)

    act(() => { control.setMatches(false) })
    expect(result.current).toBe(false)
  })
})
