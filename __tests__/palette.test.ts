import { describe, it, expect } from 'vitest'
import { stableTilt } from '@/lib/palette'

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
