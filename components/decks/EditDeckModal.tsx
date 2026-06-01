'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { updateDeck, deleteDeck } from '@/app/actions/decks'
import { PALETTES, type Palette } from '@/lib/palette'

const PALETTE_KEYS = Object.keys(PALETTES) as Palette[]

interface Props {
  deck: { id: string; title: string; palette: string }
  onClose: () => void
}

export default function EditDeckModal({ deck, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [, saveAction, saving] = useActionState<unknown, FormData>(
    async (_, formData) => {
      await updateDeck(_, formData)
      onClose()
    },
    null
  )

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleDelete() {
    await deleteDeck(deck.id)
    onClose()
  }

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
        {confirming ? (
          /* ── Delete confirmation ──────────────────────────────── */
          <>
            <h2 className="font-display text-[24px] text-primary mb-2" style={{ letterSpacing: '-0.5px' }}>
              Delete deck?
            </h2>
            <p className="text-sm font-sans text-secondary mb-8">
              "{deck.title}" and all its cards will be permanently removed. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 rounded-btn border border-divider text-secondary font-sans text-sm hover:border-divider-strong hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-btn font-sans font-500 text-sm transition-opacity hover:opacity-80"
                style={{ background: '#8B1A1A', color: '#FFB3B3' }}
              >
                Delete permanently
              </button>
            </div>
          </>
        ) : (
          /* ── Edit form ───────────────────────────────────────── */
          <>
            <h2 className="font-display text-[24px] text-primary mb-6" style={{ letterSpacing: '-0.5px' }}>
              Edit deck
            </h2>

            <form action={saveAction} className="flex flex-col gap-5">
              <input type="hidden" name="id" value={deck.id} />

              <input
                ref={inputRef}
                name="title"
                type="text"
                defaultValue={deck.title}
                required
                maxLength={80}
                className="w-full px-4 py-3 rounded-btn bg-surface-card text-primary font-sans text-sm outline-none border border-divider focus:border-divider-strong placeholder:text-tertiary transition-colors"
              />

              {/* Palette picker */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.8px] text-tertiary mb-3">Colour</p>
                <div className="grid grid-cols-4 gap-2">
                  {PALETTE_KEYS.map(key => (
                    <label key={key} className="cursor-pointer group">
                      <input
                        type="radio"
                        name="palette"
                        value={key}
                        defaultChecked={deck.palette === key}
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
                  disabled={saving}
                  className="flex-1 py-3 rounded-btn bg-primary text-surface font-sans font-500 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>

            {/* Destructive delete — separate from the save form */}
            <div className="mt-6 pt-5 border-t border-divider">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="text-[13px] font-sans transition-colors"
                style={{ color: 'rgba(255,100,100,0.6)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,100,100,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,100,100,0.6)')}
              >
                Delete deck…
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
