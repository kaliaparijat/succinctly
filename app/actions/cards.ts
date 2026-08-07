'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function listCards(deckId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function createCard(formData: FormData) {
  const supabase = await createClient()

  const deckId = formData.get('deck_id') as string

  // Position = current card count
  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)
    .then(r => ({ count: r.count ?? 0 }))

  const { data, error } = await supabase.from('cards').insert({
    deck_id: deckId,
    question: formData.get('question') as string,
    reference_answer: formData.get('reference_answer') as string,
    position: count,
  }).select().single()

  if (error) throw new Error(error.message)

  revalidatePath(`/decks/${deckId}`)
  return data
}

export async function updateCard(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const deckId = formData.get('deck_id') as string

  const { error } = await supabase
    .from('cards')
    .update({
      question: formData.get('question') as string,
      reference_answer: formData.get('reference_answer') as string,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/decks/${deckId}`)
}

export async function updateCardInline(
  id: string,
  deckId: string,
  question: string,
  referenceAnswer: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cards')
    .update({ question, reference_answer: referenceAnswer })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/decks/${deckId}`)
}

export async function deleteCard(id: string, deckId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('cards').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/decks/${deckId}`)
}
