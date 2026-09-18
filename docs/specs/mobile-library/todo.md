# To-do: mobile-library

Full detail/rationale/verification steps: `tasks/plan.md`.
Spec: `docs/specs/mobile-library/mobile-library.md`.

## Phase 0 — Prerequisites
- [x] 0.1 Restore `design_handoff_succinctly/` (desktop README + mobile subfolder + screenshots)
- [x] 0.2 Restore `lib/viewTransition.ts` + `components/PathnameTracker.tsx`; mount `PathnameTracker` in `app/layout.tsx`

**Checkpoint A** — `npm test && npm run build` green, no feature code yet

## Phase 1 — Isolated shared pieces
- [x] 1.1 `nextPalette()` cycling function in `lib/palette.ts` + unit tests
- [x] 1.2 Shared inline-editable-row primitive (autofocus/checkmark/blur-cancel/empty-no-op/preserve-on-failure) + tests

## Phase 2 — Mobile row list + navigation
- [x] 2.1 Mobile deck-row list, `useIsMobile` fork in `LibraryScreen`, `navigateWithTransition` + `view-transition-name: card-{deckId}` per row, desktop-path regression test

## Phase 3 — Inline deck creation
- [x] 3.1 Pinned dashed new-deck row using 1.1 + 1.2 + `createDeck`, navigates into `/cards/new`

## Phase 4 — Inline rename
- [x] 4.1 Per-row pencil → rename using 1.2 + `updateDeck` (palette unchanged); confirm old quick-add-card button is gone

**Checkpoint B** — both interactive flows done; manual click-through on a real mobile viewport

## Phase 5 — Chrome
- [x] 5.1 Bottom tab bar (Library/Settings), mobile-branch-only
- [x] 5.2 Mobile header (stacked wordmark/eyebrow/greeting, no avatar)

## Phase 6 — Regression + verification
- [x] 6.1 Desktop-unchanged diff review of `LibraryScreen.tsx`
- [x] 6.2 `npm test`, `npm run build`, live mobile-viewport check vs. `01-library.png`

**Checkpoint C** — every AC in `docs/specs/mobile-library/mobile-library.md` checked off, ready for PR
