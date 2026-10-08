# Plan: issue-12-insert-card-anywhere

Source spec: `docs/specs/issue-12-insert-card-anywhere/spec.md`
(issue #12: https://github.com/kaliaparijat/succinctly/issues/12)

## Context

`createCard` (`app/actions/cards.ts`) always appends — `position` is set to the current card count.
The deck has no list view; it's a one-card-at-a-time flip viewer. This plan makes `position`
fractional (numeric column) so inserting a card between two existing ones only ever writes the new
row, and adds the UI trigger to actually do it.

## Process: every task is test-first

Each task that changes behavior follows the same loop, in this order:

1. **Red:** write the test(s) for the task and run them. They must fail for the reason the task
   addresses, not for an unrelated import or typo.
2. **Green:** write the smallest change that makes them pass.
3. **Refactor** only with the tests green.

A task isn't done until its tests pass, and the next task doesn't start until then. Phase 5 is
end-to-end verification in the browser, not where tests get written. Task 1.1 (the migration) is the
one exception: it's verified by inspecting the schema after the push.

## Architecture decision: unify "append" and "insert" into one action and one control

There is no meaningful difference between "append" and "insert after card X" once position is
fractional — append is just "insert after the last card." So `createCard` is generalized to accept
an optional `after_card_id`, rather than adding a second, parallel Server Action:
- `after_card_id` present, has a following card → `position = (afterPos + nextPos) / 2`
- `after_card_id` present, is the last card → `position = afterPos + 1`
- `after_card_id` absent (empty deck) → `position = 0`

The "new card" route already carries a `previousCardId` prop used today only for the Cancel button's
target. For every existing call site that value is already "the card to insert after" (the deck's
last card), so it's reused as-is for `after_card_id` — no new prop plumbing, just wiring the
existing value into the form and letting the route pick a different source card when one is
specified.

Nav arrows: the right arrow drops its last-card special case and becomes symmetric with the left
(`disabled={idx === totalCards - 1}`). A new, always-visible `+` link is added between the two
arrows, pointing at `/decks/{deckId}/cards/new?after={card.id}` — `card` (the currently displayed
card) is already in scope at that render point in both `DesktopStudyViewer.tsx` and
`MobileStudyViewer.tsx`.

Tie-breaking: two cards can land on the same fractional `position` under a concurrent insert into
the same gap (acceptable per the spec — no uniqueness constraint, no retry). `listCards`'s
`.order('position')` gets a secondary `.order('created_at')` so ties still resolve to a stable,
deterministic order instead of depending on whatever order Postgres happens to return them in.

## Dependency graph

```
1.1 Migration: cards.position integer → numeric
        │
        ▼
1.2 Regenerate lib/database.types.ts
        │
        ▼
2.1 createCard: after_card_id → fractional position  (test-first)
        │
        ├──────────────────────────┐
        ▼                          ▼
2.2 listCards tie-break       3.1 resolveAfterCardId + page wiring  (test-first)
    (test-first)                   │
                                   ▼
                              3.2 hidden after_card_id in the create form  (test-first)
                                   │
                                   ▼
                              4.1 symmetric arrows + "+" insert control  (test-first)
                                   │
                                   ▼
                              5.1 full suite + build green
                              5.2 live browser check (mid-deck insert, append, cancel)
```

## Phase 1 — Data model

### Task 1.1 — Migration: `cards.position` integer → numeric
**Do:** `npx supabase migration new fractional_card_position`, write
`ALTER TABLE public.cards ALTER COLUMN position TYPE numeric USING position::numeric;` (keeps the
existing `default 0`; no RLS policy references `position`, confirmed, so none need touching).
**Depends on:** nothing. **Prerequisite check:** confirm `npx supabase` is linked/authenticated to
the remote project (`wogc....supabase.co`) — confirmed linked locally (`.temp/project-ref` matches),
but **not yet authenticated** (`npx supabase projects list` returned `AccessTokenRequiredError`).
This needs an interactive `npx supabase login` (or `SUPABASE_ACCESS_TOKEN` env var) the user runs
before this task can execute.
**Verify:** `npx supabase db push` (or the hosted-project equivalent) succeeds; a quick
`select position from cards limit 1` style check (via the Supabase dashboard or CLI) shows the
column is now `numeric` with existing values intact.

### Task 1.2 — Regenerate `lib/database.types.ts`
**Do:** `npx supabase gen types typescript` for the linked project, overwrite
`lib/database.types.ts`. The `cards.position` field stays typed `number` in TS either way (no type
shape change) — this just keeps the generated file honest/in sync.
**Depends on:** 1.1.
**Verify:** `git diff lib/database.types.ts` shows no unexpected changes beyond what codegen
produces; `npm test` still green.

## Phase 2 — Server Action

### Task 2.1 — Generalize `createCard` to accept `after_card_id`
**Red:** In `__tests__/createCard.test.ts`, rewrite the mocks (the old count-based mock no longer
matches the code) and add failing tests for:
- mid-deck: anchor at position `1`, next sibling at `2` → inserted with position `1.5`
- after the last card: anchor at `2`, no next sibling → `3`
- no `after_card_id` (empty deck) → `0`
- anchor lookup is scoped by both `id` and `deck_id` (assert both `.eq` calls)
- anchor not found (wrong deck or deleted) → throws a clear error, no insert attempted

**Green:** In `app/actions/cards.ts`, replace the count-based position logic. Read `after_card_id`
from `formData` (string or empty/absent). If present, fetch the anchor's `position` scoped by both
`id` and `deck_id`, so a card from another deck can't be used as the anchor. If no row comes back,
throw a clear error. Then fetch the next sibling's `position`
(`.gt('position', afterPos).order('position').limit(1)`) and compute
`position = nextRow ? (afterPos + nextRow.position) / 2 : afterPos + 1`. If `after_card_id` is absent,
`position = 0`.
**Depends on:** 1.1 (needs the numeric column to do fractional math meaningfully).
**Acceptance criteria (spec):** "A card can be inserted between any two existing cards in a deck";
"Existing cards' positions are unaffected by an insert (no shift)."

### Task 2.2 — `listCards` tie-break
**Red:** Add a test asserting `listCards` orders by `position` ascending, then `created_at`
ascending (assert both `.order` calls in the query chain). It fails against the current single-key
order.
**Green:** `.order('position', { ascending: true }).order('created_at', { ascending: true })`.
**Depends on:** nothing (independent of 2.1, can land anytime).
**Acceptance criteria (spec):** "Deck ordering via `ORDER BY position` still returns the correct
sequence" — including the tie case the spec explicitly accepts.

## Phase 3 — Wire the insert-after context through the UI

### Task 3.1 — `/decks/[id]/cards/new` reads an `after` search param
**Red:** Extract the anchor choice into a pure function, `resolveAfterCardId(after, cards)`
(e.g. `lib/cards/resolveAfterCardId.ts`). Tests first, for:
- `after` given → returns `after`
- `after` absent, deck has cards → returns the last card's id
- `after` absent, empty deck → returns `null`

**Green:** Implement the function. Then wire the page: add
`searchParams: Promise<{ after?: string }>` to the page's `Props` (matching the existing
`params: Promise<...>` pattern), read it, and pass `previousCardId={resolveAfterCardId(after, cards)}`
into `<CardEditor>`. Existing links with no query string keep today's append-at-end behavior.
**Depends on:** nothing structurally. The page wiring is thin and is covered by the function's tests
plus Task 5.2's manual check.

