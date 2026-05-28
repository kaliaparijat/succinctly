'use client'

import { useRef, useEffect, useActionState } from 'react'
import { createDeck } from '@/app/actions/decks'
import { PALETTES, type Palette } from '@/lib/palette'

const PALETTE_KEYS = Object.keys(PALETTES) as Palette[]

type State = { error?: string } | null

export default function NewDeckModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (prev, formData) => {
      await createDeck(formData)
      onClose()
      return null
    },
    null
  )

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-sm bg-surface-elev rounded-modal p-8"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
      >
        <h2 className="font-display text-[24px] text-primary mb-6" style={{ letterSpacing: '-0.5px' }}>
          New deck
        </h2>

        <form action={formAction} className="flex flex-col gap-5">
          <input
            ref={inputRef}
            name="title"
            type="text"
            placeholder="Deck name"
            required
            maxLength={80}
            className="w-full px-4 py-3 rounded-btn bg-surface-card text-primary font-sans text-sm outline-none border border-divider focus:border-divider-strong placeholder:text-tertiary transition-colors"
          />

          {/* Palette picker */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.8px] text-tertiary mb-3">Colour</p>
            <div className="grid grid-cols-4 gap-2">
              {PALETTE_KEYS.map((key, i) => (
                <label key={key} className="cursor-pointer group">
                  <input
                    type="radio"
                    name="palette"
                    value={key}
                    defaultChecked={i === 0}
                    className="sr-only peer"
                  />
                  <div
                    className="w-full aspect-square rounded-btn border-2 border-transparent peer-checked:border-primary transition-all group-hover:scale-105"
                    style={{ background: PALETTES[key].bg }}
                    title={PALETTES[key].label}
                  />
                </label>
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="text-[12px] font-sans text-red-400">{state.error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-btn border border-divider text-secondary font-sans text-sm hover:border-divider-strong hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-3 rounded-btn bg-primary text-surface font-sans font-500 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? 'Creating…' : 'Create deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
