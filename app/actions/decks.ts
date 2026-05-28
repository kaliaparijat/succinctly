'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Palette =
  | 'butter' | 'sky' | 'coral' | 'mint'
  | 'lilac' | 'paper' | 'terracotta' | 'sage'

export async function listDecks() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decks')
    .select('*, cards(count)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createDeck(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase.from('decks').insert({
    user_id: user.id,
    title: formData.get('title') as string,
    palette: (formData.get('palette') as Palette) ?? 'butter',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/library')
}

export async function deleteDeck(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('decks').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/library')
}
