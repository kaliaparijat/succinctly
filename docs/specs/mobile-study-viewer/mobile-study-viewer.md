# Mobile Redesign: Study Viewer

Part of the mobile redesign — see `docs/specs/mobile-redesign.md` for the
overview. Depends on `docs/specs/mobile-foundation.md`'s breakpoint hook
and `useSwipeGesture` extension. Decision history:
`docs/specs/mobile-redesign-questions.md`.

## Problem
`StudyViewer` today is desktop-chrome-first: a top bar with a progress
rail, arrow-button navigation, and (desktop-only) a double-click-to-edit
mechanism. The mobile design wants a full-bleed card with no page chrome,
touch swipe navigation, and the *same* editing capability reached by
tapping an edit button instead of double-clicking.

## Scope
`StudyViewer` at ≤768px, **including how mobile reaches editing** — there
is no separate mobile "edit screen." Per design doc Screen 2 for exact
tokens/spacing.

## Behavior

**Top bar (mobile).** Back button, deck name + index/total (two-line
label), and an edit-pencil button. No help/"?" button — not part of the
mobile design.

**Editing is not a new route — it's the existing inline-edit subsystem,
retargeted.** `StudyViewer` already has a full inline-edit mechanism for
desktop: double-click a card enters `editingFace` state, the card becomes
`contentEditable`, and `updateCardInline` persists it. This was previously
desktop-only; **it becomes shared** between breakpoints. The trigger
differs: desktop keeps double-click, mobile's edit-pencil button enters
the same state. Nothing else about the mechanism changes — same state,
same save behavior, same everything else. Mobile does **not** also wire up
a double-tap trigger (pencil-only), to avoid competing with the browser's
native double-tap-to-zoom gesture.

**Swipe.** Live 1:1 drag-follow: the card translates with the finger
during the gesture (via the foundation spec's extended `useSwipeGesture`).
Releasing under the 60px commit threshold springs back to center;
releasing over it commits and slides the card out at ∓100% over 220ms,
then swaps in the next/previous card — reusing the existing commit path
(`dir`/`goNext`/`goPrev`), not a new animation system. Prev is a no-op at
index 0; next becomes the palette-filled `+` button on the last card
(already shared behavior with desktop — no change needed there).

**Flip-hint pill wording.** The existing in-card hint pill
(`showHint`/`hintsEnabled`) needs breakpoint-aware text: "Space to flip"
on desktop, "Tap to flip" on mobile — since the interaction itself differs
by input modality.

**View transition (shared with the Library spec).** The card's **front
face only** carries `view-transition-name: card-{deckId}`, matching what
the Library spec's deck row carries — confirm the back face never carries
this name (structurally already true since front/back are separate
elements; just verify the id is threaded to the right one).

**Landscape.** Supported here (and in the card editor), not in Library.
Pure CSS/layout variant nested inside the mobile branch — no new state.
Not meaningfully testable via component tests (no real CSS layout in
jsdom); verify via a manual/devtools viewport-orientation check.

## Acceptance Criteria
- [ ] At ≤768px, the viewer renders per the design doc's tokens/layout
- [ ] Tapping the edit-pencil button enters the same `editingFace` state
      double-click enters on desktop — same save behavior
      (`updateCardInline`), no new route, no new component
- [ ] Mobile has no double-tap-to-edit trigger; desktop's double-click
      trigger is unchanged
- [ ] Swipe drags the card 1:1 with the finger; releases under 60px spring
      back to center; releases over 60px commit and slide out at ∓100%
      over 220ms
- [ ] Flip-hint pill reads "Tap to flip" on mobile, "Space to flip" on
      desktop
- [ ] Library → card navigation morphs via `view-transition-name:
      card-{deckId}` shared with the corresponding Library row; the back
      face never carries this name
- [ ] Landscape orientation is supported with tighter chrome per design
      tokens (manual/devtools-verified, not unit-tested)
- [ ] At >768px, `StudyViewer` is visually and behaviorally unchanged from
      current production, including the double-click-to-edit trigger
- [ ] `npm test` and `npm run build` pass

## Not Doing
- A dedicated edit-card route or screen for mobile (explicitly rejected —
  see Behavior above)
- Any change to how editing is *saved* (still `updateCardInline`,
  unchanged) — this spec only changes how editing is *entered* on mobile
