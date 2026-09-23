# To-do: mobile-study-viewer

Full detail/rationale/verification steps: `docs/specs/mobile-study-viewer/plan.md`.
Spec: `docs/specs/mobile-study-viewer/mobile-study-viewer.md`.

## Phase 1 — Foundation: extract, then branch
- [ ] 1.1 Bump stale `flipDuration` default 320 → 380 on the new parent's `Props`
- [ ] 1.2 Extract `DesktopStudyViewer`; lift state into a thin `StudyViewer` parent (pure refactor, no `isMobile` branch yet)
- [ ] 1.3 `MobileViewerBar` (TopBar.tsx) + `MobileStudyViewer` skeleton; parent forks on `isMobile`

## Phase 2 — Risk-first: shared-state mechanisms
- [ ] 2.1 Edit-entry retargeting (pencil → `enterEdit`; mobile has no `onDoubleClick` at all)
- [ ] 2.2 Swipe live drag-follow + mobile commit constants (∓100%/220ms/110ms, `isDragging` spring-back)

**Checkpoint A** — manually click through edit-entry and swipe on a real mobile viewport

## Phase 3 — Breakpoint-aware cosmetics (all inside `MobileStudyViewer.tsx`)
- [ ] 3.1 Mobile card-area/bottom-row portrait tokens (40px buttons, 27px body text)
- [ ] 3.2 Mobile flip-hint pill text ("Tap to flip", hardcoded, visibility unchanged)
- [ ] 3.3 `view-transition-name: card-{deckId}` on the front face only

## Phase 4 — Landscape
- [ ] 4.1 `landscape:` Tailwind variants extending 3.1's portrait tokens

**Checkpoint B** — all AC bullets implemented

## Phase 5 — Regression + verification
- [ ] 5.1 Desktop-unchanged regression review (`DesktopStudyViewer` behaviorally equivalent, `ViewerBar` untouched)
- [ ] 5.2 `npm test`, `npm run build`, live mobile-viewport check vs. `02-viewer-question.png`/`03-viewer-answer.png`, landscape token check, bonus Chrome flicker re-check

**Checkpoint C** — every AC in `docs/specs/mobile-study-viewer/mobile-study-viewer.md` checked off, ready for PR
