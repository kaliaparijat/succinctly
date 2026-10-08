import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import { getProfile } from '@/app/actions/profiles'
import CardEditor from '@/components/cards/CardEditor'
import type { Preferences } from '@/lib/data/profiles'
import { resolveFlipDuration } from '@/lib/flipSpeed'
import { resolveAfterCardId } from '@/lib/cards/resolveAfterCardId'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ after?: string }>
}

export default async function NewCardPage({ params, searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const { after } = await searchParams
  const [deck, profile] = await Promise.all([getDeck(id), getProfile(user.id)])

  if (!deck) redirect('/library')

  const cards = await listCards(id)
  const prefs = (profile?.preferences ?? {}) as Preferences
  const afterCardId = resolveAfterCardId(after, cards)
  // Card number reflects where the new card actually lands: right after its anchor,
  // not always the end of the deck. Falls back to append-at-end if the anchor isn't found.
  const anchorIndex = afterCardId ? cards.findIndex((c) => c.id === afterCardId) : -1
  const cardNumber = anchorIndex >= 0 ? anchorIndex + 2 : cards.length + 1

  return (
    <CardEditor
      deck={deck}
      cardNumber={cardNumber}
      previousCardId={afterCardId}
      flipDuration={resolveFlipDuration(prefs.flipSpeed)}
    />
  )
}
