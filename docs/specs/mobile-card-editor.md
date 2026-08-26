# Mobile Redesign: Card Editor (Create)

Part of the mobile redesign — see `docs/specs/mobile-redesign.md` for the
overview. Depends on `docs/specs/mobile-foundation.md`'s breakpoint hook
and shared flip-duration change. Decision history:
`docs/specs/mobile-redesign-questions.md`.

## Problem
`CardEditor`'s create flow needs a mobile layout matching the design
handoff's full-bleed card geometry. Note the scope here: **editing an
existing card on mobile does not go through `CardEditor` at all** — that
happens inside `StudyViewer`'s inline-edit (see
`docs/specs/mobile-study-viewer.md`). `CardEditor`'s `isEdit` branch isn't
reachable in production today (only `/cards/new` renders it) and this
redesign doesn't change that — this spec is create-mode only.

## Scope
`CardEditor` (create mode) at ≤768px. Per design doc Screen 3 for exact
tokens/spacing.

## Non-Goals
- No autosave. Stays explicit-save on both breakpoints, same
  `useActionState`/`createCard` mechanism as desktop today — only the
  rendered JSX differs. (Autosave is a deferred idea, not part of this
  redesign: `docs/ideas/autosave-card-editor.md`.)
- No edit-mode work of any kind (see Problem, above).

## Behavior

**Top bar with in-header Save.** Unlike desktop's static top-bar label
(Save lives in the card footer there), mobile puts a "Save" pill in the
top bar itself. Reuse the existing `⌘↵`-submit mechanism
(`formRef.current?.requestSubmit()`) rather than building a second submit
path — the header button just calls the same thing.

**Save/cancel navigation** — identical to desktop, no fork: save
navigates to the newly-created card (`navigateWithTransition`, `forward`);
cancel matches desktop's existing previousCardId-or-`/library` logic.

**Card body.** Textarea sizing/placement per design tokens; `QAToggle`
reused as-is, no changes to it.

**Flip duration.** 380ms default, respecting the `flipSpeed` preference —
this is the foundation spec's shared change, applies here identically to
mobile and desktop.

**Landscape.** Same approach as the study viewer spec — pure CSS variant,
manual/devtools-verified rather than unit-tested.

## Acceptance Criteria
- [ ] At ≤768px, the create-card screen renders per the design doc's
      tokens/layout, with the Save pill in the top bar
- [ ] Save/cancel behavior (including newly-created-card navigation) is
      identical on both breakpoints — same server action, same navigation
      call, only different JSX and button placement
- [ ] Landscape orientation supported per design tokens (manual/devtools-
      verified)
- [ ] At >768px, `CardEditor` is visually and behaviorally unchanged from
      current production
- [ ] `npm test` and `npm run build` pass
