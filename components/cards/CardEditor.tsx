'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCard } from '@/app/actions/cards'
import { CreateBar } from '@/components/layout/TopBar'
import { PALETTES, PAPER_NOISE, type Palette } from '@/lib/palette'

interface Deck {
  id: string
  title: string
  palette: string
}

type Face = 'question' | 'answer'
type State = { error?: string } | null

export default function CardEditor({ deck, cardNumber }: { deck: Deck; cardNumber: number }) {
  const [face, setFace] = useState<Face>('question')
  const [saved, setSaved] = useState(false)
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const flipped = face === 'answer'

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (prev, formData) => {
      try {
        await createCard(formData)
        router.push(`/decks/${deck.id}`)
        return null
      } catch (e) {
        return { error: (e as Error).message }
      }
    },
    null
  )

  // Auto-focus question on mount
  useEffect(() => { questionRef.current?.focus() }, [])

  // Tab inside textarea flips the card
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const next: Face = face === 'question' ? 'answer' : 'question'
      setFace(next)
      setTimeout(() => {
        (next === 'question' ? questionRef : answerRef).current?.focus()
      }, 340)
    }
  }

  // Simulate auto-save feedback
  function handleChange() {
    setSaved(false)
    const t = setTimeout(() => setSaved(true), 800)
    return () => clearTimeout(t)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <CreateBar deckId={deck.id} deckName={deck.title} />

      {/* Formatting toolbar stub */}
      <div className="flex items-center justify-between px-7 h-10 border-b border-divider">
        <div className="flex items-center gap-1">
          {['B', 'I', '≡', '</>'].map(label => (
            <button
              key={label}
              type="button"
              className="px-2 py-1 rounded text-[12px] font-mono text-tertiary hover:text-secondary hover:bg-surface-hover transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.8px] text-tertiary">
          Tab to flip
        </span>
      </div>

      {/* Card stage */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ perspective: '1200px' }}>
        <form action={formAction} className="w-full max-w-full flex flex-col items-center gap-6">
          <input type="hidden" name="deck_id" value={deck.id} />

          {/* The flipping card */}
          <div
            className="relative w-full max-w-[700px]"
            style={{
              height: 'clamp(300px, 40vw, 460px)',
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Front — Question */}
            <div
              className="absolute inset-0 rounded-card overflow-hidden flex flex-col"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: bg,
                boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />
              <CardHeader label="Question" deckName={deck.title} ink={ink} saved={saved} />
              <textarea
                ref={questionRef}
                name="question"
                placeholder="What's the question?"
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                className="flex-1 w-full bg-transparent resize-none outline-none text-center px-10 pb-6 font-display leading-snug placeholder:opacity-30"
                style={{ color: ink, fontSize: 'clamp(20px, 3vw, 38px)', letterSpacing: '-0.5px' }}
              />
            </div>

            {/* Back — Answer */}
            <div
              className="absolute inset-0 rounded-card overflow-hidden flex flex-col"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: bg,
                boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />
              <CardHeader label="Answer" deckName={deck.title} ink={ink} saved={saved} />
              <textarea
                ref={answerRef}
                name="reference_answer"
                placeholder="Write the answer…"
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                className="flex-1 w-full bg-transparent resize-none outline-none text-center px-10 pb-6 font-display leading-snug placeholder:opacity-30"
                style={{ color: ink, fontSize: 'clamp(20px, 3vw, 38px)', letterSpacing: '-0.5px' }}
              />
            </div>
          </div>

          {/* Q / A segmented control */}
          <div className="flex items-center gap-1 px-1 py-1 rounded-pill bg-surface-card">
            {(['question', 'answer'] as Face[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFace(f)}
                className="px-4 py-1.5 rounded-pill text-[12px] font-mono uppercase tracking-[0.8px] transition-colors"
                style={{
                  background: face === f ? '#F5F5F7' : 'transparent',
                  color: face === f ? '#0A0A0B' : 'rgba(245,245,247,0.4)',
                }}
              >
                {f === 'question' ? 'Q' : 'A'}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between w-full max-w-[700px]">
            <span className="font-mono text-[11px] uppercase tracking-[0.8px] text-tertiary">
              Card #{cardNumber} · {deck.title}
            </span>
            <div className="flex items-center gap-3">
              {state?.error && <span className="text-red-400 text-xs font-sans">{state.error}</span>}
              <button
                type="button"
                onClick={() => router.push(`/decks/${deck.id}`)}
                className="px-4 py-2 rounded-btn text-sm font-sans text-secondary border border-divider hover:border-divider-strong hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-sans font-500 bg-primary text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save card
                <kbd className="font-mono text-[10px] px-1 py-0.5 rounded border border-divider-strong bg-surface-card text-tertiary">⌘↵</kbd>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function CardHeader({ label, deckName, ink, saved }: { label: string; deckName: string; ink: string; saved: boolean }) {
  return (
    <div className="relative flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${ink}20` }}>
      <span className="font-mono text-[10px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.5 }}>{label}</span>
      <span className="font-sans text-[11px]" style={{ color: ink, opacity: 0.4 }}>{deckName}</span>
      {saved && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.4 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> Auto-saved
        </span>
      )}
    </div>
  )
}
