# Plan: mobile-card-editor

Source spec: `docs/specs/mobile-card-editor/mobile-card-editor.md` (depends on
`mobile-foundation.md` — already merged). Design tokens:
`design_handoff_succinctly/design_handoff_succinctly_mobile 2/README.md`,
"3. Create / edit card" section.

## Context

`CardEditor` today is one monolithic desktop-shaped component: `CreateBar`
top bar (Save lives in the page footer, next to Cancel), a flip card with
two textareas, a footer with Cancel/Save. This spec gives it a mobile
branch at ≤768px — **create mode only**. Mirrors the
`StudyViewer`/`DesktopStudyViewer`/`MobileStudyViewer` split already landed
for the study-viewer spec: one thin parent owns state, two presentational
children fully split.

**Added scope (user request, 2026-10-02):** `CardEditor` also has an
`isEdit` branch (triggered by passing a `card` prop) that has never been
reachable in production — only `/decks/[id]/cards/new/page.tsx` mounts
`CardEditor`, and it never passes `card`. It was presumably scaffolded for
a future edit route that never shipped; now that `mobile-study-viewer.md`
has landed the real edit mechanism (inline `contentEditable` via the
pencil button, `updateCardInline`), there is no remaining reason to keep
it. Phase 0 below removes it before the split, so `DesktopCardEditor`
doesn't inherit dead branches it would otherwise have to carry forward.

## Two decisions needing explicit sign-off before Phase 2

The design doc's Screen 3 section only shows **one** control in the mobile
top bar besides Save — a single 34×34 back-chevron. There's no second
"Cancel" button anywhere in the mockup, and no footer row at all beyond the
Q/A toggle (which sits on the card itself, not the page). Two gaps that
follow from that, neither spelled out in the `.md` spec's Behavior section:

1. **What does the back-chevron actually do?** Desktop has two independent
   back-actions today: `CreateBar`'s header arrow is a plain `Link` to
   `/decks/{deckId}` (redirects to the deck's first card, or — if the deck
   has zero cards — right back into `/cards/new`); the footer's Cancel
   button instead runs `previousCardId ? push(previous card) : push('/library')`.
   Reusing the header arrow's `/decks/{deckId}` target on mobile would
   **loop**: creating a brand-new deck's first card and tapping back would
   bounce straight back into this same `/cards/new` screen. Proposed
   resolution: the mobile back-chevron runs the **same handler as
   desktop's Cancel button** (previousCardId-or-`/library`), not desktop's
   header-arrow target. This is a behavior choice, not just a style
   choice — flagging rather than assuming.
2. **Where does the error message go on mobile?** `state?.error` exists
   today only as inline text next to desktop's footer Cancel/Save buttons.
   The design doc has no error-state treatment at all (prototype only
   modeled the happy path). Proposed resolution: small centered text
   directly below the card, above the Q/A toggle, shown only when
   `state?.error` is set — reuses the existing value, adds no new state.

Also confirmed explicitly **not** building: the design doc's "Auto-saved"
indicator (bottom-center dot + text). `mobile-card-editor.md`'s own
Non-Goals section already rejects this — the mockup showing it alongside a
"Save" pill at once was a sign its own first draft hadn't settled on
autosave vs. explicit-save. Noted here only so Phase 3 doesn't
reintroduce it by copying the design doc literally.

## Dependency graph

```
0.1 Remove CardEditor's dead isEdit branch (cleanup, not mobile work)
        │
        ▼
1.1 Save navigation → navigateWithTransition (both breakpoints, pre-split)
    (operates on 0.1's now-create-only save handler)
        │
        ▼
1.2 Extract DesktopCardEditor; lift state into thin CardEditor parent
    (pure refactor, isMobile fork added, always renders Desktop for now)
        │
        ▼
[checkpoint A: dead-code removal + pure refactor + shared nav change
 all verified, zero new mobile code yet]
        │
        ▼
2.1 MobileCreateBar + MobileCardEditor skeleton
    (back-chevron = Cancel logic, per decision #1; Save pill wired
     to formRef.requestSubmit(); own card/CardFace markup, Tab-to-flip
     retained)
        │
        ▼
[checkpoint B: create → save → lands on new card; create → cancel →
 correct target — click through manually before cosmetics]
        │
        ▼
3.1 Mobile card body: Screen 3 portrait tokens, "Draft" face-header
    label, error-message placement per decision #2, explicitly no
    Auto-saved indicator
        │
        ▼
4.1 Landscape token variant (extends 3.1)
        │
        ▼
[checkpoint C: all AC bullets implemented]
        │
        ▼
5.1 Desktop-unchanged regression review
5.2 Full verification (test/build, live viewport incl. screenshots)
        │
        ▼
[checkpoint D: spec acceptance criteria all green]
```

