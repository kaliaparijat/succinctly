# Mobile Redesign

A high-fidelity mobile redesign of the app, split into focused specs so
each can be reviewed independently rather than as one large document:

1. [`mobile-foundation.md`](mobile-foundation.md) — breakpoint detection,
   `useSwipeGesture` extension, and the two shared desktop-behavior
   changes (flip duration, Chrome flicker fix). Everything else depends on
   this landing first.
2. [`mobile-library.md`](mobile-library.md) — deck list, inline create,
   inline rename, tab bar.
3. [`mobile-study-viewer.md`](mobile-study-viewer.md) — full-bleed card,
   swipe, flip, and how mobile reaches editing (no new route — retargets
   the existing inline-edit mechanism).
4. [`mobile-card-editor.md`](mobile-card-editor.md) — create-card screen
   only; editing lives in the study viewer spec instead.

Decision history / discovery notes from the original interview process:
[`mobile-redesign-questions.md`](mobile-redesign-questions.md).

Source design: `design_handoff_succinctly/design_handoff_succinctly_mobile 2/README.md`
— design tokens, exact spacing/type/motion values, screenshots. Treat as
the source of truth for anything visual; not duplicated in any of the
specs above.

## Problem
The current UI (`LibraryScreen`, `StudyViewer`, `CardEditor`) is
desktop-first and responsive-but-not-native-feeling on mobile. The design
above is full-bleed single-card screens for study/edit, a flat tappable
deck list for Library, and a bottom tab bar — built to feel like a native
iOS app rather than a shrunk desktop page.

## Scope
Applies **only at viewport ≤768px** (see the foundation spec for exactly
where that boundary is drawn). Auth is unchanged. Settings is unchanged
except the one small addition below.

## Settings: sign-out addition
Add a sign-out action to the existing `SettingsScreen` (calls the existing
`signOut` server action from `app/actions/auth.ts`). **Additive only** —
desktop's `AccountDropdown` keeps its own sign-out exactly as it is today.
This closes a gap the redesign otherwise creates: mobile's Library has no
avatar/dropdown (see the Library spec), so without this, mobile users
would have no way to sign out at all. Applies at both breakpoints
identically — not itself a mobile-specific behavior, small enough not to
need its own spec.
- [ ] Settings has a working sign-out button; `AccountDropdown`'s existing
      sign-out is untouched

## Not Doing (project-wide)
- Autosave in `CardEditor` (deferred idea: `docs/ideas/autosave-card-editor.md`)
- Any change to Auth screens
- Any desktop visual or behavioral change beyond the two shared changes in
  the foundation spec
