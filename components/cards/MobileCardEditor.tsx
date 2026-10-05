import { PAPER_NOISE } from '@/lib/palette'
import { MobileCreateBar } from '@/components/layout/TopBar'
import QAToggle from '@/components/ui/QAToggle'

interface Deck {
  id: string
  title: string
  palette: string
}

type Face = 'question' | 'answer'
type State = { error?: string } | null

interface Props {
  deck: Deck
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
  onBack: () => void
}

export default function MobileCardEditor({
  deck, flipDuration, bg, ink, face, flipped, setFace,
  questionRef, answerRef, formRef, formAction, pending, state, onKeyDown, onBack,
}: Props) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MobileCreateBar
        deckName={deck.title}
        label="New card"
        onBack={onBack}
        onSave={() => formRef.current?.requestSubmit()}
        saving={pending}
      />

      {/* Card stage */}
      <div className="flex-1 flex items-center justify-center p-6 [perspective:1200px]">
        <form ref={formRef} action={formAction} className="w-full max-w-full flex flex-col items-center gap-6">
          <input type="hidden" name="deck_id" value={deck.id} />

          {/* The flipping card — palette CSS vars scoped here */}
          <div
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
              <CardHeader label="Question" />
              <div className="flex-1 relative">
                <textarea
                  ref={questionRef}
                  name="question"
                  placeholder="What's the question?"
                  onKeyDown={onKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none px-[26px] py-[10px] landscape:px-10 landscape:py-1 font-display text-center leading-[1.3] text-[26px] landscape:text-[22px] tracking-[-0.3px] text-[var(--card-ink)] placeholder:opacity-30"
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
              <CardHeader label="Answer" />
              <div className="flex-1 relative">
                <textarea
                  ref={answerRef}
                  name="reference_answer"
                  placeholder="Write the answer…"
                  onKeyDown={onKeyDown}
                  className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none px-[26px] py-[10px] landscape:px-10 landscape:py-1 font-display text-center leading-[1.3] text-[26px] landscape:text-[22px] tracking-[-0.3px] text-[var(--card-ink)] placeholder:opacity-30"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <QAToggle face={face} onChange={setFace} />
                </div>
              </div>
            </div>
          </div>

          {state?.error && (
            <span className="text-red-400 text-xs font-sans text-center">{state.error}</span>
          )}
        </form>
      </div>
    </div>
  )
}

function CardHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-[color:var(--card-ink-subtle)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.8px] text-[var(--card-ink)] opacity-50">{label}</span>
      <span className="font-sans text-[11px] text-[var(--card-ink)] opacity-40">Draft</span>
    </div>
  )
}
