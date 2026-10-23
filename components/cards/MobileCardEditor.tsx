import { PAPER_NOISE } from '@/lib/palette'
import { MobileCreateBar } from '@/components/layout/TopBar'
import QAToggle from '@/components/ui/QAToggle'
import MarkdownFace from '@/components/cards/markdown/MarkdownFace'
import FormatToolbar from '@/components/cards/markdown/FormatToolbar'
import type { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'

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
  questionFace: ReturnType<typeof useMarkdownFace>
  answerFace: ReturnType<typeof useMarkdownFace>
  formRef: React.RefObject<HTMLFormElement | null>
  formAction: (formData: FormData) => void
  pending: boolean
  state: State
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onBack: () => void
  previousCardId?: string | null
}

export default function MobileCardEditor({
  deck, flipDuration, bg, ink, face, flipped, setFace, previousCardId,
  questionFace, answerFace, formRef, formAction, pending, state, onKeyDown, onBack,
}: Props) {
  const currentFace = face === 'question' ? questionFace : answerFace

  return (
    <div className="h-dvh bg-surface flex flex-col">
      <MobileCreateBar
        deckName={deck.title}
        label="New card"
        onBack={onBack}
        onSave={() => formRef.current?.requestSubmit()}
        saving={pending}
      />

      {/* Card stage */}
      <div className="flex-1 flex items-center justify-center p-6 [perspective:1200px]">
        <form ref={formRef} action={formAction} className="w-full h-full max-w-full flex flex-col items-center gap-6">
          <input type="hidden" name="deck_id" value={deck.id} />
          <input type="hidden" name="after_card_id" value={previousCardId ?? ''} />

          {/* The flipping card — palette CSS vars scoped here */}
          <div
            data-testid="mobile-card"
            className="relative w-full max-w-[700px] flex-1 [transform-style:preserve-3d] transition-transform ease-in-out"
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
              <CardHeader editing={questionFace.editing} onDone={questionFace.close} />
              <div className="flex-1 relative">
                <MarkdownFace
                  name="question"
                  face={questionFace}
                  placeholder="What's the question?"
                  ink="var(--card-ink)"
                  size={19}
                  codeSize={10.5}
                  onKeyDown={onKeyDown}
                  autoFocus={face === 'question'}
                  paddingClassName="pt-[18px] px-5 pb-[66px] landscape:pt-2 landscape:px-10"
                  textareaClassName="font-display text-center leading-[1.3] text-[26px] landscape:text-[22px] tracking-[-0.3px] text-[var(--card-ink)] placeholder:opacity-30"
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
              <CardHeader editing={answerFace.editing} onDone={answerFace.close} />
              <div className="flex-1 relative">
                <MarkdownFace
                  name="reference_answer"
                  face={answerFace}
                  placeholder="Write the answer…"
                  ink="var(--card-ink)"
                  size={19}
                  codeSize={10.5}
                  onKeyDown={onKeyDown}
                  autoFocus={face === 'answer'}
                  paddingClassName="pt-[18px] px-5 pb-[66px] landscape:pt-2 landscape:px-10"
                  textareaClassName="font-display text-center leading-[1.3] text-[26px] landscape:text-[22px] tracking-[-0.3px] text-[var(--card-ink)] placeholder:opacity-30"
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

          {/* Formatting toolbar — bottom bar, targets whichever face is currently showing */}
          <div className="w-full max-w-[700px] flex items-center justify-center border-t border-divider pt-3">
            <FormatToolbar onFmt={currentFace.fmt} size={38} gap={0} color="var(--text-primary)" />
          </div>
        </form>
      </div>
    </div>
  )
}

function CardHeader({ editing, onDone }: { editing: boolean; onDone: () => void }) {
  return (
    <div className="flex items-center justify-end px-5 py-3 shrink-0 border-b border-[color:var(--card-ink-subtle)] min-h-[20px]">
      {editing ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDone}
          className="font-mono text-[9.5px] uppercase tracking-[0.7px] rounded-pill px-[10px] py-[5px] bg-[var(--card-ink)] text-[var(--card-bg)]"
        >
          Done
        </button>
      ) : (
        <span className="font-sans text-[11px] text-[var(--card-ink)] opacity-40">Draft</span>
      )}
    </div>
  )
}
