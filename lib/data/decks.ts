import { createClient } from '@/lib/supabase/server'

export async function fetchDeck(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('decks')
    .select('id, title, palette')
    .eq('id', id)
    .single()
  return data
}

export async function fetchDecks() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*, cards(count)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}
