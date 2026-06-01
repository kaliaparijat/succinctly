import { createClient } from '@/lib/supabase/server'

export async function fetchCard(cardId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cards')
    .select('id, deck_id, question, reference_answer')
    .eq('id', cardId)
    .single()
  return data
}
