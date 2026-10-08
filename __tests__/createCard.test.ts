import { describe, it, expect, vi, beforeEach } from 'vitest'

// A chainable stand-in for the Supabase query builder. Each `from()` call gets its own
// chain and records it, so tests can inspect the anchor lookup, the next-sibling lookup,
// and the insert separately. Terminal calls resolve to whatever the test put in `state`.
const { state, mockFrom } = vi.hoisted(() => {
  const state = {
    anchor: { data: null, error: null } as { data: unknown; error: unknown },
    next: { data: [], error: null } as { data: unknown[]; error: unknown },
    inserted: { data: null, error: null } as { data: unknown; error: unknown },
    insertedRow: undefined as Record<string, unknown> | undefined,
    chains: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
  }

  const makeChain = (): Record<string, ReturnType<typeof vi.fn>> => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      gt: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      insert: vi.fn((row: Record<string, unknown>) => {
        state.insertedRow = row
        return chain
      }),
      maybeSingle: vi.fn(async () => state.anchor),
      single: vi.fn(async () => state.inserted),
      // Awaiting a chain that ends in `limit()` resolves to the next-sibling rows.
      then: vi.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(state.next).then(resolve, reject)
      ),
    }
    return chain
  }

  const mockFrom = vi.fn(() => {
    const chain = makeChain()
    state.chains.push(chain)
    return chain
  })

  return { state, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createCard } from '@/app/actions/cards'

const baseCard = { id: 'new-card-id', deck_id: 'deck-1', question: 'Q', reference_answer: 'A', position: 0 }

function formFor(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  formData.set('deck_id', 'deck-1')
  formData.set('question', 'Q')
  formData.set('reference_answer', 'A')
  for (const [k, v] of Object.entries(overrides)) formData.set(k, v)
  return formData
}

describe('createCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.chains.length = 0
    state.insertedRow = undefined
    state.anchor = { data: null, error: null }
    state.next = { data: [], error: null }
    state.inserted = { data: baseCard, error: null }
  })

  it('returns the newly created card including its id', async () => {
    const result = await createCard(formFor())

    expect(result).toMatchObject({ id: 'new-card-id', deck_id: 'deck-1' })
  })

  it('throws when the insert fails', async () => {
    state.inserted = { data: null, error: { message: 'insert failed' } }

    await expect(createCard(formFor())).rejects.toThrow('insert failed')
  })

  it('inserts between two cards at the midpoint of their positions', async () => {
    state.anchor = { data: { position: 1 }, error: null }
    state.next = { data: [{ position: 2 }], error: null }

    await createCard(formFor({ after_card_id: 'card-a' }))

    expect(state.insertedRow).toMatchObject({ deck_id: 'deck-1', position: 1.5 })
  })

  it('appends after the last card at anchor position + 1', async () => {
    state.anchor = { data: { position: 2 }, error: null }
    state.next = { data: [], error: null }

    await createCard(formFor({ after_card_id: 'card-last' }))

    expect(state.insertedRow).toMatchObject({ position: 3 })
  })

  it('places the first card of an empty deck at position 0 without looking up an anchor', async () => {
    await createCard(formFor())

    expect(state.insertedRow).toMatchObject({ position: 0 })
    // Only the insert query ran: no anchor or next-sibling lookup.
    expect(state.chains).toHaveLength(1)
  })

  it('treats an empty after_card_id as no anchor', async () => {
    await createCard(formFor({ after_card_id: '' }))

    expect(state.insertedRow).toMatchObject({ position: 0 })
    expect(state.chains).toHaveLength(1)
  })

  it('scopes the anchor lookup by both card id and deck id', async () => {
    state.anchor = { data: { position: 1 }, error: null }
    state.next = { data: [{ position: 2 }], error: null }

    await createCard(formFor({ after_card_id: 'card-a' }))

    const anchorChain = state.chains[0]
    expect(anchorChain.eq).toHaveBeenCalledWith('id', 'card-a')
    expect(anchorChain.eq).toHaveBeenCalledWith('deck_id', 'deck-1')
  })

  it('throws a clear error and inserts nothing when the anchor is not in this deck', async () => {
    state.anchor = { data: null, error: null }

    await expect(createCard(formFor({ after_card_id: 'card-gone' }))).rejects.toThrow(
      /not found in this deck/
    )
    expect(state.insertedRow).toBeUndefined()
  })
})
