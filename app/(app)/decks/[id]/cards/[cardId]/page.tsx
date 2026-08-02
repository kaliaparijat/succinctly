import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import { getProfile } from '@/app/actions/profiles'
import StudyViewer from '@/components/cards/StudyViewer'
import type { Preferences } from '@/lib/data/profiles'

interface Props {
  params: Promise<{ id: string; cardId: string }>
}

export default async function CardPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id, cardId } = await params
  const [deck, profile] = await Promise.all([getDeck(id), getProfile(user.id)])

  if (!deck) redirect('/library')

  const cards = await listCards(id)

  if (cards.length === 0) redirect(`/decks/${id}/cards/new`)

  const cardExists = cards.some(c => c.id === cardId)
  if (!cardExists) redirect(`/decks/${id}/cards/${cards[0].id}`)

  const prefs = (profile?.preferences ?? {}) as Preferences
  const FLIP_MS = { slow: 480, normal: 320, fast: 160 } as const
  const flipDuration = FLIP_MS[prefs.flipSpeed ?? 'normal']

  return (
    <StudyViewer
      deck={deck}
      cards={cards}
      initialCardId={cardId}
      tiltEnabled={prefs.tilt !== false}
      flipDuration={flipDuration}
      hintsEnabled={prefs.hints !== false}
    />
  )
}
