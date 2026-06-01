import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { listDecks } from '@/app/actions/decks'
import { getProfile } from '@/app/actions/profiles'
import LibraryScreen from '@/components/library/LibraryScreen'
import { greeting } from '@/lib/greeting'

export default async function LibraryPage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const [decks, profile] = await Promise.all([
    listDecks(),
    getProfile(user.id),
  ])

  const cardCounts = (decks as Array<{ cards: Array<{ count: number }> }>).map(
    d => d.cards?.[0]?.count ?? 0
  )

  return (
    <LibraryScreen
      decks={decks}
      cardCounts={cardCounts}
      userName={profile?.name ?? user.email ?? 'U'}
      greeting={greeting()}
    />
  )
}
