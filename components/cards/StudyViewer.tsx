'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ViewerBar } from '@/components/layout/TopBar'
import HelpOverlay from '@/components/ui/HelpOverlay'
import { PALETTES, PAPER_NOISE, stableTilt, type Palette } from '@/lib/palette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

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

export default function StudyViewer({ deck, cards }: { deck: Deck; cards: Card[] }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)

  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const card = cards[idx]
  const tilt = stableTilt(card.question)
  const progress = (idx / (cards.length - 1)) * 100

  const flip = useCallback(() => setFlipped(f => !f), [])

  const goNext = useCallback(() => {
    if (idx >= cards.length - 1) return
    setDir('next')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i + 1); setDir(null) }, 140)
  }, [idx, cards.length])

  const goPrev = useCallback(() => {
    if (idx <= 0) return
    setDir('prev')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i - 1); setDir(null) }, 140)
  }, [idx])

  useKeyboardShortcuts({
    onFlip: flip,
    onNext: goNext,
    onPrev: goPrev,
    onHelp: () => setHelpOpen(h => !h),
  })

  const swipeRef = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev })

  const slideStyle = dir === 'next'
    ? { transform: 'translateX(-110%)', opacity: 0 }
    : dir === 'prev'
    ? { transform: 'translateX(110%)', opacity: 0 }
    : { transform: 'translateX(0)', opacity: 1 }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ViewerBar
        deckName={deck.title}
        current={idx + 1}
        total={cards.length}
        onHelpClick={() => setHelpOpen(true)}
      />

      {/* Progress rail */}
      <div className="h-[2px] bg-surface-card">
        <div
          className="h-full transition-all duration-300 ease-[ease]"
          style={{ width: `${progress}%`, background: bg }}
        />
      </div>

      {/* Card stage */}
      <div
        ref={swipeRef}
        className="flex-1 flex flex-col items-center justify-center p-6"
        style={{ perspective: '1200px' }}
      >
        {/* The card with slide + flip */}
        <div
          className="relative w-full max-w-[700px] cursor-pointer"
          style={{
            height: 'clamp(300px, 40vw, 460px)',
            ...slideStyle,
            transition: dir ? 'transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
          onClick={flip}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Front — Question */}
            <CardFace
              label="Question"
              text={card.question}
              deckName={deck.title}
              bg={bg}
              ink={ink}
              tilt={tilt}
              showHint={idx === 0 && !flipped}
              back={false}
            />

            {/* Back — Answer */}
            <CardFace
              label="Answer"
              text={card.reference_answer}
              deckName={deck.title}
              bg={bg}
              ink={ink}
              tilt={tilt}
              showHint={false}
              back={true}
            />
          </div>
        </div>

        {/* Nav arrows */}
        <div className="flex items-center justify-between w-full max-w-[700px] mt-6">
          <NavArrow direction="left" onClick={goPrev} disabled={idx === 0} />
          <NavArrow direction="right" onClick={goNext} disabled={idx === cards.length - 1} />
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-7 py-4 border-t border-divider">
        <div className="flex items-center gap-2">
          <KeyPill label="←" />
          <KeyPill label="Space" highlight />
          <KeyPill label="→" />
        </div>
        <Link
          href={`/decks/${deck.id}/cards/new`}
          className="text-sm font-sans text-secondary hover:text-primary transition-colors"
        >
          + Add card
        </Link>
      </footer>

      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

function CardFace({
  label, text, deckName, bg, ink, tilt, showHint, back,
}: {
  label: string; text: string; deckName: string; bg: string; ink: string
  tilt: number; showHint: boolean; back: boolean
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
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />

      {/* Header strip */}
      <div className="relative flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${ink}20` }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.5 }}>{label}</span>
        <span className="font-sans text-[11px]" style={{ color: ink, opacity: 0.4 }}>{deckName}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-10 py-6 relative">
        <p
          className="font-display text-center leading-snug"
          style={{ color: ink, fontSize: 'clamp(20px, 3vw, 40px)', letterSpacing: '-0.5px' }}
        >
          {text}
        </p>

        {showHint && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-pill border font-mono text-[10px] uppercase tracking-[0.8px]"
            style={{ color: ink, opacity: 0.4, borderColor: `${ink}30` }}
          >
            Space to flip
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
      className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label={direction === 'left' ? 'Previous card' : 'Next card'}
    >
      {direction === 'left' ? '←' : '→'}
    </button>
  )
}

function KeyPill({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <div
      className="px-3 py-1 rounded-pill border font-mono text-[10px] uppercase tracking-[0.8px]"
      style={{
        background: highlight ? 'rgba(245,245,247,0.08)' : 'transparent',
        borderColor: 'rgba(255,255,255,0.14)',
        color: highlight ? '#F5F5F7' : 'rgba(245,245,247,0.38)',
      }}
    >
      {label}
    </div>
  )
}