0.1 → 1.1 → 1.2 is a straight sequential chain rather than the
parallel-branch shape the other two specs' plans used for their first two
tasks — 0.1 and 1.1 both touch the exact same few lines (the
`useActionState` save-handler callback: 0.1 strips its `isEdit` branch,
1.1 then swaps that now-single-path callback's navigation call), so doing
them in either order risks a confusing edit-on-top-of-an-edit; doing 0.1
first means 1.1 lands on the already-simplified function. 1.2 then extracts
that simplified, nav-updated parent. All three land before any mobile-only
code exists, so a regression at checkpoint A is unambiguously one of these
three, not a mobile feature. 2.1 (interaction skeleton: save/cancel
actually work) comes before 3.1/4.1 (pure cosmetics) — risk-first, same
ordering principle as the other two specs' plans.

## Phase 0 — Cleanup (not mobile work, but doing it first simplifies everything after)

### Task 0.1 — Remove `CardEditor`'s dead `isEdit` branch
**Do:** Remove the `card` prop, the `isEdit` boolean, and every
conditional it drives: the hidden `id` field, the "Save changes"/"Edit
card" label branches (`CreateBar`'s `label` prop simply stops being
passed — its existing `'New card'` default takes over; `CreateBar` itself
is untouched), and the `updateCard` branch in the `useActionState`
callback (`CardEditor` now only ever calls `createCard`). Remove the now-
fully-unused `updateCard` export from `app/actions/cards.ts` (confirmed:
`CardEditor.tsx` was its only caller — `updateCardInline`, the mechanism
`StudyViewer`'s real inline-edit uses, is a separate function and is
untouched). Remove `__tests__/CardEditor.test.tsx`'s "CardEditor — edit
mode" `describe` block (3 tests), which exercised only this dead path.
**Depends on:** nothing.
**Acceptance criteria:** not an AC bullet in `mobile-card-editor.md` —
user-requested cleanup, confirming the spec's own Problem-section claim
("CardEditor's `isEdit` branch isn't reachable in production today") by
actually deleting the unreachable code now that `mobile-study-viewer.md`
supplies the real edit mechanism.
**Verify:** `grep -rn "isEdit\|updateCard\b" components/cards/CardEditor.tsx app/actions/cards.ts`
returns nothing (note the word-boundary — `updateCardInline` must still be
there, just not bare `updateCard`); remaining `__tests__/CardEditor.test.tsx`
create-mode suite passes; `npm run build`.

## Phase 1 — Foundation: shared fix + extract, then branch

### Task 1.1 — Save navigation via `navigateWithTransition`
**Do:** In `CardEditor`'s (now create-only) save path, replace
`router.push(`/decks/${deck.id}/cards/${newCard.id}`)` with
`navigateWithTransition(router, `/decks/${deck.id}/cards/${newCard.id}`, 'forward')`.
Applies identically on both breakpoints — no fork, no mobile-only
conditional.
**Depends on:** 0.1 (operates on the simplified, single-path save
callback 0.1 leaves behind — avoids editing a branch that's about to be
deleted).
**Acceptance criteria (spec):** "save navigates to the newly-created card
(`navigateWithTransition`, `forward`)."
**Verify:** jsdom has no `document.startViewTransition`, so
`navigateWithTransition` falls back to a plain `router.push(href)` —
`__tests__/CardEditor.test.tsx`'s existing "navigates to the new card URL
after successful save" test (which mocks `useRouter().push`) should pass
**unmodified**, proving the swap is behaviorally invisible under test while
real Chrome gets the transition.

