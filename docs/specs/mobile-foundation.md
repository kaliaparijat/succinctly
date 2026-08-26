# Mobile Redesign: Foundation

Part of the mobile redesign — see `docs/specs/mobile-redesign.md` for the
overview and links to the other screen specs. Decision history:
`docs/specs/mobile-redesign-questions.md`.

## Problem
Three other specs (Library, Study viewer, Card editor) each need a way to
render different JSX/behavior at ≤768px vs. above it, and `StudyViewer`
already needs a live swipe-drag position it doesn't expose today. None of
this exists in the codebase yet — no breakpoint-detection hook, no
`matchMedia` usage anywhere, and jsdom (this project's test environment)
doesn't implement `matchMedia` at all. This spec covers that shared
groundwork so the three screen specs can each assume it exists rather than
re-deriving it three times.

## Scope
- A breakpoint-detection hook other components can consume.
- Extending `useSwipeGesture` to expose live drag position.
- Two changes to *existing* desktop behavior that apply everywhere,
  independent of the mobile fork (grouped here since they're shared, not
  because they're related to breakpoint detection itself).

## Breakpoint Detection
A hook (consumed by `LibraryScreen`, `StudyViewer`, `CardEditor`) that
reports whether the viewport is ≤767px. **767px, not 768px** — Tailwind's
`md:` activates at `min-width: 768px`; treating exactly 768px as desktop
in this hook keeps it pixel-consistent with any co-located `md:` Tailwind
class in the same component, avoiding a boundary where JS and CSS
disagree about which "mode" 768px itself is in.

Since this can only be known client-side (Server Components fetch data
with no viewport awareness — confirmed by reading all three route files:
`app/(app)/library/page.tsx`, `.../decks/[id]/cards/[cardId]/page.tsx`,
`.../decks/[id]/cards/new/page.tsx` — none pass or could pass a viewport
signal), the server-rendered/pre-hydration state defaults to desktop.
**Accepted tradeoff**: a true mobile device sees a brief flash of desktop
layout on cold load, before the client corrects it post-hydration. Every
route in scope sits behind auth (`getUser()` → redirect), not a public/SEO
page, so this is judged acceptable rather than worth the complexity of a
blocking pre-hydration script.

Known edge case, accepted rather than solved: Tailwind's breakpoints are
defined in `rem`; this hook's query is in `px`. At non-default browser
zoom/font-size, the JS fork and a co-located `md:` class could disagree by
a few pixels. Internal authenticated app, not a public site — documented,
not fixed.

## Shared Changes (apply to both breakpoints)
The only two approved changes to existing desktop behavior — independent
of the breakpoint hook above, safe to ship first.

1. **Flip duration → 380ms as the new "normal."** Applies to both
   `StudyViewer` (already respects the `flipSpeed` preference) and
   `CardEditor` (currently hardcoded at 320ms, respects no preference at
   all today — needs wiring up). Slow/fast scale proportionally to the
   same ratio as today: `{ slow: 570, normal: 380, fast: 190 }` (was
   `{ 480, 320, 160 }`).
2. **Fix the Chrome flip flicker.** Reported symptom: the underlying
   question/answer briefly shows before the flip completes. Leading
   hypothesis: neither the rotating wrapper nor the two card-face elements
   have `will-change: transform`, so Chrome doesn't pre-promote a GPU
   compositing layer before the transition starts, causing a one-frame
   flash before `backface-visibility: hidden` takes effect. **This is a
   hypothesis, not a confirmed root cause — must be verified live in
   Chrome via devtools before being considered closed**, not just
   code-reviewed.

## `useSwipeGesture` Extension
Currently only fires `onSwipeLeft`/`onSwipeRight` callbacks on touch
release — no live position during the gesture. Extend it to also expose
that live position so `StudyViewer`'s mobile branch can drive a 1:1
drag-follow transform, **without forking into a second hook** — desktop's
existing usage simply doesn't read the new value, so this is additive to
the one current call site, not a breaking change to it.

## Acceptance Criteria
- [ ] Breakpoint hook correctly reports mobile at ≤767px and desktop at
      ≥768px, with no disagreement against `md:` Tailwind classes at the
      exact boundary
- [ ] Desktop (existing behavior) is unaffected by the hook's existence —
      nothing consumes it yet outside of tests until the screen specs land
- [ ] `useSwipeGesture`'s existing caller (`StudyViewer`) compiles and
      behaves identically without reading the new live-position value
- [ ] Flip duration is 380/570/190 (normal/slow/fast) on both
      `StudyViewer` and `CardEditor`, both respecting the `flipSpeed`
      preference (currently only `StudyViewer` does)
- [ ] No visible flash/flicker of the wrong face during a flip in Chrome —
      verified live, not just via code review
- [ ] `npm test` and `npm run build` pass

## Not Doing
- A pre-hydration blocking script to eliminate the SSR flash (documented
  tradeoff, not solved here — revisit only if it proves visually bad in
  practice)
- A CSS-only dual-render-and-hide approach as an alternative to the
  breakpoint hook (rejected: the components in scope share live state
  across the fork — drag position, flip state, form submission — not just
  static markup, so two live mounted instances would be worse than one
  hook-gated branch)
