# Issue #12 — Allow inserting a card anywhere in a deck
https://github.com/kaliaparijat/succinctly/issues/12

## Problem
Cards can currently only be appended to the end of a deck
(`app/actions/cards.ts:createCard` sets `position` to the current card
count). Adding a card is a primary user action — users should be able to
insert one wherever it's conceptually relevant, not just at the end.

## Approach
Change `cards.position` from integer to a fractional/numeric column.
Inserting between two cards computes `new_position = (before + after) / 2`
and writes only the new row — no other card is rewritten, and
`listCards`'s existing `ORDER BY position` keeps working unchanged.

A concurrent insert into the same gap can produce a tie (two cards at the
same `position`); break it with a secondary sort (`created_at`) rather than
locking. If the same gap gets split enough times that float precision
becomes a problem, rebalance positions for that deck in a one-off pass —
not needed on day one.

Rejected: a linked-list `next` column (an uncoordinated concurrent insert
can silently orphan a card from the chain) and a Postgres RPC that shifts
integer positions (most robust under concurrency, but O(n) writes per
insert and this codebase's first stored procedure) — see the issue for the
full comparison.

## Acceptance Criteria
- [ ] A card can be inserted between any two existing cards in a deck
- [ ] Existing cards' positions are unaffected by an insert (no shift)
- [ ] Deck ordering via `ORDER BY position` still returns the correct sequence
- [ ] Deleting a card doesn't require updating any other card's row

## Not Doing
- Collaborative multi-editor decks
- Automatic position-rebalancing job
