import { describe, it, expect } from 'vitest'
import { greeting } from '@/lib/greeting'

describe('greeting', () => {
  it('returns Good morning before noon', () => {
    expect(greeting(new Date('2025-01-01T07:00:00'))).toBe('Good morning.')
  })

  it('returns Good morning at midnight', () => {
    expect(greeting(new Date('2025-01-01T00:00:00'))).toBe('Good morning.')
  })

  it('returns Good afternoon from noon to 5pm', () => {
    expect(greeting(new Date('2025-01-01T12:00:00'))).toBe('Good afternoon.')
    expect(greeting(new Date('2025-01-01T16:59:00'))).toBe('Good afternoon.')
  })

  it('returns Good evening from 5pm onward', () => {
    expect(greeting(new Date('2025-01-01T17:00:00'))).toBe('Good evening.')
    expect(greeting(new Date('2025-01-01T23:59:00'))).toBe('Good evening.')
  })
})
