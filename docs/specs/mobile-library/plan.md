# Plan: mobile-library

Source spec: `docs/specs/mobile-library/mobile-library.md` (depends on `mobile-foundation.md`,
which is already complete — `useIsMobile` and the extended `useSwipeGesture`
both exist and match spec; not part of this plan).

## Resolved blockers (context, not tasks)

Two prior commits on this branch deleted things this spec depends on. Both
were resolved with the user on 2026-09-14/15 — restore, don't rebuild:

- `lib/viewTransition.ts` / `components/PathnameTracker.tsx` — deleted in
  `2a0a011`, needed by this spec's `navigateWithTransition` calls.
  `PathnameTracker` was authored but never mounted, so restoring it is new
  integration work (Task 0.2), not a pure revert.
- `design_handoff_succinctly/` (desktop README + full mobile subfolder incl.
  screenshots) — deleted in `bce9fe7`, cited by this spec as the source of
  truth for Screen 1 tokens/spacing.

Full detail: memory `project_mobile_foundation_deletions`.

## Dependency graph

```
0.1 restore design docs ─┐
0.2 restore viewTransition ┴─→ [checkpoint A: build+test green, nothing new yet]
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                      │
1.1 palette-cycling fn   1.2 inline-edit primitive    │
        │                     │                       │
        │        ┌────────────┴───────────┐           │
        ▼        ▼                        ▼           │
   2.1 mobile row list           3.1 inline create   4.1 inline rename
   (navigateWithTransition,      (needs 1.1 + 1.2     (needs 1.2 +
    view-transition-name)         + 2.1's row shell)   2.1's row shell)
        │                             │                    │
        └──────────────┬──────────────┴────────────────────┘
                        ▼
              [checkpoint B: both interactive flows working]
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        5.1 tab bar          5.2 mobile header
              │                   │
              └─────────┬─────────┘
                        ▼
              6.1 desktop-unchanged regression check
              6.2 full verification (test/build/live viewport)
                        ▼
              [checkpoint C: spec acceptance criteria all green]
```

2.1 comes before 3.1/4.1 because both interactive flows render *inside* a
deck row — building the read-only row shell first gives 3.1 and 4.1 a real
mount point instead of a stub. 1.1 and 1.2 are pulled out first because
they're pure/isolated (no LibraryScreen dependency) and both 3.1 and 4.1
need them — building them twice inside those tasks would duplicate the
inline-edit state machine, which the spec itself describes once and reuses.

## Phase 0 — Restore prerequisites

### Task 0.1 — Restore design handoff docs
**Do:** `git checkout main -- design_handoff_succinctly/README.md` and
`git checkout e56408c -- "design_handoff_succinctly_mobile 2/"`.
**Depends on:** nothing.
**Acceptance criteria:**
- `design_handoff_succinctly/README.md` and `design_handoff_succinctly_mobile 2/README.md` exist and are non-empty
- All 5 screenshots present under `design_handoff_succinctly_mobile 2/screens/`
**Verify:** `git status` shows only the intended restored paths; `ls` confirms files.

### Task 0.2 — Restore view-transition infra and mount it
**Do:** `git checkout e56408c -- lib/viewTransition.ts components/PathnameTracker.tsx`,
then mount `<PathnameTracker />` once in `app/layout.tsx` (inside `<body>`,
alongside `{children}` — it has no visual output, just calls `reportPathname`
on route change).
**Depends on:** nothing (parallel with 0.1).
**Acceptance criteria:**
- `lib/viewTransition.ts` exports `navigateWithTransition`; `PathnameTracker`
  is imported and rendered in `app/layout.tsx`
