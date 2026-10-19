# To-do: issue-18-markdown-card-editor

Full detail/rationale/verification steps: `docs/specs/issue-18-markdown-card-editor/plan.md`.
Spec: `docs/specs/issue-18-markdown-card-editor/spec.md`.
Issue: https://github.com/kaliaparijat/succinctly/issues/18

Every task is test-first: red (failing test), green (minimal change), then the next task.

## Phase 0 — Dependencies
- [ ] 0.1 `npm install katex highlight.js`; import `katex/dist/katex.min.css` globally; no stock hljs theme

## Phase 1 — Markdown core
- [ ] 1.1 `lib/markdown.ts` — block-level `parseMD`
- [ ] 1.2 `lib/markdown.ts` — inline formatting + KaTeX (`tex`, `inlineHTML`)
- [ ] 1.3 `CodeBlock.tsx` — highlight.js (python/javascript/typescript only) + hand-mapped token colors
- [ ] 1.4 `MarkdownRenderer.tsx` — blocks → paragraph/code/math/list/placeholder

## Phase 2 — `useMarkdownFace` hook
- [ ] 2.1 State + `open()`/`close()` (text survives open/close cycle)
- [ ] 2.2 `fmt(kind)` insertion (bold/italic/code/math/list) with selection handling
- [ ] 2.3 `onKeyDown` (Escape, ⌘B/⌘I, Tab-in-fence + stopPropagation, list Enter)

## Phase 3 — `MarkdownFace` component
- [ ] 3.1 Render/edit toggle + always-present hidden input (form-submission regression test)

## Phase 4 — `FormatToolbar`
- [ ] 4.1 5 buttons (no Image), size/gap props, mousedown preventDefault

## Phase 5 — Wire into the editors
- [ ] 5.1 `DesktopCardEditor.tsx` — MarkdownFace + header toolbar; update stale textbox-count tests
- [ ] 5.2 `MobileCardEditor.tsx` — MarkdownFace + bottom toolbar + mobile Done pill
- [ ] 5.3 `CardEditor.tsx` — reconcile Tab-to-flip with face-local Tab-in-fence handling

## Phase 6 — Verification
- [ ] 6.1 `npm test` and `npm run build` green, no tests skipped
- [ ] 6.2 Live browser check (desktop + mobile): bold/code/math render, flip-then-render, click-to-reopen, Tab-in-fence, Save/Cancel unchanged

**Done when:** every task above is checked, every acceptance-criteria checkbox in the spec is checked, and 6.2 passes.
