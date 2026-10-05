# To-do: mobile-card-editor

Full detail/rationale/verification steps: `plan.md` (same folder).
Spec: `mobile-card-editor.md` (same folder).

**Two decisions need your sign-off before Phase 2 starts** — see plan.md's
"Two decisions needing explicit sign-off" section: (1) mobile back-chevron
reuses Cancel's previousCardId-or-`/library` logic, not desktop header
arrow's `/decks/{id}` target; (2) error-message placement (centered below
the card, above the Q/A toggle) since the design doc has no error-state
treatment.

## Phase 0 — Cleanup
- [x] 0.1 Remove `CardEditor`'s dead `isEdit` branch (unreachable in production; editing now lives in `StudyViewer`) — also drops the now-unused `updateCard` server action

## Phase 1 — Foundation
- [x] 1.1 Save navigation → `navigateWithTransition` (both breakpoints, pre-split)
- [x] 1.2 Extract `DesktopCardEditor`; lift state into thin `CardEditor` parent

**Checkpoint A** — `npm test && npm run build` green, dead code gone, no mobile code yet

## Phase 2 — Mobile skeleton
- [x] 2.1 `MobileCreateBar` + `MobileCardEditor` skeleton (save pill, back-chevron = Cancel logic, Tab-to-flip retained)

**Checkpoint B** — manual click-through: save lands on new card; cancel goes to the right place for both an existing deck and a brand-new empty one

## Phase 3 — Mobile card body
- [x] 3.1 Screen 3 portrait tokens, "Draft" face-header label, error-message placement, no Auto-saved indicator

## Phase 4 — Landscape
- [x] 4.1 Landscape token variant

**Checkpoint C** — every AC in `mobile-card-editor.md` implemented

## Phase 5 — Regression + verification
- [x] 5.1 Desktop-unchanged regression review
- [x] 5.2 `npm test`, `npm run build`, live mobile-viewport check vs. `04-editor-portrait.png`/`05-editor-landscape.png`

**Checkpoint D** — ready for PR
