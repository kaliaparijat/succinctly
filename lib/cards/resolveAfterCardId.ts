// Which card a new card should be inserted after. An explicit `after` search param wins;
// otherwise the new card goes at the end of the deck, or nowhere for an empty deck.
export function resolveAfterCardId(
  after: string | undefined,
  cards: ReadonlyArray<{ id: string }>
): string | null {
  return after ?? cards.at(-1)?.id ?? null
}
