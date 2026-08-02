'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCard, updateCard } from '@/app/actions/cards'
import { CreateBar } from '@/components/layout/TopBar'
import { PALETTES, PAPER_NOISE, type Palette } from '@/lib/palette'
import QAToggle from '@/components/ui/QAToggle'

interface Deck {
  id: string
  title: string
  palette: string
}

interface CardData {
  id: string
  question: string
  reference_answer: string
}

type Face = 'question' | 'answer'
type State = { error?: string } | null

interface Props {
  deck: Deck
  card?: CardData
  cardNumber?: number
  previousCardId?: string | null
}

export default function CardEditor({ deck, card, cardNumber, previousCardId }: Props) {
  const isEdit = !!card
  const [face, setFace] = useState<Face>('question')
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const flipped = face === 'answer'

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (prev, formData) => {
      try {
        if (isEdit) {
          await updateCard(formData)
          router.push(`/decks/${deck.id}`)
        } else {
          const newCard = await createCard(formData)
          router.push(`/decks/${deck.id}/cards/${newCard.id}`)
        }
        return null
      } catch (e) {
        return { error: (e as Error).message }
      }
    },
    null
  )

  useEffect(() => { questionRef.current?.focus() }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <CreateBar
        deckId={deck.id}
        deckName={deck.title}
        label={isEdit ? 'Edit card' : 'New card'}
      />

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
      <div className="flex-1 flex items-center justify-center p-6 [perspective:1200px]">
        <form ref={formRef} action={formAction} className="w-full max-w-full flex flex-col items-center gap-6">
          <input type="hidden" name="deck_id" value={deck.id} />
          {isEdit && <input type="hidden" name="id" value={card.id} />}

          {/* The flipping card — palette CSS vars scoped here */}
          <div
            className="relative w-full max-w-[700px] h-[clamp(300px,40vw,460px)] [transform-style:preserve-3d] transition-transform duration-[320ms] ease-in-out"
            style={{
              '--card-bg': bg,
              '--card-ink': ink,
              '--card-ink-subtle': `${ink}20`,
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            } as React.CSSProperties}
          >
            {/* Front — Question */}
            <div className="absolute inset-0 rounded-card overflow-hidden flex flex-col backface-hidden bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_60px_rgba(0,0,0,0.4)]">
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                style={{ backgroundImage: PAPER_NOISE }}
              />
              <CardHeader label="Question" deckName={deck.title} />
              <div className="flex-1 relative">
                <textarea
                  ref={questionRef}
                  name="question"
                  defaultValue={card?.question}
                  placeholder="What's the question?"
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none px-10 pt-4 pb-14 font-display leading-snug text-[clamp(20px,3vw,38px)] tracking-[-0.5px] text-[var(--card-ink)] placeholder:opacity-30 placeholder:text-center"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <QAToggle face={face} onChange={setFace} />
                </div>
              </div>
            </div>

            {/* Back — Answer */}
            <div className="absolute inset-0 rounded-card overflow-hidden flex flex-col backface-hidden [transform:rotateY(180deg)] bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_60px_rgba(0,0,0,0.4)]">
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                style={{ backgroundImage: PAPER_NOISE }}
              />
              <CardHeader label="Answer" deckName={deck.title} />
              <div className="flex-1 relative">
                <textarea
                  ref={answerRef}
                  name="reference_answer"
                  defaultValue={card?.reference_answer}
                  placeholder="Write the answer…"
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none px-10 pt-4 pb-14 font-display leading-snug text-[clamp(20px,3vw,38px)] tracking-[-0.5px] text-[var(--card-ink)] placeholder:opacity-30 placeholder:text-center"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <QAToggle face={face} onChange={setFace} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between w-full max-w-[700px]">
            <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.8px] text-tertiary">
              {isEdit ? 'Editing' : `Card #${cardNumber}`} · {deck.title}
            </span>
            <span className="md:hidden" />
            <div className="flex items-center gap-3">
              {state?.error && <span className="text-red-400 text-xs font-sans">{state.error}</span>}
              <button
                type="button"
                onClick={() => previousCardId
                  ? router.push(`/decks/${deck.id}/cards/${previousCardId}`)
                  : router.push('/library')
                }
                className="px-4 py-2 rounded-btn text-sm font-sans text-secondary border border-divider hover:border-divider-strong hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-sans font-500 bg-primary text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isEdit ? 'Save changes' : 'Save card'}
                <kbd className="hidden md:inline font-mono text-[10px] px-1 py-0.5 rounded border border-divider-strong bg-surface-card text-tertiary">⌘↵</kbd>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function CardHeader({ label, deckName }: { label: string; deckName: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-[color:var(--card-ink-subtle)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.8px] text-[var(--card-ink)] opacity-50">{label}</span>
      <span className="font-sans text-[11px] text-[var(--card-ink)] opacity-40">{deckName}</span>
    </div>
  )
}
