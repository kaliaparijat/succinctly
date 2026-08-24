# Mobile Redesign — Discovery Notes & Open Questions

Source: `design_handoff_succinctly/design_handoff_succinctly_mobile 2/`
Confirmed so far: mobile UI applies at viewport ≤768px only; desktop UI and all
currently-coded behavior are retained unchanged and take precedence over any
mobile behavior that conflicts with them.

Fill in answers inline under each question in Section C, then let me know and
I'll fold them into the actual spec.

---

## A. Clean breakpoint differences — no conflict, just alternate JSX
No decision needed, listed for completeness:
- Header layout (stacked wordmark/eyebrow/greeting vs. current row layout)
- Bottom tab bar vs. no tab bar
- Deck rows (flat list) vs. deck thumbnail grid
- Landscape support on viewer/editor only — nests entirely inside the mobile
  branch, desktop has no orientation concept
- Last-card `+` button replacing the next-arrow — already identical on both
  today

---

## B. Desktop keeps current behavior, mobile doesn't have it
Fine per the stated precedence rule — flagging so it's a decision, not an
accident. Say if any of these should be reconsidered.

1. **Double-click-to-edit-inline on the study card** (the `editingFace` /
   `contentEditable` / `updateCardInline` subsystem in `StudyViewer.tsx`) —
   desktop-only today. No mobile equivalent in the design; mobile editing is
   always a full navigation via the pencil icon.
   - [Y] Agreed, desktop-only is fine

2. **Deck editing (rename / change palette) from Library** — desktop's
   `DeckThumb` has a hover "⋯" opening `EditDeckModal`. The mobile mockup's
   per-row `+` button does something different (stopPropagates, creates a
   *new card*, not edit-deck). No edit-deck affordance anywhere in the mobile
   library screen.
   - [Y] Agreed, deck editing is desktop-only for now
   - [N] Needs a mobile entry point — describe where: Not needed. I may actually lean more towards the mobile UX here for desktop eventually, but we need not stress right now. 

**SUPERSEDED (2026-08-24)** — see the note under C.4. Mobile now gets
inline rename (name only) via review on issue #7.

---

## C. Open questions — need your answer before I can spec this precisely

### C.1 — Card-editor save model
The mockup shows *both* an "Auto-saved" indicator on the card *and* a "Save"
pill in the top bar. Desktop's `CardEditor` is pure explicit-save
(`useActionState` + form submit — nothing persists until Save / ⌘↵).

- [N] Mobile is explicit-save too, just styled differently — "Auto-saved" label
      is a mistake/leftover in the mockup, ignore it
- [Y] Mobile actually autosaves while typing (debounced, like `StudyViewer`'s
      inline-edit) — the "Save" pill just navigates back / confirms
- [I] Other: That 'save' is misleading. It should auto-save as a user types to it. In desktop, the save behavior navigates you to the newly saved card, from what I recall. I don't think mobile needs this.

**RESOLVED (2026-08-22):** Keep `CardEditor` on the desktop explicit-save
model for both breakpoints. Remove the "Auto-saved" indicator from the
mobile design; reintroduce a "Save card" button matching desktop's behavior
(including navigating to the newly-created card on save). Autosave is a
real idea worth pursuing later, captured separately in
`docs/ideas/autosave-card-editor.md` rather than solved mid-redesign — it
had two open problems (new-card creation timing, and what should trigger
the save) that don't need to block this redesign.

Your answer:


### C.2 — Flip duration vs. the existing user preference
Settings has a `flipSpeed` preference (slow/normal/fast → 480/320/160ms)
that `StudyViewer` already respects. The mobile design specifies a fixed
380ms.

- [N] Mobile ignores the preference, always 380ms
- [Y] 380ms becomes the new "normal," preference still applies (so
      slow/fast scale relative to it)
- [I] Other: The mobile screen flip is much smoother than what we have in the desktop. The desktop UI flip has a glitch, it shows the underlying question or answer briefly, before flipping to the other side. Let's also update the desktop to use 380 ms, this is the new default flip animation speed. Hwever, continue to retain the flip settings and have mobile respect the flip settings if a user chooses to set this value.

**RESOLVED (2026-08-22):** 380ms becomes the new "normal" flipSpeed, applied
to **both** `StudyViewer` and `CardEditor` (the latter is currently
hardcoded at 320ms and doesn't respect the preference at all today — bring
it in line). Slow/fast scale proportionally to the same ratio as today:
slow ≈ 570ms (1.5x), fast ≈ 190ms (0.5x). Glitch was seen in **Chrome** —
leading hypothesis is missing `will-change: transform` on the rotating
wrapper and both card faces failing to pre-promote a GPU compositing layer,
causing a one-frame flash before `backface-visibility: hidden` takes
effect. Will verify live in Chrome via devtools during implementation
rather than assume the fix worked from code alone.

Your answer:


### C.3 — Account / sign-out access on mobile
"Sign out" currently lives only in `AccountDropdown` (opened from the avatar
in the desktop header). The mobile mockup has no avatar anywhere. As
specified, mobile users would have no way to sign out.

- [Y] Add a sign-out action into the existing `SettingsScreen` (small, scoped
      addition — Settings itself otherwise stays out of scope)
- [N] Add a minimal account entry point back into the mobile Library header
      even though the mockup doesn't show one
- [N] Other: ____________________

Your answer:


### C.4 — "New deck" flow drops the naming modal entirely
Desktop opens `NewDeckModal` (name + palette picker). Mobile "just creates
'Untitled deck' with the next unused palette and navigates straight into the
new-card editor" — no naming step. Combined with B.2 (no mobile deck-editing),
there's currently no way to rename a deck away from "Untitled deck" on
mobile at all.

- [Y] Confirmed intentional — rename is a later problem / desktop-only for now
- [N] Needs a rename path on mobile somewhere — describe: ____________________

**RESOLVED (2026-08-23):** Consistent with this — an abandoned empty
"Untitled deck" left behind after the user backs out of the new-card
editor without saving anything is acceptable, same as any deck with 0
cards. No cleanup logic needed. Renaming/deleting it later goes through
existing desktop deck-editing (per B.2).

**SUPERSEDED (2026-08-24), via review on issue #7:** Both this and B.2 no
longer hold. Mobile "New deck" is now inline creation — a name is required
and confirmed before the deck exists at all, so there's no more untitled/
abandoned-deck case to reason about. Mobile also gets an inline
deck-rename affordance (name only, not palette), replacing the per-row
quick-add-card button. See `docs/specs/mobile-redesign.md`'s Library
section for the current spec.

Your answer:


---

## D. Can desktop/mobile share component logic, or does it need to fork?
For reference while answering above — this is my assessment, not a question:

- **`LibraryScreen`** — mostly shareable. The "new deck" action is the one
  real logic fork (open modal vs. instant-create-and-navigate); everything
  else is a breakpoint-driven render choice.
- **`StudyViewer`** — swipe is the real complication. Current
  `useSwipeGesture` only fires a callback on release (no live position).
  Mobile wants live 1:1 drag-follow + spring-back, which needs continuous
  drag-position state during the gesture. Plan: extend the hook to return
  `{ ref, dragX }` (desktop's render ignores `dragX`) rather than fork into
  two hooks. Everything else (index/flip state, card data) shares cleanly;
  the inline-edit subsystem just isn't wired up below the breakpoint.
- **`CardEditor`** — blocked on C.1. Explicit-save-on-both shares cleanly
  (breakpoint just picks the JSX). Real autosave on mobile is a bigger fork
  (different data-flow, not just different render).
