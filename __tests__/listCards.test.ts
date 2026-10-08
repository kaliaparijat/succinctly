import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockOrder, mockEq, mockFrom } = vi.hoisted(() => {
  // A chainable query: every builder method returns the same chain, and awaiting the
  // chain resolves to an empty result set.
  const chain: Record<string, unknown> = {}
  const mockSelect = vi.fn(() => chain)
  const mockEq = vi.fn(() => chain)
  const mockOrder = vi.fn(() => chain)
  Object.assign(chain, {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    then: (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null }),
  })
  const mockFrom = vi.fn(() => chain)
  return { mockOrder, mockEq, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

import { listCards } from '@/app/actions/cards'

describe('listCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('orders by position, then created_at as a tie-break', async () => {
    await listCards('deck-1')

    expect(mockEq).toHaveBeenCalledWith('deck_id', 'deck-1')
    expect(mockOrder).toHaveBeenNthCalledWith(1, 'position', { ascending: true })
    expect(mockOrder).toHaveBeenNthCalledWith(2, 'created_at', { ascending: true })
  })
})
