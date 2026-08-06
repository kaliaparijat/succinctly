import { describe, it, expect, vi, beforeEach } from 'vitest'
import DeckPage from '@/app/(app)/decks/[id]/page'

const mockGetUser = vi.fn()
const mockGetDeck = vi.fn()
const mockListCards = vi.fn()
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`)
})

vi.mock('@/lib/auth', () => ({
  getUser: () => mockGetUser(),
}))

vi.mock('@/app/actions/decks', () => ({
  getDeck: (id: string) => mockGetDeck(id),
}))

vi.mock('@/app/actions/cards', () => ({
  listCards: (id: string) => mockListCards(id),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

const params = Promise.resolve({ id: 'deck-1' })

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetDeck.mockReset()
  mockListCards.mockReset()
  mockRedirect.mockClear()
})

describe('DeckPage', () => {
  it('redirects to /signin when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    await expect(DeckPage({ params })).rejects.toThrow('REDIRECT:/signin')
  })

  it('redirects to /library when the deck is not found', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' })
    mockGetDeck.mockResolvedValue(null)
    await expect(DeckPage({ params })).rejects.toThrow('REDIRECT:/library')
  })

  it('redirects to /cards/new when the deck has no cards', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' })
    mockGetDeck.mockResolvedValue({ id: 'deck-1', title: 'Test', palette: 'butter' })
    mockListCards.mockResolvedValue([])
    await expect(DeckPage({ params })).rejects.toThrow('REDIRECT:/decks/deck-1/cards/new')
  })

  it('redirects to the first card when the deck has cards', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1' })
    mockGetDeck.mockResolvedValue({ id: 'deck-1', title: 'Test', palette: 'butter' })
    mockListCards.mockResolvedValue([{ id: 'card-1' }, { id: 'card-2' }])
    await expect(DeckPage({ params })).rejects.toThrow('REDIRECT:/decks/deck-1/cards/card-1')
  })
})