### Task 3.2 — Thread `after_card_id` into the create form
**Red:** Add tests to the existing editor tests asserting that, for both `DesktopCardEditor` and
`MobileCardEditor`, rendering with `previousCardId="c2"` produces a form containing
`input[name="after_card_id"][value="c2"]`, and with `previousCardId={null}` produces the same input
with `value=""`. Both fail until the input exists.

**Green:** `CardEditor.tsx` already receives `previousCardId` but never passes it to
`DesktopCardEditor`/`MobileCardEditor` — add it to both calls. In both child components, add
`previousCardId?: string | null` to `Props`, and add
`<input type="hidden" name="after_card_id" value={previousCardId ?? ''} />` inside the `<form>`,
alongside the existing `<input type="hidden" name="deck_id" .../>` pattern
(`DesktopCardEditor.tsx:48`).
**Depends on:** 2.1, 3.1.

## Phase 4 — Insert trigger in the viewer

### Task 4.1 — Symmetric nav arrows + always-visible insert control
**Red:** In `__tests__/StudyViewer.test.tsx`, with `useIsMobile` mocked both ways, add tests for:
- a `+` link with `aria-label="Insert card"` and `href` `/decks/deck-1/cards/new?after=<card.id>`
  renders on a middle card and on the last card
- the right nav arrow is enabled on a middle card and disabled on the last card
- the left arrow stays disabled on the first card (regression)

These fail against the current ternary (`idx === totalCards - 1 ? <Link> : <NavArrow>`).

**Green:** In both `DesktopStudyViewer.tsx` (~line 136-149) and `MobileStudyViewer.tsx` (~line
156-169): change the right `NavArrow` to always render with `disabled={idx === totalCards - 1}`
(dropping the ternary that swapped it for a `Link` on the last card). Add a new `+` link between the
two arrows: `<Link href={`/decks/${deck.id}/cards/new?after=${card.id}`} aria-label="Insert card">`,
styled consistently with today's circular `+` button, always visible regardless of `idx`. Adjust the
row's layout (e.g. `grid grid-cols-3 items-center` in place of `flex justify-between`) so three
controls sit evenly.
**Depends on:** 3.1 (the `?after=` param needs to exist on the receiving end).
**Acceptance criteria (spec):** the issue's "insert a card wherever it's conceptually relevant, not
just at the end" — this is the actual trigger for that.

## Phase 5 — Verification

### Task 5.1 — Full suite and build
**Do:** `npm test` and `npm run build`, both green, with no tests skipped or deleted to get there.
**Depends on:** all of Phases 2–4.

### Task 5.2 — Live browser check (end-to-end, not a substitute for the tests above)
**Do:** Live in the dev server (and Chrome DevTools MCP for a mobile viewport): create a deck with 3
cards, use the new `+` from the middle card, confirm the new card lands between the right two and the
deck now has 4 in the correct order; confirm the last-card `+` still behaves like plain append;
confirm Cancel from the insert flow still returns to the card you started from (regression on
`handleCancel`'s `previousCardId` use).
**Depends on:** 5.1.
**Acceptance criteria (spec):** all four checkboxes in
`docs/specs/issue-12-insert-card-anywhere/spec.md` — tick them off here.
