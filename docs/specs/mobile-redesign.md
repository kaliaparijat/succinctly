# Mobile Redesign

Source design: `design_handoff_succinctly/design_handoff_succinctly_mobile 2/README.md`
(design tokens, exact spacing/type/motion values, screenshots — treat as the
source of truth for anything visual; not duplicated here). Resolved
architectural/behavioral questions: `docs/specs/mobile-redesign-questions.md`.

## Problem
The current UI (`LibraryScreen`, `StudyViewer`, `CardEditor`) is desktop-first
and responsive-but-not-native-feeling on mobile. A high-fidelity mobile
redesign exists as an HTML prototype: full-bleed single-card screens for
study/edit, a flat tappable deck list for Library, and a bottom tab bar —
built to feel like a native iOS app rather than a shrunk desktop page.

## Scope
Three screens: **Library**, **Study viewer**, **Create/edit card**. Applies
**only at viewport ≤768px**. Auth and Settings are unchanged (Settings gets
one small addition, see below).

## Non-Goals
- No desktop visual or behavioral changes beyond the two explicitly listed
  in "Shared changes" below.
- No palette-change affordance on mobile (rename only — see Library section).
  Changing a deck's palette stays desktop-only, via existing `EditDeckModal`.
- No autosave in `CardEditor` — stays explicit-save on both breakpoints.
  Autosave is a deferred idea: `docs/ideas/autosave-card-editor.md`.
- No cleanup of abandoned/empty cards — matches existing behavior (nothing
  is created until an explicit save). Decks no longer need this: mobile
  deck creation now requires a confirmed name before the deck exists at all
  (see Library section), so there's no "abandoned untitled deck" case to
  clean up.

## Architecture: Breakpoint Strategy
`if breakpoint <= 768px render mobile UI else render desktop UI`, sharing
component state/logic wherever the behavior doesn't itself diverge. Per
component:

- **`LibraryScreen`** — shares data/props entirely. Two real logic forks:
  (1) the "new deck" action (open `NewDeckModal` vs. an inline editable row,
  see Library section below), and (2) the per-row secondary action (open
  `EditDeckModal` for rename+palette on desktop, vs. inline rename-only on
  mobile). Both mobile inline flows share one interaction pattern (editable
  text + checkmark-to-confirm) — build it as a single small shared piece
  (e.g. `InlineDeckNameField`) rather than duplicating the state machine for
  create vs. rename. Everything else is breakpoint-driven render choice
  (flat rows vs. thumbnail grid, bottom tab bar vs. none).
- **`StudyViewer`** — shares almost everything. `useSwipeGesture` gets
  *extended*, not forked: return `{ ref, dragX }` instead of just `ref`, so
  mobile can drive a live `translateX(dragX)` during the gesture while
  desktop's render simply ignores the new field. Double-click-to-edit-inline
  (`editingFace`/`contentEditable`/`updateCardInline`) stays wired up only
  above the breakpoint — no mobile equivalent exists in the design.
- **`CardEditor`** — fully shareable. Same explicit-save state machine
  (`useActionState`, `createCard`/`updateCard`) on both; only the rendered
  JSX (button position/style, presence of a bottom Q/A toggle vs. desktop's
  layout) differs.

## Shared Changes (apply to both desktop and mobile)
These two are the only approved changes to current desktop behavior:

1. **Flip duration → 380ms as the new "normal."** Applies to both
   `StudyViewer` (already respects the `flipSpeed` preference — update the
   `FLIP_MS` mapping) and `CardEditor` (currently hardcoded at 320ms,
   respects no preference at all today — wire it up to the same preference).
   Slow/fast scale proportionally to the same ratio as today:
   `{ slow: 570, normal: 380, fast: 190 }` (was `{ 480, 320, 160 }`).
2. **Fix the Chrome flip flicker.** Reported symptom: the underlying
   question/answer briefly shows before the flip completes. Leading
   hypothesis: neither the rotating wrapper (`transformStyle: 'preserve-3d'`
   div) nor the two `CardFace` elements have `will-change: transform`, so
   Chrome doesn't pre-promote a GPU compositing layer before the transition
   starts, causing a one-frame flash before `backface-visibility: hidden`
   takes effect. Add `will-change: transform` to the rotating wrapper and
   both faces in `StudyViewer`, and the equivalent flip wrapper in
   `CardEditor`. **Verify live in Chrome via devtools before considering
   this closed** — this is a hypothesis, not a confirmed root cause.

