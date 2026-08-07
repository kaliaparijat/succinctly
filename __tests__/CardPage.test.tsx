import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardPage from '@/app/(app)/decks/[id]/cards/[cardId]/page'

const mockGetUser = vi.fn()
const mockGetDeck = vi.fn()
const mockListCards = vi.fn()
const mockGetProfile = vi.fn()
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

vi.mock('@/app/actions/profiles', () => ({
  getProfile: (id: string) => mockGetProfile(id),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

vi.mock('@/components/cards/StudyViewer', () => ({
  default: (props: { initialCardId?: string }) => (
    <div data-testid="study-viewer">{props.initialCardId}</div>
  ),
}))

const deck = { id: 'deck-1', title: 'Test', palette: 'butter' }
const cards = [{ id: 'card-1' }, { id: 'card-2' }]

const paramsFor = (cardId: string) => Promise.resolve({ id: 'deck-1', cardId })

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetDeck.mockReset()
  mockListCards.mockReset()
  mockGetProfile.mockReset()
  mockRedirect.mockClear()
  mockGetUser.mockResolvedValue({ id: 'user-1' })
  mockGetProfile.mockResolvedValue(null)
})

describe('CardPage', () => {
  it('redirects to /signin when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    await expect(CardPage({ params: paramsFor('card-1') })).rejects.toThrow('REDIRECT:/signin')
  })

  it('redirects to /library when the deck is not found', async () => {
    mockGetDeck.mockResolvedValue(null)
    await expect(CardPage({ params: paramsFor('card-1') })).rejects.toThrow('REDIRECT:/library')
  })

  it('redirects to /cards/new when the deck has no cards', async () => {
    mockGetDeck.mockResolvedValue(deck)
    mockListCards.mockResolvedValue([])
    await expect(CardPage({ params: paramsFor('card-1') })).rejects.toThrow(
      'REDIRECT:/decks/deck-1/cards/new'
    )
  })

  it('redirects to the first card when the cardId does not exist', async () => {
    mockGetDeck.mockResolvedValue(deck)
    mockListCards.mockResolvedValue(cards)
    await expect(CardPage({ params: paramsFor('bogus') })).rejects.toThrow(
      'REDIRECT:/decks/deck-1/cards/card-1'
    )
  })

  it('renders StudyViewer with the matching card id when it exists', async () => {
    mockGetDeck.mockResolvedValue(deck)
    mockListCards.mockResolvedValue(cards)
    const result = await CardPage({ params: paramsFor('card-2') })
    render(result)
    expect(screen.getByTestId('study-viewer')).toHaveTextContent('card-2')
  })
})
