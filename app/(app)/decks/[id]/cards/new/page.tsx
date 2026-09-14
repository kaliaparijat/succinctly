import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import { getProfile } from '@/app/actions/profiles'
import CardEditor from '@/components/cards/CardEditor'
import type { Preferences } from '@/lib/data/profiles'
import { resolveFlipDuration } from '@/lib/flipSpeed'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewCardPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const [deck, profile] = await Promise.all([getDeck(id), getProfile(user.id)])

  if (!deck) redirect('/library')

  const cards = await listCards(id)
  const prefs = (profile?.preferences ?? {}) as Preferences

  return (
    <CardEditor
      deck={deck}
      cardNumber={cards.length + 1}
      previousCardId={cards.at(-1)?.id ?? null}
      flipDuration={resolveFlipDuration(prefs.flipSpeed)}
    />
  )
}
