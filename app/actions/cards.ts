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
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function createCard(formData: FormData) {
  const supabase = await createClient()

  const deckId = formData.get('deck_id') as string
  const afterCardId = (formData.get('after_card_id') as string) || null

  // Empty deck: first card. Otherwise insert after the anchor card: at the midpoint
  // of it and its next sibling, or one past it if it is the last card.
  let position = 0
  if (afterCardId) {
    const { data: anchor, error: anchorError } = await supabase
      .from('cards')
      .select('position')
      .eq('id', afterCardId)
      .eq('deck_id', deckId)
      .maybeSingle()

    if (anchorError) throw new Error(anchorError.message)
    if (!anchor) throw new Error('Insert anchor card not found in this deck')

    const { data: nextRows, error: nextError } = await supabase
      .from('cards')
      .select('position')
      .eq('deck_id', deckId)
      .gt('position', anchor.position)
      .order('position', { ascending: true })
      .limit(1)

    if (nextError) throw new Error(nextError.message)

    const next = nextRows?.[0]
    position = next ? (anchor.position + next.position) / 2 : anchor.position + 1
  }

  const { data, error } = await supabase.from('cards').insert({
    deck_id: deckId,
    question: formData.get('question') as string,
    reference_answer: formData.get('reference_answer') as string,
    position,
  }).select().single()

  if (error) throw new Error(error.message)

  revalidatePath(`/decks/${deckId}`)
  return data
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
