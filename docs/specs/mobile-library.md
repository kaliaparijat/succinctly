# Mobile Redesign: Library

Part of the mobile redesign — see `docs/specs/mobile-redesign.md` for the
overview. Depends on `docs/specs/mobile-foundation.md`'s breakpoint hook.
Decision history: `docs/specs/mobile-redesign-questions.md`.

## Problem
`LibraryScreen` today is a desktop grid of deck thumbnails with a modal for
creating a deck and a hover-revealed menu for editing one. The mobile
design replaces this with a flat, full-width, tappable deck-row list and a
bottom tab bar — per the design handoff's Screen 1 section.

## Scope
`LibraryScreen` at ≤768px. Per design doc Screen 1 for exact tokens/
spacing, **except** the two interaction changes below, which supersede the
original mockup per review on GitHub issue #7.

## Non-Goals
- No palette-change affordance on mobile — rename only. Changing a deck's
  palette stays desktop-only, via the existing `EditDeckModal`.
- Desktop is untouched: `DeckThumb`, `NewDeckModal`, `EditDeckModal`,
  `AccountDropdown` keep their current behavior exactly. The only fork is
  which JSX/logic `LibraryScreen` renders based on the breakpoint hook.

## Behavior

**Deck rows.** Full width, tap opens the deck's first card via
`navigateWithTransition(router, href, 'forward')` (from
`lib/viewTransition.ts`).

**New deck row — inline creation, not a modal.** Pinned dashed row, always
first in the list. Tapping its `+` icon transitions the row itself into an
editable text input (autofocused), with a checkmark CTA. The deck is
**not created** until the checkmark is tapped with a non-empty (trimmed)
name — at that point `createDeck` fires (with the next unused palette, see
below), then navigates into that deck's `/cards/new`
(`navigateWithTransition`, `forward`). Tapping outside the row while
editing (blur) cancels: reverts to the plain dashed row, no deck created,
whatever was typed is discarded. Tapping the checkmark with an empty/
whitespace-only name is a no-op — stays in edit state, doesn't submit. If
the create call itself fails, stay in edit state with the typed text
preserved (not discarded) so the user can retry or cancel manually.

**Palette selection.** The next palette not currently used by any of this
user's decks, cycling through the design doc's 6-palette set — `butter,
sky, coral, mint, lilac, sage` (not all 8 palettes defined in
`lib/palette.ts`, which also has `paper`/`terracotta` that the design
doesn't document). Once all 6 are in use, cycle back to the start.

**Per-row secondary button — inline rename**, replacing the old
quick-add-card affordance entirely (that action no longer exists on mobile
Library — there is no per-row "add a card directly from Library" shortcut
on mobile). Icon changes from `+` to a pencil (matching the edit idiom
used elsewhere in the app, e.g. the study viewer's edit button) — a `+`
glyph on a rename action would be misleading. Tapping it turns that row's
title into the same inline-editable-field pattern as new-deck creation
(autofocus, checkmark to confirm, blur cancels, empty is a no-op,
preserve-text-on-failure), pre-filled with the current name. Confirms via
the existing `updateDeck` action, passing the deck's current `palette`
through **unchanged** — this control only ever touches the name.

**Bottom tab bar.** Library / Settings. Settings tab routes to the
existing `/settings` route. Hidden entirely on the study viewer and card
editor screens (only `LibraryScreen`'s mobile branch renders it).

**Mobile header.** Stacked wordmark / eyebrow ("Your library · N decks") /
greeting, replacing desktop's row layout with avatar+help. No avatar or
account-menu entry point on mobile Library — see the Settings sign-out
addition (noted in the overview doc) for where account access moves
instead.

**View transition (shared with the study viewer spec).** Each deck row and
the corresponding card's front face (in the viewer) share
`view-transition-name: card-{deckId}`, so navigating between them morphs
the row into the full card rather than cutting. Mobile-only — desktop's
`DeckThumb` navigation is unchanged (plain `Link`, no shared-element
transition). This spec owns the row's half of the wiring; the study viewer
spec owns the card-face half — they must use the same id format.

## Acceptance Criteria
- [ ] At ≤768px, Library renders per the design doc's tokens/layout,
      except the two changes below
- [ ] "New deck" is inline (no modal): editable row + checkmark; nothing
      is created until confirm with a non-empty name; blur while editing
      cancels with no deck created; a failed create keeps the typed text
      and stays in edit state; confirming navigates directly into that
      deck's new-card editor
- [ ] New decks rotate through the 6 design-doc palettes based on what the
      user's existing decks already use, not a hardcoded default
- [ ] Per-row secondary button is inline rename (pencil icon, not `+`);
      the old quick-add-card-from-Library action no longer exists on
      mobile; rename uses the same inline-field rules as creation, and
      never changes the deck's palette
- [ ] Library → card navigation on mobile morphs via shared
      `view-transition-name`; desktop navigation is unchanged (no shared
      element, no morph)
- [ ] At >768px, `LibraryScreen` is visually and behaviorally unchanged
      from current production
- [ ] `npm test` and `npm run build` pass
