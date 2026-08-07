import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewCardPage from '@/app/(app)/decks/[id]/cards/new/page'

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

vi.mock('@/components/cards/CardEditor', () => ({
  default: (props: { cardNumber?: number; previousCardId?: string | null }) => (
    <div data-testid="card-editor">
      {props.cardNumber}:{String(props.previousCardId)}
    </div>
  ),
}))

const deck = { id: 'deck-1', title: 'Test', palette: 'butter' }
const params = Promise.resolve({ id: 'deck-1' })

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetDeck.mockReset()
  mockListCards.mockReset()
  mockRedirect.mockClear()
  mockGetUser.mockResolvedValue({ id: 'user-1' })
})

describe('NewCardPage', () => {
  it('redirects to /signin when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    await expect(NewCardPage({ params })).rejects.toThrow('REDIRECT:/signin')
  })

  it('redirects to /library when the deck is not found', async () => {
    mockGetDeck.mockResolvedValue(null)
    await expect(NewCardPage({ params })).rejects.toThrow('REDIRECT:/library')
  })

  it('passes previousCardId=null and cardNumber=1 for an empty deck', async () => {
    mockGetDeck.mockResolvedValue(deck)
    mockListCards.mockResolvedValue([])
    const result = await NewCardPage({ params })
    render(result)
    expect(screen.getByTestId('card-editor')).toHaveTextContent('1:null')
  })

  it('passes the last card id as previousCardId and the next card number', async () => {
    mockGetDeck.mockResolvedValue(deck)
    mockListCards.mockResolvedValue([{ id: 'card-1' }, { id: 'card-2' }])
    const result = await NewCardPage({ params })
    render(result)
    expect(screen.getByTestId('card-editor')).toHaveTextContent('3:card-2')
  })
})
