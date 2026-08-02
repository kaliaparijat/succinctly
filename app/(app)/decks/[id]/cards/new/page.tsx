import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import CardEditor from '@/components/cards/CardEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewCardPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const deck = await getDeck(id)

  if (!deck) redirect('/library')

  const cards = await listCards(id)

  return (
    <CardEditor
      deck={deck}
      cardNumber={cards.length + 1}
      previousCardId={cards.at(-1)?.id ?? null}
    />
  )
}
