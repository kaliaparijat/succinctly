'use client'

import { useState, useCallback, useMemo, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PALETTES, stableTilt, type Palette } from '@/lib/palette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { useIsMobile } from '@/hooks/useIsMobile'
import { navigateWithTransition } from '@/lib/viewTransition'
import { updateCardInline } from '@/app/actions/cards'
import { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'
import DesktopStudyViewer from '@/components/cards/DesktopStudyViewer'
import MobileStudyViewer from '@/components/cards/MobileStudyViewer'

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
  initialCardId?: string
  tiltEnabled?: boolean
  flipDuration?: number
  hintsEnabled?: boolean
}

export default function StudyViewer({
  deck,
  cards,
  initialCardId,
  tiltEnabled = true,
  flipDuration = 380,
  hintsEnabled = true,
}: Props) {
  const [idx, setIdx] = useState(() => {
    if (!initialCardId) return 0
    const i = cards.findIndex(c => c.id === initialCardId)
    return i >= 0 ? i : 0
  })
  const [flipped, setFlipped] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [dir, setDir] = useState<'next' | 'prev' | null>(null)
  // Locally saved card text, keyed by card id. Field names mirror the `cards` table
  // (`reference_answer`, not `answer`) so this can be spread over the server card as-is;
  // the UI's face name 'answer' (editingFace, the Q/A toggle) is a separate concept.
  const [saved, setSaved] = useState<Record<string, { question: string; reference_answer: string }>>({})
  // One Markdown face per side. Their `editing` flags are the only edit state; `editingFace` is derived.
  const questionFace = useMarkdownFace()
  const answerFace = useMarkdownFace()
  const editingFace: 'question' | 'answer' | null = questionFace.editing ? 'question' : answerFace.editing ? 'answer' : null
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const router = useRouter()
  const isMobile = useIsMobile()
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    router.replace(`/decks/${deck.id}/cards/${cards[idx].id}`)
  // deck.id and cards are stable server props; idx is the only trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const serverCard = cards[idx]
  // Locally saved text wins over server props, which stay stale until router.refresh() lands (#21).
  const savedForCard = saved[serverCard.id]
  const card = useMemo(() => ({ ...serverCard, ...savedForCard }), [serverCard, savedForCard])
  const tilt = tiltEnabled ? stableTilt(serverCard.question) : 0
  const progress = (idx / (cards.length - 1)) * 100

  const flip = useCallback(() => setFlipped(f => !f), [])

  // Mobile's slide-commit animation runs at 220ms (vs desktop's existing 280ms) — this
  // delay bumps idx at the animation's midpoint, matching the halving relationship
  // MobileStudyViewer's own COMMIT_DELAY_MS/COMMIT_DURATION_MS constants also use.
  const commitDelayMs = isMobile ? 110 : 140

  const goNext = useCallback(() => {
    if (idx >= cards.length - 1) {
      router.push(`/decks/${deck.id}/cards/new`)
      return
    }
    setDir('next')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i + 1); setDir(null) }, commitDelayMs)
  }, [idx, cards.length, deck.id, router, commitDelayMs])

  const goPrev = useCallback(() => {
    if (idx <= 0) return
    setDir('prev')
    setFlipped(false)
    setTimeout(() => { setIdx(i => i - 1); setDir(null) }, commitDelayMs)
  }, [idx, commitDelayMs])

  const faceFor = (which: 'question' | 'answer') => (which === 'question' ? questionFace : answerFace)
  const textFor = (which: 'question' | 'answer') => (which === 'question' ? card.question : card.reference_answer)

  // Seeds from the merged `card` (saved text over server props), never `cards[idx]` — see #21.
  const openFace = (which: 'question' | 'answer') => faceFor(which).open(textFor(which))

  const handleEditSave = (nextFace: 'question' | 'answer' | null = null) => {
    if (!editingFace) return
    const face = faceFor(editingFace)
    const text = face.text.trim()
    const otherFace = editingFace === 'question' ? card.reference_answer : card.question
    face.close()
    if (nextFace) openFace(nextFace)
    if (!text && !otherFace.trim()) {
      // Both faces would be empty: save nothing and fall back to the last saved text.
      // (Becomes a delete once card delete exists — #23.)
      return
    }
    const question = editingFace === 'question' ? text : card.question
    const referenceAnswer = editingFace === 'answer' ? text : card.reference_answer
    const previous = { question: card.question, reference_answer: card.reference_answer }
    const next = { question, reference_answer: referenceAnswer }
    setSaved(prev => ({ ...prev, [card.id]: next }))
    startTransition(async () => {
      try {
        await updateCardInline(card.id, deck.id, question, referenceAnswer)
      } catch {
        // Roll back to the last saved text, unless a newer save has already replaced this one.
        // The user-facing failure signal is tracked in #22.
        setSaved(prev => (prev[card.id] === next ? { ...prev, [card.id]: previous } : prev))
        return
      }
      router.refresh()
    })
  }

  const handleToggleFace = (newFace: 'question' | 'answer') => {
    if (newFace === editingFace) return
    handleEditSave(newFace)
    setFlipped(newFace === 'answer')
  }

  // Focus leaving the face (tap/click elsewhere, swipe, nav away) must save — otherwise the edit is
  // silently discarded (#15). Two exceptions. Blurring TO the Q/A toggle is the "save and switch
  // which face you're editing" flow (handleToggleFace does its own save). And Escape blurs the
  // textarea on its way out; that is a cancel, so the hook's cancel flag skips the save.
  const handleBlurAway = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget
    if (next instanceof HTMLElement && next.closest('[data-qa-toggle]')) return
    if (editingFace && faceFor(editingFace).consumeCancel()) return
    handleEditSave(null)
  }

  // Escape is handled by the face itself (cancel); ⌘↵ saves.
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleEditSave(null)
    }
  }

  const handleClick = useCallback(() => {
    if (editingFace) return
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      flip()
      clickTimer.current = null
    }, 220)
  }, [editingFace, flip])

  const enterEdit = () => {
    if (editingFace) return
    openFace(flipped ? 'answer' : 'question')
  }

  const handleDoubleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    enterEdit()
  }

  useKeyboardShortcuts({
    onFlip: flip,
    onNext: goNext,
    onPrev: goPrev,
    onHelp: () => setHelpOpen(h => !h),
    disabled: editingFace !== null,
  })

  const { ref: swipeRef, dragX, isDragging } = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev })

  if (isMobile) {
    return (
      <MobileStudyViewer
        deck={deck}
        card={card}
        idx={idx}
        totalCards={cards.length}
        bg={bg}
        ink={ink}
        tilt={tilt}
        flipped={flipped}
        flipDuration={flipDuration}
        hintsEnabled={hintsEnabled}
        editingFace={editingFace}
        questionFace={questionFace}
        answerFace={answerFace}
        dir={dir}
        swipeRef={swipeRef}
        dragX={dragX}
        isDragging={isDragging}
        onBackClick={() => navigateWithTransition(router, '/library', 'back')}
        onEditClick={enterEdit}
        onFlip={flip}
        onEditKeyDown={handleEditKeyDown}
        onBlurAway={handleBlurAway}
        onToggleFace={handleToggleFace}
        onPrev={goPrev}
        onNext={goNext}
      />
    )
  }

  return (
    <DesktopStudyViewer
      deck={deck}
      card={card}
      idx={idx}
      totalCards={cards.length}
      bg={bg}
      ink={ink}
      tilt={tilt}
      progress={progress}
      flipped={flipped}
      flipDuration={flipDuration}
      hintsEnabled={hintsEnabled}
      editingFace={editingFace}
      questionFace={questionFace}
      answerFace={answerFace}
      dir={dir}
      swipeRef={swipeRef}
      helpOpen={helpOpen}
      setHelpOpen={setHelpOpen}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onEditKeyDown={handleEditKeyDown}
      onBlurAway={handleBlurAway}
      onToggleFace={handleToggleFace}
      onPrev={goPrev}
      onNext={goNext}
    />
  )
}
