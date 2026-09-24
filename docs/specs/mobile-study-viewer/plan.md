# Plan: mobile-study-viewer

Source spec: `docs/specs/mobile-study-viewer/mobile-study-viewer.md` (depends on
`mobile-foundation.md` and shares a cross-spec contract with `mobile-library.md` — both already
merged). Design tokens: `design_handoff_succinctly/design_handoff_succinctly_mobile 2/README.md`,
"Study viewer" section.

## Context

`StudyViewer` today is desktop-chrome-first: a top bar with a progress rail, arrow-button
navigation, and a desktop-only double-click-to-edit mechanism. This spec retargets it to also work
at ≤768px as a full-bleed card with no page chrome, touch swipe, and the *same* editing capability
reached via a pencil button instead of double-click. It also closes a real cross-spec dependency:
`mobile-library`'s deck rows already carry `view-transition-name: card-{deckId}` for a
Library→card morph that currently degrades to a plain navigation because the card face doesn't
carry the matching name yet — this spec supplies that other half.

## Cross-spec contract (confirmed, not assumed)

`components/library/MobileDeckRow.tsx` already sets `viewTransitionName: card-${id}` where `id` is
the *deck's* id (passed from `MobileLibraryScreen` as `id={deck.id}`). `StudyViewer` has `deck.id`
in scope, so `card-${deck.id}` on the front face is byte-for-byte the same key — no coordination
gap.

## Architecture decision: state stays in one parent; rendering fully splits into two components

**Revised 2026-09-23 per direct feedback on the first draft** (originally proposed one shared
component with inline `isMobile` conditionals scattered through it — rejected as too conditional
and hard to read).

`StudyViewer` (the component's existing public name, unchanged API: `deck`, `cards`,
`initialCardId?`, `tiltEnabled`, `flipDuration`, `hintsEnabled`) becomes a thin container that owns
**all** state and handlers — `idx`, `flipped`, `dir`, `editingFace`, `editRef`, `clickTimer`,
`helpOpen`, the `useRouter()`/`useKeyboardShortcuts`/`useSwipeGesture` hook calls, and every handler
function (`flip`, `goNext`, `goPrev`, `handleClick`, `enterEdit`/`handleDoubleClick`,
`handleEditSave`, `handleEditKeyDown`, `handleToggleFace`) — then renders exactly one of two fully
independent, fully self-contained presentational components, chosen once by `isMobile`:

- **`DesktopStudyViewer`** (new file) — the entirety of today's render tree (top bar via
  `ViewerBar`, the flip/slide card wrapper, both `CardFace`s, the desktop footer) moved here,
  reading its inputs from props instead of local `useState`/handlers it used to own directly.
- **`MobileStudyViewer`** (new file) — an independent render tree built for the mobile design:
  `MobileViewerBar`, its own copy of the flip/slide card wrapper and `CardFace` markup (yes,
  duplicated — chosen deliberately over sharing a `CardStage`/`CardFace` sub-component, to keep
  each variant fully readable top-to-bottom without cross-file conditional logic bleeding through
  shared internals), mobile-only interaction wiring (swipe drag-follow, pencil edit-entry,
  mobile slide-commit constants, `view-transition-name`, mobile paddings/sizes, landscape
  variants).

This mirrors how `mobile-library`'s `LibraryScreen` was split into `DesktopLibraryScreen`/
`MobileLibraryScreen` (per that spec's own PR review) — parent owns/branches, children are pure
render — with one honest difference worth flagging up front: `DesktopLibraryScreen` was a literal
byte-for-byte text copy of the original file, because Library's state was already fully
self-contained within that one component. Here, state is being *lifted* out of the component into
a new parent, so `DesktopStudyViewer.tsx` will **not** be byte-identical text to today's
`StudyViewer.tsx` — it's the same logic reading from props instead of local hooks. Task 5.1's
verification is written accordingly: behavioral equivalence confirmed by careful reading and the
existing/new desktop-path tests, not a literal text diff.

Each mobile-specific piece (hint text, `view-transition-name`, slide constants, edit-entry trigger)
lives directly and unconditionally inside `MobileStudyViewer.tsx` — since the whole file only ever
renders when `isMobile` is true, none of these need an `isMobile ? ... : ...` ternary at all
(a nice side effect of the full split: several tasks that would have needed a runtime conditional
now just need the mobile-only value hardcoded directly in the mobile-only file).

## Resolved decisions (user sign-off obtained 2026-09-23)

1. **`flipDuration` default 320 → 380.** `StudyViewer.tsx`'s current prop default never got
   updated when `mobile-foundation` landed `lib/flipSpeed.ts`'s `FLIP_MS.normal = 380` and
   `CardEditor.tsx`'s matching default. Dead in production (routes always pass an explicit value
   via `resolveFlipDuration`), but a real leftover — fixed here since this plan is already
   touching the file. Lives on the new parent's `Props` default.
