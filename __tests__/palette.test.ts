import { describe, it, expect } from 'vitest'
import { stableTilt, nextPalette } from '@/lib/palette'

describe('stableTilt', () => {
  it('returns the same value for the same input', () => {
    expect(stableTilt('React hooks')).toBe(stableTilt('React hooks'))
  })

  it('returns different values for different inputs', () => {
    expect(stableTilt('React hooks')).not.toBe(stableTilt('Vue composition'))
  })

  it('stays within the -0.6 to +0.6 range', () => {
    const seeds = ['', 'a', 'hello', 'The quick brown fox', '12345', '🎴']
    for (const seed of seeds) {
      const tilt = stableTilt(seed)
      expect(tilt).toBeGreaterThanOrEqual(-0.6)
      expect(tilt).toBeLessThanOrEqual(0.6)
    }
  })

  it('returns -0.6 for an empty string (hash is 0, maps to minimum)', () => {
    expect(stableTilt('')).toBe(-0.6)
  })
})

describe('nextPalette', () => {
  it('returns the first palette when no decks exist', () => {
    expect(nextPalette([])).toBe('butter')
  })

  it('returns the first unused palette in list order, not input order', () => {
    expect(nextPalette(['sage', 'butter'])).toBe('sky')
  })

  it('skips over palettes already in use', () => {
    expect(nextPalette(['butter', 'sky', 'coral'])).toBe('mint')
  })

  it('wraps back to the first palette once all 8 are in use', () => {
    const allEight = ['butter', 'sky', 'coral', 'mint', 'lilac', 'paper', 'terracotta', 'sage']
    expect(nextPalette(allEight)).toBe('butter')
  })

  it('ignores duplicate/unknown entries in usedPalettes', () => {
    expect(nextPalette(['butter', 'butter'])).toBe('sky')
  })
})
