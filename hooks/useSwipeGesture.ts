import { useRef, useCallback, useState } from 'react'

interface Options {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 60 }: Options) {
  const [dragX, setDragX] = useState(0)
  const startX = useRef<number | null>(null)

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
    }

    function onTouchMove(e: TouchEvent) {
      if (startX.current === null) return
      setDragX(e.touches[0].clientX - startX.current)
    }

    function onTouchEnd(e: TouchEvent) {
      if (startX.current === null) return
      const dx = e.changedTouches[0].clientX - startX.current
      // Reset before the commit callback fires, so it doesn't fight the slide-out animation
      setDragX(0)
      if (Math.abs(dx) >= threshold) {
        dx < 0 ? onSwipeLeft() : onSwipeRight()
      }
      startX.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { ref, dragX }
}