2. **Back button uses `navigateWithTransition(router, '/library', 'back')`**, not a plain `Link`.
   The design doc's Interactions section: *"morphs the deck row into the full card (**and shrinks
   back on return**)"* — the shrink-back morph needs the `'back'` direction `lib/viewTransition.ts`
   already supports.
3. **Mobile gets its own ∓100%/220ms (110ms setTimeout half-point) slide-commit constants,
   independent of desktop's existing ∓110%/280ms/140ms** — not a replacement, and with the full
   component split each variant simply hardcodes its own constants locally rather than threading a
   computed value through props. The spec's own AC has two bullets jointly unsatisfiable under a
   shared-constant reading: "slide out at ∓100% over 220ms" vs. "desktop unchanged from current
   production" (which is ∓110%/280ms today).
4. **Sub-60px spring-back gets a real eased transition** (chosen over an instant snap): extend
   `useSwipeGesture` with a small `isDragging` boolean so `MobileStudyViewer` can suppress the
   transition during live drag-follow and apply a short eased snap (~200ms, existing
   `cubic-bezier(0.4,0,0.2,1)` curve) on sub-threshold release — additive to the hook, same
   non-breaking pattern as how `dragX` was added by `mobile-foundation`. The hook call itself still
   lives in the parent (`StudyViewer`); `dragX`/`isDragging`/`swipeRef` are passed down to
   `MobileStudyViewer` only.
5. **Hint-pill: text-only change** (chosen over also narrowing visibility) — `MobileStudyViewer`
   hardcodes "Tap to flip", `DesktopStudyViewer` keeps "Space to flip"; visibility stays exactly as
   today (every card, both faces) on both. The design doc's "first card, front face only" phrasing
   is treated as prototype flavor text, not an AC requirement — the `.md` spec's own AC only asks
   for the text swap.
6. **Bottom-row "swipe or tap to flip"/"last card" text: out of scope** (chosen over adding it) —
   exists only in the design doc, never mentioned in the `.md` spec's Behavior or AC sections.
7. **Mobile circular buttons sized to the design doc's exact tokens** (34px top bar / 40px bottom
   row), chosen over reusing desktop's 44px (`w-11 h-11`) — desktop stays untouched either way,
   since it's a separate file now.

## Dependency graph

