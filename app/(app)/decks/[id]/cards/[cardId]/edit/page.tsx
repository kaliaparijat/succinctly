import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getDeck } from '@/app/actions/decks'
import { fetchCard } from '@/lib/data/cards'
import CardEditor from '@/components/cards/CardEditor'

interface Props {
  params: Promise<{ id: string; cardId: string }>
}

export default async function EditCardPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id, cardId } = await params
  const [deck, card] = await Promise.all([getDeck(id), fetchCard(cardId)])

  if (!deck || !card) redirect(`/decks/${id}`)

  return <CardEditor deck={deck} card={card} />
}
