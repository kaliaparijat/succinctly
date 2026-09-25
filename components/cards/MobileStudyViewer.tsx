'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { MobileViewerBar } from '@/components/layout/TopBar'
import { PAPER_NOISE } from '@/lib/palette'
import QAToggle from '@/components/ui/QAToggle'

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
  editRef: RefObject<HTMLDivElement | null>
  dir: 'next' | 'prev' | null
  swipeRef: (el: HTMLElement | null) => void
  dragX: number
  isDragging: boolean
  onBackClick: () => void
  onEditClick: () => void
  onFlip: () => void
  onEditKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onToggleFace: (face: 'question' | 'answer') => void
  onPrev: () => void
  onNext: () => void
}

export default function MobileStudyViewer({
  deck, card, idx, totalCards, bg, ink, tilt, flipped, flipDuration,
  hintsEnabled, editingFace, editRef, dir, swipeRef, dragX, isDragging,
  onBackClick, onEditClick, onFlip, onEditKeyDown, onToggleFace, onPrev, onNext,
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
    <div className="min-h-screen bg-surface flex flex-col">
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
            height: 'clamp(300px, 40vw, 460px)',
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
              isEditing={editingFace === 'question'}
              editRef={editRef}
              onEditKeyDown={onEditKeyDown}
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
              isEditing={editingFace === 'answer'}
              editRef={editRef}
              onEditKeyDown={onEditKeyDown}
              onToggleFace={onToggleFace}
            />
          </div>
        </div>
      </div>

      {/* Bottom control row */}
      <div className="flex items-center justify-between p-[6px_20px_14px] landscape:p-[2px_20px_8px]">
        <NavArrow direction="left" onClick={onPrev} disabled={idx === 0} />
        {idx === totalCards - 1 ? (
          <Link
            href={`/decks/${deck.id}/cards/new`}
            className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center text-xl text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
            aria-label="Add card"
          >
            +
          </Link>
        ) : (
          <NavArrow direction="right" onClick={onNext} disabled={false} />
        )}
      </div>
    </div>
  )
}

function CardFace({
  label, text, deckName, bg, ink, tilt, showHint, back,
  isEditing, editRef, onEditKeyDown, onToggleFace, viewTransitionName,
}: {
  label: string; text: string; deckName: string; bg: string; ink: string
  tilt: number; showHint: boolean; back: boolean
  isEditing: boolean
  editRef: RefObject<HTMLDivElement | null>
  onEditKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onToggleFace: (face: 'question' | 'answer') => void
  viewTransitionName?: string
}) {
  return (
    <div
      className="absolute inset-0 rounded-card overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: bg,
        transform: `rotate(${tilt}deg)${back ? ' rotateY(180deg)' : ''}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
        willChange: 'transform',
        ...(isEditing ? { outline: `2px solid ${ink}25`, outlineOffset: '-2px' } : {}),
        ...(viewTransitionName ? { viewTransitionName } : {}),
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />

      <div className="relative flex items-center justify-between shrink-0" style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${ink}1c` }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.5 }}>{label}</span>
        <span className="font-sans text-[11px]" style={{ color: ink, opacity: 0.4 }}>{deckName}</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative p-[18px_26px] landscape:p-[6px_40px]">
        <div
          ref={isEditing ? editRef : null}
          contentEditable={isEditing ? 'plaintext-only' : 'false'}
          suppressContentEditableWarning
          onKeyDown={isEditing ? onEditKeyDown : undefined}
          className="font-display text-center outline-none w-full text-[27px] landscape:text-[24px]"
          style={{
            color: ink,
            lineHeight: 1.28,
            letterSpacing: '-0.3px',
            textWrap: 'pretty',
            cursor: isEditing ? 'text' : 'inherit',
            minHeight: '1em',
          }}
        >
          {!isEditing && text}
        </div>

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