### Task 1.2 — Extract `DesktopCardEditor`; lift state into a thin `CardEditor` parent
**Do:** Create `components/cards/DesktopCardEditor.tsx` containing today's
entire render tree (`CreateBar`, the flip card + both faces, the footer)
as a presentational component, reading `face`, refs, `state`/`formAction`/
`pending`, and handlers (`handleKeyDown`, the cancel click, `setFace`) as
props. Rewrite `components/cards/CardEditor.tsx` to own all of that
state/those handlers (identical logic, relocated — including Task 1.1's
`navigateWithTransition` save call) and render
`<DesktopCardEditor ...props />` unconditionally — no `isMobile` check yet.
**Depends on:** 1.1.
**Acceptance criteria:** not an AC bullet itself — the structural
prerequisite that makes "At >768px, unchanged from current production"
verifiable by inspection, same role Task 1.2 played in the study-viewer
plan.
**Verify:** Full existing `__tests__/CardEditor.test.tsx` suite passes
unmodified. `npm run build`.

**Checkpoint A:** `npm test && npm run build` green with the dead code
gone, the nav swap, and the extraction all in place, no mobile-only code
written yet. A failure here is one of these three, not a mobile feature.

## Phase 2 — Mobile skeleton (interaction-first)

### Task 2.1 — `MobileCreateBar` + `MobileCardEditor` skeleton
**Do:**
- In `components/layout/TopBar.tsx`, add `MobileCreateBar` alongside the
  existing `LibraryBar`/`ViewerBar`/`MobileViewerBar`/`CreateBar`/
  `SettingsBar` variants. Props:
  `{ deckName: string; label: string; onBack: () => void; onSave: () => void; saving: boolean }`.
  Renders: 34×34 circular back-chevron button (`onClick={onBack}` — **not**
  a `Link`, per decision #1 above, since the target isn't a static href),
  centered single-line label (`"{deckName} · {label}"`, sans 12px
  `textMuted`), and a "Save" pill on the right (`padding: 7px 14px`,
  `border-radius:999px`, background `text` / color `bg`, sans 12px weight
  500, `onClick={onSave}`, `disabled={saving}`).
- Create `components/cards/MobileCardEditor.tsx`: its own render tree using
  `MobileCreateBar`, its own copy of the flip card + `CardFace` markup
  (ported from `DesktopCardEditor`'s shape, not imported — same
  "duplicate for readability" choice the study-viewer split made). Same
  props shape as `DesktopCardEditor` minus the footer's Cancel/Save
  buttons (moved into the top bar) plus `onBack`/`onSave` wired per
  decision #1: `onBack` = the existing previousCardId-or-`/library` logic;
  `onSave` = `formRef.current?.requestSubmit()` (same mechanism the `.md`
  spec names explicitly, not a second submit path). Tab-to-flip
  (`handleKeyDown` on the textareas) is retained unchanged — it's an
  existing keyboard affordance, not a mouse/touch one, so nothing about
  going mobile removes it.
- `CardEditor` parent computes `const isMobile = useIsMobile()` and renders
  `isMobile ? <MobileCardEditor ...props /> : <DesktopCardEditor ...props />`.
**Depends on:** 0.1, 1.1, 1.2.
**Acceptance criteria (spec):** "the create-card screen renders... with the
Save pill in the top bar"; "Save/cancel behavior (including
newly-created-card navigation) is identical on both breakpoints — same
server action, same navigation call, only different JSX and button
placement."
**Verify:** New tests in `__tests__/CardEditor.test.tsx`, mocking
`@/hooks/useIsMobile` true (pattern from `__tests__/StudyViewer.test.tsx`).
Assert: the mobile Save pill renders and clicking it submits the form
(mocked `createCard` called, then `navigateWithTransition`/`router.push`
to the new card URL — same assertion shape as the existing desktop save
test); the mobile back-chevron, when `previousCardId` is set, pushes to
that card, and when omitted/null, pushes to `/library` — mirroring the
existing desktop "Cancel navigation" test suite exactly, just through the
mobile component. Mocked `false`: existing desktop tests continue to pass
unmodified (regression guard).

**Checkpoint B:** manually create a card on a real mobile viewport —
confirm Save lands on the new card and Cancel (via the back-chevron) goes
to the right place in both the "deck already has cards" and "brand-new
empty deck" cases (the second is exactly the loop decision #1 exists to
avoid) — before moving to Phase 3's cosmetics.

