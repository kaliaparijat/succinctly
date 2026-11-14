'use client'

import Link from 'next/link'
import { MobileViewerBar } from '@/components/layout/TopBar'
import { PAPER_NOISE } from '@/lib/palette'
import MarkdownRenderer from '@/components/cards/markdown/MarkdownRenderer'
import FormatToolbar from '@/components/cards/markdown/FormatToolbar'
import MarkdownFace from '@/components/cards/markdown/MarkdownFace'
import type { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'
import QAToggle from '@/components/ui/QAToggle'

type Face = ReturnType<typeof useMarkdownFace>

interface Card {
  id: string
  question: string
  reference_answer: string
}

interface Deck {
  id: string
  title: string
  palette: string
}

// Mobile's own slide-commit timing — independent of DesktopStudyViewer's 110%/280ms/140ms,
// which stays untouched in its own file. COMMIT_DELAY_MS is half of COMMIT_DURATION_MS,
// matching the halving relationship the parent's commitDelayMs also uses to bump idx at
// the animation's midpoint — keep the two in sync if either changes.
const COMMIT_OFFSET_PCT = 100
const COMMIT_DURATION_MS = 220
const SPRING_BACK_DURATION_MS = 200

interface Props {
  deck: Deck
  card: Card
  idx: number
  totalCards: number
  bg: string
  ink: string
  tilt: number
  flipped: boolean
  flipDuration: number
  hintsEnabled: boolean
  editingFace: 'question' | 'answer' | null
  questionFace: Face
  answerFace: Face
  dir: 'next' | 'prev' | null
  swipeRef: (el: HTMLElement | null) => void
  dragX: number
  isDragging: boolean
  onBackClick: () => void
  onEditClick: () => void
  onFlip: () => void
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onBlurAway: (e: React.FocusEvent<HTMLDivElement>) => void
  onDone: () => void
  onToggleFace: (face: 'question' | 'answer') => void
  onPrev: () => void
  onNext: () => void
}

export default function MobileStudyViewer({
  deck, card, idx, totalCards, bg, ink, tilt, flipped, flipDuration,
  hintsEnabled, editingFace, questionFace, answerFace, dir, swipeRef, dragX, isDragging,
  onBackClick, onEditClick, onFlip, onEditKeyDown, onBlurAway, onDone, onToggleFace, onPrev, onNext,
}: Props) {
  let transform: string
  let transition: string | undefined
  let opacity = 1

  if (dir === 'next') {
    transform = `translateX(-${COMMIT_OFFSET_PCT}%)`
    transition = `transform ${COMMIT_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${COMMIT_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1)`
    opacity = 0
  } else if (dir === 'prev') {
    transform = `translateX(${COMMIT_OFFSET_PCT}%)`
    transition = `transform ${COMMIT_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${COMMIT_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1)`
    opacity = 0
  } else if (isDragging) {
    // Live 1:1 follow — no transition, so the card tracks the finger with zero lag.
    transform = `translateX(${dragX}px)`
    transition = 'none'
  } else {
    // At rest, or just released under the commit threshold: spring back to center.
    transform = 'translateX(0)'
    transition = `transform ${SPRING_BACK_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1)`
  }

  const slideStyle = { transform, opacity, transition }

  return (
    <div className="h-dvh bg-surface flex flex-col">
      <MobileViewerBar
        deckName={deck.title}
        current={idx + 1}
        total={totalCards}
        onBackClick={onBackClick}
        onEditClick={onEditClick}
      />

      {/* Card area */}
      <div
        ref={swipeRef}
        data-testid="mobile-card-stage"
        className="flex-1 flex items-center justify-center overflow-hidden p-[0_12px_8px] landscape:p-[0_20px_4px]"
        style={{ perspective: '1200px' }}
      >
        <div
          data-testid="mobile-card"
          className="relative w-full max-w-[700px]"
          style={{
            height: '100%',
            transform: slideStyle.transform,
            opacity: slideStyle.opacity,
            transition: slideStyle.transition,
            cursor: editingFace ? 'default' : 'pointer',
          }}
          onClick={editingFace ? undefined : onFlip}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: `transform ${flipDuration}ms cubic-bezier(0.4,0,0.2,1)`,
              willChange: 'transform',
            }}
          >
            <CardFace
              label="Question"
              text={card.question}
              deckName={deck.title}
              bg={bg}
              ink={ink}
              tilt={tilt}
              showHint={hintsEnabled && !editingFace}
              back={false}
              face={questionFace}
              onEditKeyDown={onEditKeyDown}
              onBlurAway={onBlurAway}
              onDone={onDone}
              onToggleFace={onToggleFace}
              viewTransitionName={`card-${deck.id}`}
            />
            <CardFace
              label="Answer"
              text={card.reference_answer}
              deckName={deck.title}
              bg={bg}
              ink={ink}
              tilt={tilt}
              showHint={hintsEnabled && !editingFace}
              back={true}
              face={answerFace}
              onEditKeyDown={onEditKeyDown}
              onBlurAway={onBlurAway}
              onDone={onDone}
              onToggleFace={onToggleFace}
            />
          </div>
        </div>
      </div>

      {/* Bottom control row */}
      <div className="grid grid-cols-3 items-center p-[6px_20px_14px] landscape:p-[2px_20px_8px]">
        <NavArrow direction="left" onClick={onPrev} disabled={idx === 0} />
        <Link
          href={`/decks/${deck.id}/cards/new?after=${card.id}`}
          className="justify-self-center w-10 h-10 rounded-full bg-surface-card flex items-center justify-center text-xl text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
          aria-label="Insert card"
        >
          +
        </Link>
        <div className="justify-self-end">
          <NavArrow direction="right" onClick={onNext} disabled={idx === totalCards - 1} />
        </div>
      </div>
    </div>
  )
}

