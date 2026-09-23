'use client'

import { useState, useCallback, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PALETTES, stableTilt, type Palette } from '@/lib/palette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { updateCardInline } from '@/app/actions/cards'
import DesktopStudyViewer from '@/components/cards/DesktopStudyViewer'

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
  const [editingFace, setEditingFace] = useState<'question' | 'answer' | null>(null)
  const editRef = useRef<HTMLDivElement>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const router = useRouter()
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    router.replace(`/decks/${deck.id}/cards/${cards[idx].id}`)
  // deck.id and cards are stable server props; idx is the only trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

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

  const { ref: swipeRef } = useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev })

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
      editRef={editRef}
      dir={dir}
      swipeRef={swipeRef}
      helpOpen={helpOpen}
      setHelpOpen={setHelpOpen}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onEditKeyDown={handleEditKeyDown}
      onToggleFace={handleToggleFace}
      onPrev={goPrev}
      onNext={goNext}
    />
  )
}
