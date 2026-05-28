import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { listDecks } from '@/app/actions/decks'
import { createClient } from '@/lib/supabase/server'
import LibraryScreen from '@/components/library/LibraryScreen'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 17) return 'Good afternoon.'
  return 'Good evening.'
}

export default async function LibraryPage() {
  const user = await getUser()
  if (!user) redirect('/signin')

  const [decks, supabase] = await Promise.all([
    listDecks(),
    createClient(),
  ])

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

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