- No other file changes required to compile
**Verify:** `npm run build` succeeds; `npm test` still fully green (no
existing test should reference these files, so this should be a no-op for
the current suite — confirms the restore didn't collide with anything).

**Checkpoint A:** `npm test && npm run build` both pass with zero feature
code written yet. If either fails here, the failure is in the restore, not
in new work — fix before proceeding.

## Phase 1 — Isolated shared pieces

### Task 1.1 — Palette-cycling function
**Do:** Add a pure function (e.g. `nextPalette(usedPalettes: string[]): Palette`
in `lib/palette.ts`) over all 8 palettes in `PALETTES`' declaration order —
`[butter, sky, coral, mint, lilac, paper, terracotta, sage]` — returns the
first not present in `usedPalettes`, wrapping to the start once all 8 are
used. Same palette set desktop's `NewDeckModal`/`EditDeckModal` already
expose; no desktop code path is touched by this task.

**Resolved:** originally scoped to the design doc's 6-palette subset
(mockup predates `paper`/`terracotta` being added). Changed to all 8 per
user decision on 2026-09-17 — mobile should have the same palette
availability as desktop, not a subset the design just didn't know about
yet. Spec updated (`docs/specs/mobile-library/mobile-library.md`, "Palette selection").
**Depends on:** nothing.
**Acceptance criteria (spec):** "New decks rotate through all 8 palettes
in `lib/palette.ts` based on what the user's existing decks already use,
not a hardcoded default."
**Verify:** Unit tests — 0 existing decks → first palette in the list
(`butter`); some subset used → returns first unused one, in list order,
not input order; all 8 used → wraps to the first.

### Task 1.2 — Shared inline-editable-row primitive
**Do:** One hook or small component implementing the pattern the spec
describes identically for both create and rename: autofocused text input,
checkmark CTA, blur cancels (revert, discard typed text), empty/whitespace
submit is a no-op (stays in edit state), failed submit preserves typed text
and stays in edit state. Takes an `onConfirm(trimmedValue): Promise<void>`
callback so callers plug in `createDeck` or `updateDeck` without the
primitive knowing which.
**Depends on:** nothing.
**Acceptance criteria (spec, the shared parts of both):** blur-cancels;
empty-is-no-op; failure preserves text and stays in edit state; autofocus on
entry; checkmark confirms.
**Verify:** Component tests directly against the primitive (not yet wired to
real decks): type → blur → reverts, nothing submitted; type whitespace only
→ tap checkmark → stays in edit state, `onConfirm` not called; type valid →
tap checkmark → `onConfirm` called with trimmed value; make `onConfirm`
reject → input stays in edit state with the typed value still present.

## Phase 2 — Vertical slice: mobile row list + navigation

### Task 2.1 — Mobile deck-row list with view-transition navigation
**Do:** New mobile-only row component (replacing `DeckThumb` on the mobile
branch only) per Screen 1 tokens from the restored design doc. Fork
`LibraryScreen` on `useIsMobile()` to render a flat list of these rows
instead of the desktop grid. Tap → `navigateWithTransition(router, href,
'forward')`; each row carries `view-transition-name: card-{deckId}`.
Desktop's `DeckThumb`/grid path is untouched — confirm by reading the diff
before moving on, not just by not-editing-the-file.

**Question:** Does the view-trainsition navigation need to be a part of this plan? Considering that the mobile-study-viewer and mobile-card-editor plans are not yet built. What will this view-transition navigate to once you click on a deck? The desktop view?

**Answer:** Yes, it's in scope — the spec's "View transition" section
states this plan "owns the row's half of the wiring; the study viewer
spec owns the card-face half — they must use the same id format," and
`docs/specs/mobile-study-viewer.md` (already written, just not yet built)
independently specs the other half: the card's front face carries the
matching `view-transition-name: card-{deckId}`. So the id format is a
cross-spec contract already agreed on both sides — building the row's
half now doesn't block on the viewer half being implemented.

It navigates to the same place production navigates today — "the deck's
first card" (spec's Behavior section), via the existing `href`, same
route as the current desktop `Link`. Not "the desktop view": the route/
page rendered is whatever `StudyViewer` renders today (which already
forks on `useIsMobile` once mobile-foundation lands — separate from this
spec). `navigateWithTransition` only changes *how* the navigation is
animated, not *where* it goes.

Since `mobile-study-viewer` isn't built yet, the destination page won't
carry the matching `view-transition-name` for a while. That's harmless,
not broken: the View Transitions API only morphs when both the old and
new DOM snapshots have a matching name — if one side doesn't have it,
the browser just falls back to a normal navigation with no shared-element
morph. No crash, no visual bug, just no morph until the viewer spec is
implemented.

**Depends on:** 0.1 (tokens), 0.2 (`navigateWithTransition`).
**Acceptance criteria (spec):** "At ≤768px, Library renders per the design
doc's tokens/layout, except the two [interaction] changes below" (the two
exceptions are Phase 3/4, not yet built — at this point the row list is
otherwise complete); "Library → card navigation on mobile morphs via shared
`view-transition-name`; desktop navigation is unchanged (no shared element,
no morph)"; "At >768px, `LibraryScreen` is visually and behaviorally
unchanged."
**Verify:** Component test rendering `LibraryScreen` with `useIsMobile`
mocked true — asserts row list renders (not the grid), row has the expected
`view-transition-name` style keyed by deck id, tap triggers navigation.
Separate test with `useIsMobile` mocked false — asserts existing desktop
grid/`DeckThumb` still renders unchanged (regression guard, written now
rather than deferred to Phase 6 since this is the task that could break it).

**Checkpoint B (partial):** at this point mobile Library is browsable
(list + navigate) but has no way to create or rename a deck yet — expected,
not a bug; Phase 3/4 add those next.

## Phase 3 — Vertical slice: inline deck creation

