# To-do: issue-12-insert-card-anywhere

Full detail/rationale/verification steps: `docs/specs/issue-12-insert-card-anywhere/plan.md`.
Spec: `docs/specs/issue-12-insert-card-anywhere/spec.md`.
Issue: https://github.com/kaliaparijat/succinctly/issues/12

Every task is test-first: red (failing test), green (minimal change), then the next task.

## Phase 1 — Data model
- [x] 1.1 Migration: `cards.position` integer → numeric — applied to remote (`20261006230108`, listed in `migration list --linked`)
- [x] 1.2 Regenerate `lib/database.types.ts` (only CLI formatting changed; `position` still `number`)

## Phase 2 — Server Action
- [x] 2.1 `createCard` accepts `after_card_id` — red: 5 tests (mid-deck, after last, first card, deck-scoped anchor lookup, missing anchor error); green: implementation
- [x] 2.2 `listCards` tie-break by `created_at` — red: order-chain assertion; green: second `.order`

## Phase 3 — Wire insert-after context through the UI
- [x] 3.1 `resolveAfterCardId` pure function — red: 3 tests; green: function + `after` search param on the new-card page
- [x] 3.2 Hidden `after_card_id` input in Desktop & Mobile card editors — red: 2 tests per editor; green: thread prop + input

## Phase 4 — Insert trigger in the viewer
- [x] 4.1 Symmetric arrows + always-visible `+` insert control — red: link/arrow tests in `StudyViewer.test.tsx` (both breakpoints); green: both viewers

## Phase 5 — Verification
- [x] 5.1 `npm test` and `npm run build` green, no tests skipped
- [ ] 5.2 Live browser check: mid-deck insert, last-card append, Cancel regression

**Done when:** every task above is checked, every acceptance-criteria checkbox in the spec is checked, and 5.2 passes.
