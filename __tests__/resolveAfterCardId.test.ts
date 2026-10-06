import { describe, it, expect } from 'vitest'
import { resolveAfterCardId } from '@/lib/cards/resolveAfterCardId'

const cards = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }]

describe('resolveAfterCardId', () => {
  it('returns the after param when one is given', () => {
    expect(resolveAfterCardId('c1', cards)).toBe('c1')
  })

  it('falls back to the last card when no after param is given', () => {
    expect(resolveAfterCardId(undefined, cards)).toBe('c3')
  })

  it('returns null for an empty deck with no after param', () => {
    expect(resolveAfterCardId(undefined, [])).toBeNull()
  })
})
