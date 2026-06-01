import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import { getProfile } from '@/app/actions/profiles'
import StudyViewer from '@/components/cards/StudyViewer'
import type { Preferences } from '@/lib/data/profiles'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const [deck, profile] = await Promise.all([getDeck(id), getProfile(user.id)])

  if (!deck) redirect('/library')

  const cards = await listCards(id)

  if (cards.length === 0) redirect(`/decks/${id}/cards/new`)

  const prefs = (profile?.preferences ?? {}) as Preferences

  const FLIP_MS = { slow: 480, normal: 320, fast: 160 } as const
  const flipDuration = FLIP_MS[prefs.flipSpeed ?? 'normal']

  return (
    <StudyViewer
      deck={deck}
      cards={cards}
      tiltEnabled={prefs.tilt !== false}
      flipDuration={flipDuration}
      hintsEnabled={prefs.hints !== false}
    />
  )
}