```
1.1 flipDuration default → parent's Props ──────────────────────────────────┐
                                                                              │
1.2 Extract DesktopStudyViewer                                              │
    (state/handlers lift to a new StudyViewer parent;                       │
     DesktopStudyViewer renders today's tree from props;                     │
     parent always renders it — no isMobile branch yet)                      │
        │                                                                    │
        ▼                                                                    │
[mini-checkpoint: pure refactor verified behaviorally                        │
 identical BEFORE any mobile code exists]                                    │
        │                                                                    │
        ▼                                                                    │
1.3 MobileViewerBar (TopBar.tsx) + MobileStudyViewer skeleton                │
    (own top bar, own card/CardFace markup, stub pencil onClick,             │
     parent now does isMobile ? <MobileStudyViewer/> : <DesktopStudyViewer/>)│
        │                                                                    │
        ├────────────────┬─────────────────────────┐                        │
        ▼                 ▼                         │                        │
2.1 edit-entry       2.2 swipe drag-follow +        │                        │
    retargeting          mobile commit consts        │                        │
    (pencil → real        (∓100%/220ms/110ms         │                        │
     enterEdit, no         hardcoded in Mobile's      │                        │
     double-tap on         own file; isDragging       │                        │
     mobile)               spring-back)               │                        │
        │                 │                           │                        │
        └────────┬────────┘                           │                        │
                  ▼                                    ▼                        │
      [checkpoint A: both risky, shared-state       3.1 mobile card-           │
       mechanisms working — click through             area/bottom-row         │
       manually before moving to cosmetics]            portrait tokens         │
                  │                                    (MobileStudyViewer      │
                  ├────────────────┬───────────────────── only, no ternary)    │
                  ▼                 ▼                                          │
            3.2 hint pill     3.3 view-transition-name                          │
                text              (front face only,                            │
                (Mobile file       Mobile file only —                          │
                 hardcodes          Desktop's file has                         │
                 "Tap to flip"      no such prop at all)                       │
                 directly)                                                     │
                  │                 │                                          │
                  └────────┬────────┘                                          │
                           ▼                                                    │
                     4.1 landscape variants                                     │
                     (extends 3.1's portrait tokens,                            │
                      Mobile file only)                                         │
                           │                                                    │
                           ▼                                                    │
               [checkpoint B: all AC bullets implemented]                       │
                           │                                                    │
         ┌──────────────────┴───────────────────────────────────────────────────┘
         ▼
   5.1 desktop-unchanged regression review
   5.2 full verification (test/build, live viewport, landscape,
       bonus Chrome flicker re-check)
         ▼
   [checkpoint C: spec acceptance criteria all green]
```

1.2 (the pure-refactor extraction) is pulled all the way to the front and given its own
mini-checkpoint, deliberately isolated from any new mobile behavior — if something breaks here,
it's unambiguously the refactor's fault, not a mobile feature's. 1.3 then adds the mobile branch
point as an inert skeleton. 2.1/2.2 — the two pieces touching the shared state the parent now owns
(`editingFace`, `dir`, `goNext`/`goPrev`) — come next, before cosmetics (risk-first). 3.x/4.1 are
pure additions living entirely inside `MobileStudyViewer.tsx`, no shared-state risk.

## Phase 1 — Foundation: extract, then branch

### Task 1.1 — Bump the stale `flipDuration` default
**Do:** On the new `StudyViewer` parent's `Props`, set `flipDuration = 380` (was `320`).
**Depends on:** nothing.
**Acceptance criteria:** not itself an AC bullet in `mobile-study-viewer.md` — a carry-over
correction from `mobile-foundation.md`'s *"Flip duration is 380/570/190 (normal/slow/fast) on both
`StudyViewer` and `CardEditor`"* bullet, which this stale default violates for any caller that
omits the prop.
**Verify:** `npm test` — no existing test asserts on `flipDuration`'s numeric value (confirmed via
grep), so this is a no-behavior-change diff in production.

