'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCard } from '@/app/actions/cards'
import { navigateWithTransition } from '@/lib/viewTransition'
import { PALETTES, type Palette } from '@/lib/palette'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'
import DesktopCardEditor from '@/components/cards/DesktopCardEditor'
import MobileCardEditor from '@/components/cards/MobileCardEditor'

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
  previousCardId?: string | null
  flipDuration?: number
}

export default function CardEditor({ deck, cardNumber, previousCardId, flipDuration = 380 }: Props) {
  const [face, setFace] = useState<Face>('question')
  // Only the Question face starts editing (matches the design: "the New
  // card flow opens with the Question face already editing"). The Answer
  // face starts closed/click-to-edit — not just to match the design, but
  // because starting both editing is actively wrong: a face's `editing` flag
  // is also flipTo()'s signal for "this was an active session, so open the
  // incoming face in edit mode too." If Answer defaulted to editing=true
  // and was simply never touched, that stale "true" would make the first
  // later flip-away-from-Answer re-open Question in raw edit mode even
  // after Question had already rendered its finished Markdown — caught live
  // in the browser, not by the unit tests, since jsdom doesn't enforce
  // backface-hidden hit-testing the way a real flip does.
  const questionFace = useMarkdownFace({ initialEditing: true })
  const answerFace = useMarkdownFace({ initialEditing: false })
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const isMobile = useIsMobile()

  const { bg, ink } = PALETTES[deck.palette as Palette] ?? PALETTES.butter
  const flipped = face === 'answer'

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (prev, formData) => {
      try {
        const newCard = await createCard(formData)
        navigateWithTransition(router, `/decks/${deck.id}/cards/${newCard.id}`, 'forward')
        return null
      } catch (e) {
        return { error: (e as Error).message }
      }
    },
    null
  )

  // Flipping to a face that was mid-edit opens the new face into editing
  // immediately; the outgoing face renders (closes) once the flip animation
  // finishes, so content never visibly swaps mid-rotation. Flipping while
  // viewing (not editing) keeps the incoming face in rendered mode too.
  function flipTo(next: Face) {
    if (next === face) return
    const from = face === 'question' ? questionFace : answerFace
    const to = next === 'question' ? questionFace : answerFace
    const wasEditing = from.editing
    setFace(next)
    if (wasEditing) {
      to.open()
      // If `to` was already editing (both faces start editing — see
      // useMarkdownFace calls above), its textarea already exists and won't
      // get the fresh-mount autoFocus; focus it explicitly. If it wasn't,
      // this ref is still the old non-editing DOM node (or null) and no-ops
      // harmlessly — the textarea's own autoFocus handles that case once it
      // mounts.
      to.textareaRef.current?.focus()
      setTimeout(() => from.close(), flipDuration)
    } else {
      to.close()
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleFlipKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      flipTo(face === 'question' ? 'answer' : 'question')
    }
  }

  function handleCancel() {
    if (previousCardId) {
      router.push(`/decks/${deck.id}/cards/${previousCardId}`)
    } else {
      router.push('/library')
    }
  }

  if (isMobile) {
    return (
      <MobileCardEditor
        deck={deck}
        flipDuration={flipDuration}
        bg={bg}
        ink={ink}
        face={face}
        flipped={flipped}
        setFace={flipTo}
        questionFace={questionFace}
        answerFace={answerFace}
        formRef={formRef}
        formAction={formAction}
        pending={pending}
        state={state}
        onKeyDown={handleFlipKeyDown}
        onBack={handleCancel}
        previousCardId={previousCardId}
      />
    )
  }

  return (
    <DesktopCardEditor
      deck={deck}
      cardNumber={cardNumber}
      flipDuration={flipDuration}
      bg={bg}
      ink={ink}
      face={face}
      flipped={flipped}
      setFace={flipTo}
      questionFace={questionFace}
      answerFace={answerFace}
      formRef={formRef}
      formAction={formAction}
      pending={pending}
      state={state}
      onKeyDown={handleFlipKeyDown}
      onCancel={handleCancel}
      previousCardId={previousCardId}
    />
  )
}