## Screen: Library (mobile, ≤768px)
Per the design doc's Screen 1 section for exact tokens/spacing, **except**
the two interaction changes below (superseding the original mockup, per
review on issue #7).

- Pinned dashed "New deck" row, always first in the scroll list.
- Deck rows: full width, tap opens the deck's first card
  (`navigateWithTransition`, `forward`).
- **New deck row — inline creation.** Tapping the row's `+` icon transitions
  the row itself into an editable text input (palette for the new deck is
  still picked via the existing rotation logic — reuse whatever
  `NewDeckModal` uses today — just not shown/chosen inline), with a
  checkmark CTA. The deck is **not created** until the checkmark is tapped
  with a non-empty (trimmed) name — `createDeck` fires at that point, then
  navigates to that deck's `/cards/new` (`navigateWithTransition`,
  `forward`). Tapping outside the row (blur) while editing cancels — reverts
  to the plain dashed row, no deck created, whatever was typed is discarded.
  Tapping the checkmark with an empty/whitespace-only name is a no-op (stays
  in edit state, doesn't submit).
- **Per-row secondary button — inline rename**, replacing the old
  quick-add-card affordance entirely (that action no longer exists on
  mobile Library). Icon changes from `+` to a pencil (matching the edit
  idiom already used elsewhere, e.g. `StudyViewer`'s edit button) to avoid
  implying "add" for what's now a rename action. Tapping it turns that row's
  title into an editable input pre-filled with the current name, using the
  same inline-field pattern and checkmark-to-confirm as new-deck creation
  above (same blur-cancels, empty-rejects rules). Confirms via the existing
  `updateDeck` action, passing the deck's current `palette` through
  unchanged — mobile inline-edit only ever touches the name, never the
  palette (see Non-Goals).
- Bottom tab bar: Library / Settings. Settings tab routes to the existing
  `/settings` route.
- No avatar/account-menu entry point on mobile Library (see Settings change
  below for where account access moves).
- **View transition:** each deck row and the corresponding card's front face
  (in the viewer) share `view-transition-name: card-{deckId}` so the
  transition morphs the row into the full card rather than cutting. This is
  a **mobile-only** interaction — desktop's `DeckThumb` navigation is
  unchanged (plain `Link`, no shared-element transition). Use the existing
  `navigateWithTransition(router, href, direction)` / `PathnameTracker`
  infrastructure from `lib/viewTransition.ts`.

## Screen: Study viewer (mobile, ≤768px)
Per design doc Screen 2. Behavior:
- Full-bleed card, no page chrome. Top bar: back button, deck name +
  index/total, edit-pencil button routing to that card's edit page.
- Swipe: live 1:1 drag-follow via extended `useSwipeGesture` (see
  Architecture above), springs back under the 60px commit threshold,
  commits and slides out at ∓100% over 220ms otherwise. Prev is a no-op at
  index 0; next becomes the palette-filled `+` button on the last card
  (already shared behavior with desktop, no change needed there).
- Landscape supported (viewer + editor only, not Library) — pure CSS/layout
  variant nested inside the mobile branch, no new state.
- No inline double-click-to-edit (desktop-only, see Architecture above).

## Screen: Create/edit card (mobile, ≤768px)
Per design doc Screen 3. Behavior:
- Same explicit-save model as desktop (see Architecture above) — "Save
  card"/"Save changes" button, not an "Auto-saved" indicator. On create,
  save navigates to the newly-created card (already existing desktop
  behavior via `navigateWithTransition`, `forward`); on edit, save navigates
  to the deck. Cancel behavior matches desktop's existing
  previousCardId-or-library logic.
- Q/A toggle: reuse `components/ui/QAToggle.tsx` as-is.
- Landscape supported, same as viewer.

## Settings (small addition, applies everywhere)
Add a sign-out action to the existing `SettingsScreen` (calls the existing
`signOut` server action from `app/actions/auth.ts`). This is **additive
only** — desktop's `AccountDropdown` keeps its own sign-out exactly as it is
today. This closes the gap where mobile has no avatar/dropdown and would
otherwise have no way to sign out.

## Acceptance Criteria
- [ ] At viewport ≤768px, Library/Study-viewer/Card-editor render the new
      mobile designs per the design handoff doc's tokens and layout specs
- [ ] At viewport >768px, all three screens are visually and behaviorally
      unchanged from current production, **except** the two shared changes
      (380ms flip default, will-change flicker fix)
- [ ] `useSwipeGesture` returns `{ ref, dragX }`; desktop callers compile
      and behave identically without reading `dragX`
- [ ] Library → card navigation on mobile morphs via shared
      `view-transition-name`; desktop navigation is unchanged (no shared
      element, no morph)
- [ ] Mobile "New deck" is inline (no modal): editable row + checkmark;
      nothing is created until confirm with a non-empty name; blur while
      editing cancels with no deck created; confirming navigates directly
      into that deck's new-card editor
- [ ] Mobile per-row secondary button is inline rename (pencil icon, not
      `+`); the old quick-add-card-from-Library action no longer exists on
      mobile; rename uses the same inline-field/blur-cancel/empty-reject
      rules as new-deck creation, and never changes the deck's palette
- [ ] `CardEditor` save/cancel behavior (including the newly-created-card
      navigation) is identical on both breakpoints — same server actions,
      same navigation calls, only different JSX
- [ ] Settings has a working sign-out button; `AccountDropdown`'s existing
      sign-out is untouched
- [ ] Flip duration is 380/570/190 (normal/slow/fast) on both `StudyViewer`
      and `CardEditor`, both respecting the `flipSpeed` preference
- [ ] No visible flash/flicker of the wrong face during a flip in Chrome
      (verified live, not just via code review)
- [ ] `npm test` and `npm run build` pass; new/changed behavior has test
      coverage per `docs/specs/test-coverage-plan.md`'s priority tiers

## Not Doing
- Autosave in `CardEditor` (see `docs/ideas/autosave-card-editor.md`)
- Palette change from mobile (rename only); empty-card cleanup on mobile
- Any change to Auth screens
- Any desktop visual change beyond the two shared changes listed above
