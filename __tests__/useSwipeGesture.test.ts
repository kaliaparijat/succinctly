import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

describe('useSwipeGesture', () => {
  it('tracks live dragX during a touchmove sequence', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight }))

    const el = document.createElement('div')
    act(() => { result.current.ref(el) })

    // touchstart/touchmove/touchend are attached via addEventListener with real TouchEvent
    // shapes read from the event object, so dispatch plain Events and monkey-patch properties.
    const start = new Event('touchstart') as unknown as TouchEvent
    Object.assign(start, { touches: [{ clientX: 100 }] })
    act(() => { el.dispatchEvent(start as unknown as Event) })

    const move = new Event('touchmove') as unknown as TouchEvent
    Object.assign(move, { touches: [{ clientX: 130 }] })
    act(() => { el.dispatchEvent(move as unknown as Event) })

    expect(result.current.dragX).toBe(30)
  })

  it('resets dragX to 0 and does not fire a callback under the threshold', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 60 }))

    const el = document.createElement('div')
    act(() => { result.current.ref(el) })

    const start = new Event('touchstart') as unknown as TouchEvent
    Object.assign(start, { touches: [{ clientX: 100 }] })
    act(() => { el.dispatchEvent(start as unknown as Event) })

    const move = new Event('touchmove') as unknown as TouchEvent
    Object.assign(move, { touches: [{ clientX: 120 }] })
    act(() => { el.dispatchEvent(move as unknown as Event) })
    expect(result.current.dragX).toBe(20)

    const end = new Event('touchend') as unknown as TouchEvent
    Object.assign(end, { changedTouches: [{ clientX: 120 }] })
    act(() => { el.dispatchEvent(end as unknown as Event) })

    expect(result.current.dragX).toBe(0)
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('fires onSwipeLeft and resets dragX when released past the threshold moving left', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 60 }))

    const el = document.createElement('div')
    act(() => { result.current.ref(el) })

    const start = new Event('touchstart') as unknown as TouchEvent
    Object.assign(start, { touches: [{ clientX: 200 }] })
    act(() => { el.dispatchEvent(start as unknown as Event) })

    const move = new Event('touchmove') as unknown as TouchEvent
    Object.assign(move, { touches: [{ clientX: 100 }] })
    act(() => { el.dispatchEvent(move as unknown as Event) })
    expect(result.current.dragX).toBe(-100)

    const end = new Event('touchend') as unknown as TouchEvent
    Object.assign(end, { changedTouches: [{ clientX: 100 }] })
    act(() => { el.dispatchEvent(end as unknown as Event) })

    expect(result.current.dragX).toBe(0)
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('fires onSwipeRight when released past the threshold moving right', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold: 60 }))

    const el = document.createElement('div')
    act(() => { result.current.ref(el) })

    const start = new Event('touchstart') as unknown as TouchEvent
    Object.assign(start, { touches: [{ clientX: 100 }] })
    act(() => { el.dispatchEvent(start as unknown as Event) })

    const end = new Event('touchend') as unknown as TouchEvent
    Object.assign(end, { changedTouches: [{ clientX: 200 }] })
    act(() => { el.dispatchEvent(end as unknown as Event) })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })
})