function CardFace({
  label, text, deckName, bg, ink, tilt, showHint, back,
  face, onEditKeyDown, onBlurAway, onDone, onToggleFace, viewTransitionName,
}: {
  label: string; text: string; deckName: string; bg: string; ink: string
  tilt: number; showHint: boolean; back: boolean
  face: Face
  onEditKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onBlurAway: (e: React.FocusEvent<HTMLDivElement>) => void
  onDone: () => void
  onToggleFace: (face: 'question' | 'answer') => void
  viewTransitionName?: string
}) {
  const isEditing = face.editing
  const placeholder = label === 'Question' ? "What's the question?" : 'Write the answer…'
  return (
    <div
      className="absolute inset-0 rounded-card overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: bg,
        '--card-ink': ink,
        transform: `rotate(${tilt}deg)${back ? ' rotateY(180deg)' : ''}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
        willChange: 'transform',
        ...(isEditing ? { outline: `2px solid ${ink}25`, outlineOffset: '-2px' } : {}),
        ...(viewTransitionName ? { viewTransitionName } : {}),
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />

      <div className="relative flex items-center justify-between shrink-0" style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${ink}1c` }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.5 }}>{label}</span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <FormatToolbar onFmt={face.fmt} size={30} gap={0} color={ink} />
            <button
              type="button"
              // Keep focus in the textarea so tapping Done saves via onDone, not via the blur it would cause.
              onMouseDown={(e) => e.preventDefault()}
              onClick={onDone}
              className="font-mono text-[9.5px] uppercase tracking-[0.7px] rounded-pill px-[10px] py-[5px]"
              style={{ background: ink, color: bg }}
            >
              Done
            </button>
          </div>
        ) : (
          <span className="font-sans text-[11px]" style={{ color: ink, opacity: 0.4 }}>{deckName}</span>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        {isEditing ? (
          <MarkdownFace
            name={back ? 'reference_answer' : 'question'}
            face={face}
            placeholder={placeholder}
            ariaLabel={label}
            ink={ink}
            onKeyDown={onEditKeyDown}
            onBlurAway={onBlurAway}
            paddingClassName="pt-[18px] px-5 pb-[66px] landscape:pt-[6px] landscape:px-10 landscape:pb-11"
            textareaClassName="font-mono text-[12.5px] leading-[1.65] text-[var(--card-ink)] caret-[var(--card-ink)] placeholder:opacity-[0.35]"
          />
        ) : (
          /* Scroller owns the design's padding (bottom clears the toggle/hint); the text block below
             centers itself with my-auto: centered when short, top-aligned and scrollable when long. */
          <div className="absolute inset-0 overflow-y-auto flex flex-col pt-[18px] px-5 pb-[66px] landscape:pt-[6px] landscape:px-10 landscape:pb-11">
            <div
              className="font-display text-center w-full my-auto text-[27px] landscape:text-[24px]"
              style={{ color: ink, lineHeight: 1.28, letterSpacing: '-0.3px', textWrap: 'pretty', minHeight: '1em' }}
            >
              {/* size="inherit": the text container above owns the responsive font size (including mobile landscape) */}
              <MarkdownRenderer src={text} placeholder={placeholder} size="inherit" codeSize={10.5} ink={ink} />
            </div>
          </div>
        )}

        {isEditing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <QAToggle face={back ? 'answer' : 'question'} onChange={onToggleFace} />
          </div>
        )}

        {showHint && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-pill border font-mono text-[10px] uppercase tracking-[0.8px]"
            style={{ color: ink, opacity: 0.4, borderColor: `${ink}30` }}
          >
            Tap to flip
          </div>
        )}

      </div>
    </div>
  )
}

function NavArrow({ direction, onClick, disabled }: { direction: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label={direction === 'left' ? 'Previous card' : 'Next card'}
    >
      {direction === 'left' ? '←' : '→'}
    </button>
  )
}
