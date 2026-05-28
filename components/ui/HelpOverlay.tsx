'use client'

import { useEffect } from 'react'

const SHORTCUTS = [
  { key: 'Space', label: 'Flip card' },
  { key: '← / →', label: 'Previous / next card' },
  { key: 'N', label: 'Add new card' },
  { key: 'Esc', label: 'Back to library' },
  { key: '?', label: 'Toggle this menu' },
]

export default function HelpOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === '?') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-surface-elev rounded-modal px-8 py-7"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.8px] text-tertiary mb-1">Cheatsheet</p>
            <h3 className="font-sans font-500 text-primary text-lg">Keyboard shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors text-xl leading-none mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col divide-y divide-divider">
          {SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <span className="font-sans text-sm text-secondary">{label}</span>
              <kbd className="font-mono text-[11px] px-2 py-1 rounded border border-divider-strong text-tertiary bg-surface-card">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
