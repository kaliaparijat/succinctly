import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import CardEditor from '@/components/cards/CardEditor'

const mockUseIsMobile = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/app/actions/cards', () => ({
  createCard: vi.fn().mockResolvedValue({ id: 'new-card-id' }),
}))

vi.mock('@/lib/viewTransition', () => ({
  navigateWithTransition: vi.fn(),
}))

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const mockDeck = { id: 'deck-1', title: 'Test Deck', palette: 'butter' }

function afterCardInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[name="after_card_id"]')
}

describe('CardEditor — after_card_id form field', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReset()
  })

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])('carries previousCardId into the form on %s', (_label, isMobile) => {
    mockUseIsMobile.mockReturnValue(isMobile)

    const { container } = render(
      <CardEditor deck={mockDeck} cardNumber={3} previousCardId="card-2" />
    )

    expect(afterCardInput(container)?.value).toBe('card-2')
  })

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])('sends an empty after_card_id on %s when there is no previous card', (_label, isMobile) => {
    mockUseIsMobile.mockReturnValue(isMobile)

    const { container } = render(
      <CardEditor deck={mockDeck} cardNumber={1} previousCardId={null} />
    )

    expect(afterCardInput(container)?.value).toBe('')
  })
})