## Phase 3 — Mobile card body

### Task 3.1 — Screen 3 portrait tokens
**Do:** In `MobileCardEditor.tsx`, apply the design doc's Screen 3 tokens
directly (no conditional — mobile-only file): face header right-hand label
reads **"Draft"** instead of `deck.title` (both faces); body is a
borderless transparent `<textarea>`, display 26px, `line-height:1.3`,
`letter-spacing:-0.3`, centered, body padding `10px 26px`; placeholders
"What's the question?" / "Write the answer…" (already the desktop copy —
unchanged). Error message (decision #2): small centered text below the
card, above the `QAToggle`, rendered only when `state?.error` is set.
`QAToggle` itself is reused with zero changes, per the `.md` spec's Card
body bullet. Do **not** add the design doc's "Auto-saved" indicator — see
Context above.
**Depends on:** 2.1.
**Acceptance criteria (spec):** "the create-card screen renders per the
design doc's tokens/layout."
**Verify:** Component test asserts `MobileCardEditor` renders "Draft" (not
the deck title) on both faces; renders the error text when `state.error`
is set and omits it when not. No new interaction logic — layout fidelity
itself is verified visually in Task 5.2 against `04-editor-portrait.png`.

## Phase 4 — Landscape

### Task 4.1 — Landscape orientation variant
**Do:** In `MobileCardEditor.tsx`, add `landscape:` Tailwind variant
classes alongside Task 3.1's portrait values: body padding
`landscape:py-1 landscape:px-10` (4px/40px per the design doc), body
font-size `landscape:text-[22px]`. Pure CSS, no new state — same approach
as `mobile-study-viewer`'s landscape task.
**Depends on:** 3.1.
**Acceptance criteria (spec):** "Landscape orientation supported per design
tokens (manual/devtools-verified)."
**Verify:** No unit test — explicitly manual per spec. Chrome DevTools MCP:
emulate landscape, navigate to `/cards/new` on a deck, confirm tighter
padding and 22px body text against the written tokens, cross-checked
against `05-editor-landscape.png`.

**Checkpoint C:** every AC bullet in `mobile-card-editor.md` implemented.

## Phase 5 — Regression + final verification

### Task 5.1 — Desktop-unchanged regression review
**Do:** No code change expected — verification only. Confirm
`DesktopCardEditor.tsx` is behaviorally equivalent to the pre-Phase-1
`CardEditor.tsx` (state now arrives via props, not a literal text diff —
same honesty note as the study-viewer plan). Confirm `MobileCardEditor.tsx`
and `MobileCreateBar` are never imported anywhere `DesktopCardEditor` is
used. Confirm `CreateBar` in `TopBar.tsx` has zero line changes
(`git diff --stat`).
**Depends on:** 0.1, 1.1, 1.2, 2.1, 3.1, 4.1.
**Acceptance criteria (spec):** "At >768px, `CardEditor` is visually and
behaviorally unchanged from current production."
**Verify:** Full `__tests__/CardEditor.test.tsx` desktop-path suite green;
`git diff --stat` showing `CreateBar`'s export unchanged.

### Task 5.2 — Full verification
**Do:** Run the full suite; check live in a mobile viewport against
`04-editor-portrait.png`; landscape against `05-editor-landscape.png`.
**Depends on:** all prior tasks.
**Acceptance criteria (spec):** "`npm test` and `npm run build` pass" — the
umbrella bullet, plus every other AC bullet should now be individually
satisfied by a task above.
**Verify:** `npm test`, `npm run build`, devtools/manual check at a
≤767px viewport (portrait) against the screenshot; devtools resize to
landscape against the other screenshot.

**Checkpoint D:** every acceptance-criteria bullet in
`docs/specs/mobile-card-editor/mobile-card-editor.md` is checked off. Ready
for PR.
