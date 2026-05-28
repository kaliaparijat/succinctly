import { useEffect } from 'react'

interface Shortcuts {
  onFlip: () => void
  onNext: () => void
  onPrev: () => void
  onHelp: () => void
}

export function useKeyboardShortcuts({ onFlip, onNext, onPrev, onHelp }: Shortcuts) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

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
  }, [onFlip, onNext, onPrev, onHelp])
}
