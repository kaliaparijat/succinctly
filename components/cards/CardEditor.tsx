'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCard } from '@/app/actions/cards'
import { navigateWithTransition } from '@/lib/viewTransition'
import { PALETTES, type Palette } from '@/lib/palette'
import DesktopCardEditor from '@/components/cards/DesktopCardEditor'

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
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

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

  useEffect(() => { questionRef.current?.focus() }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const next: Face = face === 'question' ? 'answer' : 'question'
      setFace(next)
      setTimeout(() => {
        (next === 'question' ? questionRef : answerRef).current?.focus()
      }, 340)
    }
  }

  function handleCancel() {
    if (previousCardId) {
      router.push(`/decks/${deck.id}/cards/${previousCardId}`)
    } else {
      router.push('/library')
    }
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
      setFace={setFace}
      questionRef={questionRef}
      answerRef={answerRef}
      formRef={formRef}
      formAction={formAction}
      pending={pending}
      state={state}
      onKeyDown={handleKeyDown}
      onCancel={handleCancel}
    />
  )
}
