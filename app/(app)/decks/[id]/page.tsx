import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { listCards } from '@/app/actions/cards'
import StudyViewer from '@/components/cards/StudyViewer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const deck = await getDeck(id)

  if (!deck) redirect('/library')

  const cards = await listCards(id)

  if (cards.length === 0) redirect(`/decks/${id}/cards/new`)

  return <StudyViewer deck={deck} cards={cards} />
}
