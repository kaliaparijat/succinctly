import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()

  // count query chain: .select().eq().then()
  const mockEq = vi.fn(() => ({
    then: (cb: (r: { count: number }) => unknown) => cb({ count: 2 }),
  }))
  const mockCountSelect = vi.fn(() => ({ eq: mockEq }))

  // insert chain: .insert().select().single()
  const mockInsertSelect = vi.fn(() => ({ single: mockSingle }))
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }))

  const mockFrom = vi.fn(() => ({
    select: mockCountSelect,
    insert: mockInsert,
  }))

  return { mockSingle, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createCard } from '@/app/actions/cards'

const baseCard = { id: 'new-card-id', deck_id: 'deck-1', question: 'Q', reference_answer: 'A', position: 2 }

describe('createCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({ data: baseCard, error: null })
  })

  it('returns the newly created card including its id', async () => {
    const formData = new FormData()
    formData.set('deck_id', 'deck-1')
    formData.set('question', 'Q')
    formData.set('reference_answer', 'A')

    const result = await createCard(formData)

    expect(result).toMatchObject({ id: 'new-card-id', deck_id: 'deck-1' })
  })

  it('throws when the insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'insert failed' } })

    const formData = new FormData()
    formData.set('deck_id', 'deck-1')
    formData.set('question', 'Q')
    formData.set('reference_answer', 'A')

    await expect(createCard(formData)).rejects.toThrow('insert failed')
  })
})