### Task 3.1 — Pinned inline "new deck" row
**Do:** Dashed row, always first in the mobile list. Tapping `+` swaps it
into Task 1.2's primitive. `onConfirm` = call `createDeck` with the name and
`nextPalette()` (Task 1.1) computed from the current decks' palettes, then
`navigateWithTransition(router, '/decks/{id}/cards/new', 'forward')`.
**Depends on:** 1.1, 1.2, 2.1 (row shell/list to pin into).
**Acceptance criteria (spec):** the full "New deck row" behavior paragraph —
inline not modal; nothing created until non-empty confirm; blur cancels with
no deck created; failed create preserves typed text and stays in edit state;
confirm navigates directly into that deck's new-card editor.
**Verify:** Component test: tap `+` → input appears, focused; type name →
confirm → asserts `createDeck` called with trimmed name + correct next
palette, then navigation called with the new deck's `/cards/new` path;
separate test asserts palette choice reflects Task 1.1 given a fixture set
of existing decks; blur-without-confirm test asserts `createDeck` was never
called; mock `createDeck` to reject → asserts row stays in edit state with
text intact.

## Phase 4 — Vertical slice: inline rename

### Task 4.1 — Per-row inline rename
**Do:** Replace the old quick-add-card per-row button with a pencil icon
that swaps that row's title into Task 1.2's primitive, pre-filled with the
current name. `onConfirm` = call `updateDeck` with the deck's `id`, trimmed
new title, and its **existing** `palette` unchanged.
**Depends on:** 1.2, 2.1.
**Acceptance criteria (spec):** pencil icon (not `+`); old quick-add action
no longer exists on mobile at all; same inline-field rules as creation;
never changes the deck's palette.
**Verify:** Component test: tap pencil → input pre-filled with current
title, focused; confirm new name → asserts `updateDeck` called with the
deck's original `palette` value unchanged; grep/assert the old quick-add
handler/button is not present in the mobile row's rendered output; blur and
empty-submit and failure-preserves-text cases mirrored from 3.1's tests
against rename instead of create.

**Checkpoint B:** both interactive flows (create, rename) done and tested.
This is the point to manually click through the flow in a real mobile
viewport before moving to chrome — the two riskiest, most stateful pieces
of the spec are now complete.

## Phase 5 — Chrome: tab bar + header

### Task 5.1 — Bottom tab bar
**Do:** Library / Settings tab bar, rendered only from `LibraryScreen`'s
mobile branch. Settings tab routes to `/settings`. Not rendered from any
other screen (study viewer, card editor untouched — out of scope for this
spec, but don't accidentally add a shared layout-level mount).
**Depends on:** 2.1 (needs the mobile branch to exist).
**Acceptance criteria (spec):** tab bar present with Library/Settings;
"Hidden entirely on the study viewer and card editor screens (only
`LibraryScreen`'s mobile branch renders it)."
**Verify:** Component test on `LibraryScreen` mobile branch asserts tab bar
present with a working Settings link; grep confirms no other component
imports/renders it.

### Task 5.2 — Mobile header
**Do:** Stacked wordmark / eyebrow ("Your library · N decks") / greeting,
replacing desktop's avatar+help row on the mobile branch only. No
avatar/account-menu entry point on mobile.
**Depends on:** 2.1.
**Acceptance criteria (spec):** header per design doc; "No avatar or
account-menu entry point on mobile Library."
**Verify:** Component test asserts the eyebrow text reflects deck count
(including the singular/plural case from the existing desktop copy pattern)
and that no avatar/`AccountDropdown` trigger renders on the mobile branch.

## Phase 6 — Regression + final verification

### Task 6.1 — Desktop-unchanged regression pass
**Do:** No code change expected — this task is verification. Read the full
diff of `components/library/LibraryScreen.tsx` against its pre-Phase-2
version and confirm the desktop branch (`DeckThumb`, `NewDeckModal`,
`EditDeckModal`, `AccountDropdown`) is byte-for-byte behaviorally identical,
only reachable through an `if (!isMobile)`-shaped fork.
**Depends on:** 2.1, 3.1, 4.1, 5.1, 5.2 (everything that touched
`LibraryScreen`).
**Acceptance criteria (spec):** "At >768px, `LibraryScreen` is visually and
behaviorally unchanged from current production."
**Verify:** Existing desktop-path tests from 2.1 still pass; manual
diff read confirms no incidental changes to desktop JSX/props/handlers.

### Task 6.2 — Full verification
**Do:** Run the full suite; check live in a mobile viewport against the
restored `01-library.png` screenshot for visual fidelity (per this
project's mobile-first testing rule in `CLAUDE.md`).
**Depends on:** all prior tasks.
**Acceptance criteria (spec):** "`npm test` and `npm run build` pass" (the
spec's final bullet, and the umbrella for every other bullet above).
**Verify:** `npm test`, `npm run build`, devtools/manual check at a
≤767px viewport against the screenshot.

**Checkpoint C:** every acceptance-criteria bullet in `docs/specs/mobile-library/mobile-library.md`
is checked off. Ready for PR.
