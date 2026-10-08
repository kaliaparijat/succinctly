import { PAPER_NOISE } from '@/lib/palette'
import { CreateBar } from '@/components/layout/TopBar'
import QAToggle from '@/components/ui/QAToggle'
import KeyPill from '@/components/ui/KeyPill'

interface Deck {
  id: string
  title: string
  palette: string
}

type Face = 'question' | 'answer'
type State = { error?: string } | null

interface Props {
  deck: Deck
  cardNumber?: number
  flipDuration: number
  bg: string
  ink: string
  face: Face
  flipped: boolean
  setFace: (face: Face) => void
  questionRef: React.RefObject<HTMLTextAreaElement | null>
  answerRef: React.RefObject<HTMLTextAreaElement | null>
  formRef: React.RefObject<HTMLFormElement | null>
  formAction: (formData: FormData) => void
  pending: boolean
  state: State
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onCancel: () => void
  previousCardId?: string | null
}

export default function DesktopCardEditor({
  deck, cardNumber, flipDuration, bg, ink, face, flipped, setFace, previousCardId,
  questionRef, answerRef, formRef, formAction, pending, state, onKeyDown, onCancel,
}: Props) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <CreateBar
        deckId={deck.id}
        deckName={deck.title}
      />

      {/* Card stage */}
      <div className="flex-1 flex items-center justify-center p-6 [perspective:1200px]">
        <form ref={formRef} action={formAction} className="w-full max-w-full flex flex-col items-center gap-6">
          <input type="hidden" name="deck_id" value={deck.id} />
          <input type="hidden" name="after_card_id" value={previousCardId ?? ''} />

          {/* The flipping card — palette CSS vars scoped here */}
          <div
            data-testid="flip-card"
            className="relative w-full max-w-[700px] h-[clamp(300px,40vw,460px)] [transform-style:preserve-3d] transition-transform ease-in-out"
            style={{
              '--card-bg': bg,
              '--card-ink': ink,
              '--card-ink-subtle': `${ink}20`,
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transitionDuration: `${flipDuration}ms`,
              willChange: 'transform',
            } as React.CSSProperties}
          >
            {/* Front — Question */}
            <div className="absolute inset-0 rounded-card overflow-hidden flex flex-col backface-hidden will-change-transform bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_60px_rgba(0,0,0,0.4)]">
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                style={{ backgroundImage: PAPER_NOISE }}
              />
              <CardHeader label="Question" deckName={deck.title} />
              <div className="flex-1 relative">
                <textarea
                  ref={questionRef}
                  name="question"
                  placeholder="What's the question?"
                  onKeyDown={onKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none px-10 pt-4 pb-14 font-display leading-snug text-[clamp(20px,3vw,38px)] tracking-[-0.5px] text-[var(--card-ink)] placeholder:opacity-30 placeholder:text-center"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <QAToggle face={face} onChange={setFace} />
                </div>
              </div>
            </div>

            {/* Back — Answer */}
            <div className="absolute inset-0 rounded-card overflow-hidden flex flex-col backface-hidden will-change-transform [transform:rotateY(180deg)] bg-[var(--card-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_60px_rgba(0,0,0,0.4)]">
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                style={{ backgroundImage: PAPER_NOISE }}
              />
              <CardHeader label="Answer" deckName={deck.title} />
              <div className="flex-1 relative">
                <textarea
                  ref={answerRef}
                  name="reference_answer"
                  placeholder="Write the answer…"
                  onKeyDown={onKeyDown}
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
              Card #{cardNumber} · {deck.title}
            </span>
            <span className="md:hidden" />
            <div className="flex items-center gap-3">
              {state?.error && <span className="text-red-400 text-xs font-sans">{state.error}</span>}
              <button
                type="button"
                onClick={onCancel}
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
                <kbd className="hidden md:inline font-mono text-[10px] px-1 py-0.5 rounded border border-divider-strong bg-surface-card text-tertiary">⌘↵</kbd>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Footer — keyboard hint, desktop only, mirrors StudyViewer's footer height */}
      <footer className="hidden md:flex items-center gap-2 px-7 py-4 border-t border-divider">
        <KeyPill label="Tab" highlight />
        <span className="font-mono text-[10px] uppercase tracking-[0.8px] text-tertiary">to flip</span>
      </footer>
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
