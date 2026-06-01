import { useEffect } from 'react'

interface Shortcuts {
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
  onHelp: () => void
  disabled?: boolean
}

export function useKeyboardShortcuts({ onFlip, onNext, onPrev, onHelp, disabled }: Shortcuts) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (disabled) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (target.isContentEditable) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onFlip()
          break
        case 'ArrowRight':
          onNext()
          break
        case 'ArrowLeft':
          onPrev()
          break
        case '?':
          onHelp()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFlip, onNext, onPrev, onHelp, disabled])
}