### Task 1.2 — Extract `DesktopStudyViewer`; lift state into a thin `StudyViewer` parent
**Do:** Create `components/cards/DesktopStudyViewer.tsx` containing today's entire `StudyViewer`
render tree (top bar via `ViewerBar`, flip/slide wrapper, both `CardFace`s, footer) as a
presentational component, reading `idx`, `flipped`, `dir`, `editingFace`, `editRef`, `helpOpen` and
every handler (`flip`/`handleClick`, `goNext`, `goPrev`, `handleDoubleClick`, `handleEditSave`,
`handleEditKeyDown`, `handleToggleFace`, `setHelpOpen`) as props instead of local state. Rewrite
`components/cards/StudyViewer.tsx` to own all of that state/those handlers (identical logic,
relocated) and render `<DesktopStudyViewer ...props />` unconditionally — no `isMobile` check yet,
this task is a pure refactor.
**Depends on:** nothing (parallel with 1.1).
**Acceptance criteria:** not an AC bullet itself — the structural prerequisite for every following
task, and the mechanism by which "At >768px, unchanged from current production" becomes verifiable
by inspection rather than hoped-for.
**Verify:** Full existing `__tests__/StudyViewer.test.tsx` suite passes unmodified (proves the
lift-and-split didn't change desktop behavior) — this is the single most important verification
step in the whole plan, since every later task builds on top of this extraction. `npm run build`.

### Task 1.3 — `MobileViewerBar` + `MobileStudyViewer` skeleton
**Do:**
- In `components/layout/TopBar.tsx`, add `MobileViewerBar` alongside the existing
  `LibraryBar`/`ViewerBar`/`CreateBar`/`SettingsBar` variants. Props:
  `{ deckName: string; current: number; total: number; onEditClick: () => void }`. Renders: 34×34
  circular back button (chevron-left icon, `onClick` calls its own
  `navigateWithTransition(useRouter(), '/library', 'back')`), a centered two-line label (deck name
  / `current / total`), a 34×34 circular edit-pencil button (`onClick={onEditClick}`,
  `aria-label="Edit card"`). No help/`?` button.
- Create `components/cards/MobileStudyViewer.tsx`: its own full render tree using
  `MobileViewerBar`, its own copy of the flip/slide card wrapper and `CardFace` markup (ported from
  `DesktopStudyViewer`'s shape, not imported from it), same props shape as `DesktopStudyViewer`
  minus `helpOpen`/`onHelpClick` (no help button on mobile) plus `onEditClick` (stub `() => {}` in
  this task — Task 2.1 wires the real mechanism).
- `StudyViewer` parent now computes `const isMobile = useIsMobile()` and renders
  `isMobile ? <MobileStudyViewer ...props /> : <DesktopStudyViewer ...props />`.
**Depends on:** 1.2.
**Acceptance criteria (spec):** *"Top bar (mobile). Back button, deck name + index/total
(two-line label), and an edit-pencil button. No help/'?' button."*
**Verify:** New tests in `__tests__/StudyViewer.test.tsx`, mocking `@/hooks/useIsMobile` (pattern
from `__tests__/LibraryScreen.test.tsx`) and `@/lib/viewTransition`'s `navigateWithTransition`
(pattern from `__tests__/MobileDeckRow.test.tsx`). With `useIsMobile` mocked `true`: assert the
mobile back button renders and calling it invokes `navigateWithTransition` with
`(expect.anything(), '/library', 'back')`; assert no `getByRole('button', { name: /keyboard shortcuts/i })`
renders. Mocked `false`: assert `ViewerBar`'s existing `← Library` link and `?` button still render
(regression guard, doubles as confirmation the 1.2 extraction is still solid).

## Phase 2 — Risk-first: shared-state mechanisms

### Task 2.1 — Edit-entry retargeting
**Do:** On the `StudyViewer` parent, extract `handleDoubleClick`'s body into a shared
`enterEdit = useCallback(() => { if (editingFace) return; setEditingFace(flipped ? 'answer' : 'question') }, [editingFace, flipped])`.
`handleDoubleClick` (still only ever passed to `DesktopStudyViewer`) becomes: clear `clickTimer` if
present, then call `enterEdit()`. Pass `enterEdit` to `MobileStudyViewer` as the real
`onEditClick`, replacing Task 1.3's stub. `MobileStudyViewer`'s own card markup never wires an
`onDoubleClick` handler at all (not conditionally suppressed — structurally absent, since it's a
separate file from `DesktopStudyViewer` which keeps its `onDoubleClick={editingFace ? undefined : handleDoubleClick}` exactly as today).
**Depends on:** 1.3 (needs the pencil button element to wire into).
**Acceptance criteria (spec):**
- *"Tapping the edit-pencil button enters the same `editingFace` state double-click enters on
  desktop — same save behavior (`updateCardInline`), no new route, no new component"*
- *"Mobile has no double-tap-to-edit trigger; desktop's double-click trigger is unchanged"*
**Verify:** With `useIsMobile` mocked `true`: `fireEvent.click` the edit button → assert the
question face's content becomes `contentEditable` (query via
`container.querySelector('[contenteditable="plaintext-only"]')`) and shows the expected text.
Since `MobileStudyViewer` never attaches `onDoubleClick` at all, there's no meaningful
"fire doubleClick and assert nothing happens" test to write here — the suppression is structural,
provable by reading the file, not by firing an event against a handler that doesn't exist; note
this in the test file as a comment rather than writing a no-op assertion. With `useIsMobile` mocked
`false`: the existing desktop `handleDoubleClick` flow (already covered by Task 1.2's passing
regression suite) continues to work via `DesktopStudyViewer`. Both paths should call the mocked
`updateCardInline` identically on save (⌘/Ctrl+Enter) — one shared assertion shape reused for both
breakpoints proves "same save behavior," since both ultimately call the same parent-owned
`handleEditSave`.

### Task 2.2 — Swipe live drag-follow + mobile commit constants
**Do:** In `hooks/useSwipeGesture.ts`, add a small `isDragging` boolean to the returned state
(`true` from `touchstart` through `touchend`, additive — desktop's existing callback-only usage
doesn't read it, same non-breaking pattern as `dragX`). On the `StudyViewer` parent, destructure
`{ ref: swipeRef, dragX, isDragging }` from the existing `useSwipeGesture({ onSwipeLeft: goNext, onSwipeRight: goPrev })`
call (unchanged call site, just reading more of its return value) and pass `swipeRef`/`dragX`/
`isDragging` to `MobileStudyViewer` only. In `MobileStudyViewer.tsx`, hardcode its own commit
constants directly (`const COMMIT_OFFSET_PCT = 100`, `const COMMIT_DURATION_MS = 220`,
`const COMMIT_DELAY_MS = COMMIT_DURATION_MS / 2` — comment the halving relationship inline, since
`DesktopStudyViewer`'s existing 140ms/280ms pairing follows the same relationship and a future
change to one constant shouldn't silently desync from the other). Card wrapper transform: while
`isDragging && !dir`, apply `transform: translateX(${dragX}px)` with `transition: 'none'`; on
release under threshold (`!isDragging && !dir`), `transform: translateX(0)` with a short eased
transition (`transform 200ms cubic-bezier(0.4,0,0.2,1)`) for the spring-back; on commit (`dir`
truthy), the existing `slideStyle` pattern using `MobileStudyViewer`'s own local
`COMMIT_OFFSET_PCT`/`COMMIT_DURATION_MS`. The parent's `goNext`/`goPrev` `setTimeout` delay must
match whichever child is actually mounted — compute
`const commitDelayMs = isMobile ? 110 : 140` in the parent (the only piece of this that still needs
an `isMobile` check outside the two child files, since the timer lives in the shared
`goNext`/`goPrev`) and use it in place of the existing hardcoded `140`.
**Depends on:** 1.3 (needs `MobileStudyViewer` to exist; independent of 2.1).
**Acceptance criteria (spec):** *"Swipe drags the card 1:1 with the finger; releases under 60px
spring back to center; releases over 60px commit and slide out at ∓100% over 220ms"*; *"At >768px,
`StudyViewer` is visually and behaviorally unchanged from current production"* (satisfied
structurally here since `DesktopStudyViewer` never reads `dragX`/`isDragging` and keeps its
original 110%/280ms/140ms untouched in its own file).
**Verify:** With `useIsMobile` mocked `true`, dispatch raw `TouchEvent`s on the swipe-ref'd
container in `MobileStudyViewer` (`fireEvent.touchStart`/`touchMove`/`touchEnd` with
`touches`/`changedTouches` fixtures — `useSwipeGesture` isn't mocked in the current test file, real
hook runs): mid-drag (30px, under threshold) → assert the card wrapper's inline `transform`
reflects the live delta; `touchEnd` at 30px → assert it springs back (no navigation — `mockReplace`
not called) rather than committing; past 60px → assert the commit path fires after 110ms (not
desktop's 140ms — reuse the existing "URL updates on navigation" test's
`await new Promise(r => setTimeout(r, 160))` pattern, adjusted downward). With `useIsMobile` mocked
`false`: the *existing* "URL updates on navigation" tests (140ms wait, unchanged, exercising
`DesktopStudyViewer`) must still pass unmodified.

**Checkpoint A:** manually click through edit-entry (pencil, no double-tap) and swipe (drag-follow,
spring-back, commit-and-slide) in a real mobile viewport before moving to Phase 3 — these are the
two pieces most likely to have interaction bugs unit tests miss (touch-event timing, transition
interplay).

## Phase 3 — Breakpoint-aware cosmetics (all inside `MobileStudyViewer.tsx`, no ternaries needed)

### Task 3.1 — Mobile card-area and bottom-control-row portrait layout tokens
**Do:** In `MobileStudyViewer.tsx`, apply the design doc's Screen 2 portrait tokens directly (no
conditional — this file only ever renders on mobile): top bar `padding: 2px 16px 10px` (on
`MobileViewerBar`), card area `padding: 0 12px 8px`, bottom control row `padding: 6px 20px 14px`.
Set the card body font size to the fixed 27px token. Size the bottom-row nav buttons to 40px (per
resolved decision #7) — `DesktopStudyViewer`'s existing 44px (`w-11 h-11`) is untouched since it
lives in a separate file.
**Depends on:** 1.3; independent of 2.1/2.2.
**Acceptance criteria (spec):** *"At ≤768px, the viewer renders per the design doc's
tokens/layout."*
**Verify:** No new interaction to test (pure layout) — real verification is visual, covered by
Task 5.2's devtools screenshot comparison against `02-viewer-question.png`/`03-viewer-answer.png`.

### Task 3.2 — Mobile flip-hint pill text
**Do:** In `MobileStudyViewer.tsx`'s own `CardFace` rendering, hardcode the hint pill text as
`"Tap to flip"` directly — no ternary, no shared prop; `DesktopStudyViewer.tsx` keeps
`"Space to flip"` exactly as today in its own file. Visibility (`showHint`) is untouched on both
per resolved decision #5.
**Depends on:** 1.3; independent of 2.x/3.1/3.3.
**Acceptance criteria (spec):** *"Flip-hint pill reads 'Tap to flip' on mobile, 'Space to flip' on
desktop."*
**Verify:** With `useIsMobile` mocked `true`: `screen.getByText('Tap to flip')` present,
`queryByText('Space to flip')` absent. Mocked `false`: the inverse.

### Task 3.3 — `view-transition-name` on the front face only
**Do:** In `MobileStudyViewer.tsx`'s front-face `CardFace` call only, add
`style={{ viewTransitionName: \`card-${deck.id}\` }}`. The back-face call in the same file never
receives this — not conditionally, structurally absent. `DesktopStudyViewer.tsx` has no such prop
anywhere in its file at all.
**Depends on:** 1.3; independent of everything else in Phase 3.
**Acceptance criteria (spec):** *"Library → card navigation morphs via `view-transition-name:
card-{deckId}` shared with the corresponding Library row; the back face never carries this name."*
**Verify:** With `useIsMobile` mocked `true`, render with `deck={{ id: 'deck-1', ... }}`, assert the
front-face element's inline style includes `view-transition-name: card-deck-1`; assert the
back-face element has no `view-transition-name` in its style at all. Cross-reference the literal
string format against `__tests__/MobileDeckRow.test.tsx`'s existing `card-${id}` assertion to prove
parity between the two specs. With `useIsMobile` mocked `false`: assert neither face carries the
property (exercising `DesktopStudyViewer`, which never sets it).

## Phase 4 — Landscape

### Task 4.1 — Landscape orientation variant
**Do:** In `MobileStudyViewer.tsx` (and `MobileViewerBar` if its padding needs it), add
`landscape:` Tailwind variant classes alongside the portrait values Task 3.1 established: top bar
`landscape:` `0px 16px 6px`, card area `landscape:` `0 20px 4px`, bottom row `landscape:`
`2px 20px 8px`, card body font-size `landscape:text-[24px]`. Tailwind v4 (confirmed via
`package.json`) ships `portrait:`/`landscape:` as built-in variants — no config changes needed, but
sanity-check one rendered class in devtools before trusting this blind. Pure CSS, no new state.
**Depends on:** 3.1 (extends its portrait tokens with landscape deltas).
**Acceptance criteria (spec):** *"Landscape orientation is supported with tighter chrome per
design tokens (manual/devtools-verified, not unit-tested)"*; *"Not meaningfully testable via
component tests (no real CSS layout in jsdom)."*
**Verify:** No unit test — explicitly manual per spec. Chrome DevTools MCP: emulate a landscape
mobile viewport (e.g. 844×390), navigate to a card, visually confirm tighter padding and 24px body
text against the written tokens. No landscape screenshot exists for the viewer (only the editor has
04/05) — token-only verification.

### Task 4.2 (unplanned) — Fix `useIsMobile` to catch landscape phones
**Found during Task 4.1's own devtools verification**: testing at the design doc's stated 844×390
landscape reference showed `useIsMobile()` returning `false` there — the hook's query was pure
`(max-width: 767px)`, and landscape width equals portrait height, which exceeds 767px on nearly
every modern phone. The landscape CSS built in 4.1 was correct but effectively unreachable on real
devices. User confirmed fixing it now rather than deferring.
**Do:** Single compound media query (comma = OR in CSS, no hook structure change):
`(max-width: 767px), (max-height: 767px) and (orientation: landscape) and (pointer: coarse)`. The
`pointer: coarse` guard excludes an ordinary short *desktop* browser window (also wide-and-short,
but mouse-driven) from being misclassified as mobile.
**Depends on:** nothing (independent fix to a `mobile-foundation.md`-owned shared hook).
**Verify:** New unit test asserting the query string contains all four clauses (jsdom's matchMedia
mock can't simulate real CSS matching, so this only guards against an accidental revert — the real
verification is live). Full suite green (confirms no `LibraryScreen`/`MobileDeckRow` regression,
since they also consume this hook). Live in Chrome: 844×390 landscape now resolves `matches: true`
and the mobile viewer renders correctly with the 4.1 landscape tokens confirmed via computed
styles; a 1280×700 non-touch desktop viewport (the specific false-positive risk) still resolves
`matches: false` and renders the desktop viewer unchanged. Documented in
`docs/specs/mobile-foundation.md`.

**Checkpoint B:** all AC bullets implemented.

## Phase 5 — Regression + final verification

### Task 5.1 — Desktop-unchanged regression review
**Do:** No code change expected — verification only. Confirm `DesktopStudyViewer.tsx` is
behaviorally equivalent to the pre-Phase-1 `StudyViewer.tsx` by reading both side by side (state
now arrives via props instead of local hooks — not a literal text diff, see the Architecture
section's honesty note above). Confirm `MobileStudyViewer.tsx` and `MobileViewerBar` are never
imported or rendered from anywhere `DesktopStudyViewer` is used. Confirm `ViewerBar` in
`TopBar.tsx` has zero line changes (`git diff --stat`).
**Depends on:** 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1.
**Acceptance criteria (spec):** *"At >768px, `StudyViewer` is visually and behaviorally unchanged
from current production, including the double-click-to-edit trigger."*
**Verify:** Full `__tests__/StudyViewer.test.tsx` desktop-path suite green (this has been true
since Task 1.2 and re-confirmed at every task since — this is the final check, not the first one);
`git diff --stat` showing `components/layout/TopBar.tsx`'s `ViewerBar` export unchanged.

### Task 5.2 — Full verification
**Do:** Run the full suite; check live in a mobile viewport against `02-viewer-question.png` and
`03-viewer-answer.png`; landscape checked against written tokens only (no screenshot exists). As a
bonus (not a formal AC of this spec, but free since we'll already be in devtools for this exact
flip mechanism): re-verify the Chrome flip-flicker fix from `mobile-foundation` is actually holding
live in both `DesktopStudyViewer` and `MobileStudyViewer` now that both carry their own
`willChange: 'transform'` copies. If clean, tick that box in `docs/specs/mobile-foundation.md`
directly, since this session will hold the first-hand verification.
**Depends on:** all prior tasks.
**Acceptance criteria (spec):** *"`npm test` and `npm run build` pass"* — the umbrella bullet, plus
every other AC bullet in `docs/specs/mobile-study-viewer/mobile-study-viewer.md` should now be
individually satisfied by a task above.
**Verify:** `npm test`, `npm run build`, devtools/manual check at a ≤767px viewport (portrait)
against the two screenshots; devtools resize to landscape for the token-only check; devtools flip a
card in Chrome and watch for a one-frame flash of the wrong face, on both breakpoints.

**Checkpoint C:** every acceptance-criteria bullet in
`docs/specs/mobile-study-viewer/mobile-study-viewer.md` is checked off. Ready for PR.
