import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { listCards } from '@/app/actions/cards'
import StudyViewer from '@/components/cards/StudyViewer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect('/signin')

  const { id } = await params
  const supabase = await createClient()

  const { data: deck } = await supabase
    .from('decks')
    .select('id, title, palette')
    .eq('id', id)
    .single()

  if (!deck) redirect('/library')

  const cards = await listCards(id)

  if (cards.length === 0) redirect(`/decks/${id}/cards/new`)

  return <StudyViewer deck={deck} cards={cards} />
}
