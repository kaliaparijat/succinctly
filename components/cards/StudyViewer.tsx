'use client'

import { useState, useCallback, useRef, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ViewerBar } from '@/components/layout/TopBar'
import HelpOverlay from '@/components/ui/HelpOverlay'
import { PALETTES, PAPER_NOISE, stableTilt, type Palette } from '@/lib/palette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { updateCardInline } from '@/app/actions/cards'
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

interface Props {
  deck: Deck
  cards: Card[]
  tiltEnabled?: boolean
  flipDuration?: number
  hintsEnabled?: boolean
}

export default function StudyViewer({
  deck,
  cards,
  tiltEnabled = true,
  flipDuration = 320,
  hintsEnabled = true,
}: Props) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)
  const [editingFace, setEditingFace] = useState<'question' | 'answer' | null>(null)
  const editRef = useRef<HTMLDivElement>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const router = useRouter()
  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const card = cards[idx]
  const tilt = tiltEnabled ? stableTilt(card.question) : 0
  const progress = (idx / (cards.length - 1)) * 100

  const flip = useCallback(() => setFlipped(f => !f), [])

  const goNext = useCallback(() => {
    if (idx >= cards.length - 1) {
      router.push(`/decks/${deck.id}/cards/new`)
      return
    }
    setDir('next')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i + 1); setDir(null) }, 140)
  }, [idx, cards.length, deck.id, router])

  const goPrev = useCallback(() => {
    if (idx <= 0) return
    setDir('prev')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i - 1); setDir(null) }, 140)
  }, [idx])

  // Focus the contenteditable and place cursor at end when entering edit mode
  useEffect(() => {
    if (!editingFace || !editRef.current) return
    const text = editingFace === 'question' ? card.question : card.reference_answer
    editRef.current.innerText = text
    editRef.current.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    if (sel) {
      range.selectNodeContents(editRef.current)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFace]) // intentionally omit card to avoid resetting mid-edit

  const handleEditSave = useCallback((nextFace: 'question' | 'answer' | null = null) => {
    if (!editRef.current || !editingFace) return
    const text = editRef.current.innerText.trim()
    if (!text) return
    const question = editingFace === 'question' ? text : card.question
    const referenceAnswer = editingFace === 'answer' ? text : card.reference_answer
    setEditingFace(nextFace)
    startTransition(async () => {
      await updateCardInline(card.id, deck.id, question, referenceAnswer)
      router.refresh()
    })
  }, [editingFace, card, deck.id, router])

  const handleToggleFace = useCallback((newFace: 'question' | 'answer') => {
    if (newFace === editingFace) return
    handleEditSave(newFace)
    setFlipped(newFace === 'answer')
  }, [editingFace, handleEditSave])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingFace(null)
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleEditSave(null)
    }
  }, [handleEditSave])

  const handleClick = useCallback(() => {
    if (editingFace) return
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      flip()
      clickTimer.current = null
    }, 220)
  }, [editingFace, flip])

  const handleDoubleClick = useCallback(() => {
    if (editingFace) return
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    setEditingFace(flipped ? 'answer' : 'question')
  }, [editingFace, flipped])

  useKeyboardShortcuts({
    onFlip: flip,
    onNext: goNext,
    onPrev: goPrev,
    onHelp: () => setHelpOpen(h => !h),
    disabled: editingFace !== null,
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
          className="relative w-full max-w-[700px]"
          style={{
            height: 'clamp(300px, 40vw, 460px)',
            ...slideStyle,
            cursor: editingFace ? 'default' : 'pointer',
            transition: dir ? 'transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
          onClick={editingFace ? undefined : handleClick}
          onDoubleClick={editingFace ? undefined : handleDoubleClick}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: `transform ${flipDuration}ms cubic-bezier(0.4,0,0.2,1)`,
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
              onEditKeyDown={handleEditKeyDown}
              onToggleFace={handleToggleFace}
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
              onEditKeyDown={handleEditKeyDown}
              onToggleFace={handleToggleFace}
            />
          </div>
        </div>

        {/* Nav arrows */}
        <div className="flex items-center justify-between w-full max-w-[700px] mt-6">
          <NavArrow direction="left" onClick={goPrev} disabled={idx === 0} />
          {idx === cards.length - 1 ? (
            <Link
              href={`/decks/${deck.id}/cards/new`}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-xl text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
              aria-label="Add card"
            >
              +
            </Link>
          ) : (
            <NavArrow direction="right" onClick={goNext} disabled={false} />
          )}
        </div>
      </div>

      {/* Footer — keyboard hints, desktop only, gated on hintsEnabled */}
      {hintsEnabled && (
        <footer className="hidden md:flex items-center px-7 py-4 border-t border-divider">
          <KeyPill label="←" />
          <KeyPill label="Space" highlight />
          <KeyPill label="→" />
        </footer>
      )}

      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

function CardFace({
  label, text, deckName, bg, ink, tilt, showHint, back,
  isEditing, editRef, onEditKeyDown, onToggleFace,
}: {
  label: string; text: string; deckName: string; bg: string; ink: string
  tilt: number; showHint: boolean; back: boolean
  isEditing: boolean
  editRef: React.RefObject<HTMLDivElement | null>
  onEditKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onToggleFace: (face: 'question' | 'answer') => void
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
        ...(isEditing ? { outline: `2px solid ${ink}25`, outlineOffset: '-2px' } : {}),
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }} />

      <div className="relative flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${ink}20` }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.8px]" style={{ color: ink, opacity: 0.5 }}>{label}</span>
        <span className="font-sans text-[11px]" style={{ color: ink, opacity: 0.4 }}>{deckName}</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-10 py-6 relative">
        <div
          ref={isEditing ? editRef : null}
          contentEditable={isEditing ? 'plaintext-only' : 'false'}
          suppressContentEditableWarning
          onKeyDown={isEditing ? onEditKeyDown : undefined}
          className="font-display text-center leading-snug outline-none w-full"
          style={{
            color: ink,
            fontSize: 'clamp(20px, 3vw, 40px)',
            letterSpacing: '-0.5px',
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
