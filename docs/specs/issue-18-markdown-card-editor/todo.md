# To-do: issue-18-markdown-card-editor

Full detail/rationale/verification steps: `docs/specs/issue-18-markdown-card-editor/plan.md`.
Spec: `docs/specs/issue-18-markdown-card-editor/spec.md`.
Issue: https://github.com/kaliaparijat/succinctly/issues/18

Every task is test-first: red (failing test), green (minimal change), then the next task.

## Phase 0 — Dependencies
- [x] 0.1 `npm install katex highlight.js`; import `katex/dist/katex.min.css` globally; no stock hljs theme

## Phase 1 — Markdown core
- [x] 1.1 `lib/markdown.ts` — block-level `parseMD`
- [x] 1.2 `lib/markdown.ts` — inline formatting + KaTeX (`tex`, `inlineHTML`)
- [x] 1.3 `CodeBlock.tsx` — highlight.js (python/javascript/typescript only) + hand-mapped token colors
- [x] 1.4 `MarkdownRenderer.tsx` — blocks → paragraph/code/math/list/placeholder

## Phase 2 — `useMarkdownFace` hook
- [x] 2.1 State + `open()`/`close()` (text survives open/close cycle)
- [x] 2.2 `fmt(kind)` insertion (bold/italic/code/math/list) with selection handling
- [x] 2.3 `onKeyDown` (Escape, ⌘B/⌘I, Tab-in-fence + stopPropagation, list Enter)

## Phase 3 — `MarkdownFace` component
- [x] 3.1 Render/edit toggle + always-present hidden input (form-submission regression test)

## Phase 4 — `FormatToolbar`
- [x] 4.1 5 buttons (no Image), size/gap props, mousedown preventDefault

## Phase 5 — Wire into the editors
- [x] 5.1 `DesktopCardEditor.tsx` — MarkdownFace + header toolbar; update stale textbox-count tests
- [x] 5.2 `MobileCardEditor.tsx` — MarkdownFace + bottom toolbar + mobile Done pill
- [x] 5.3 `CardEditor.tsx` — reconcile Tab-to-flip with face-local Tab-in-fence handling
      (landed as one commit — see plan.md's note on why 5.1-5.3 share infra;
      also fixed two autoFocus/blur race bugs the tests caught, not anticipated
      in the plan)

## Phase 6 — Verification
- [x] 6.1 `npm test` and `npm run build` green, no tests skipped (239 tests, 25 files)
- [x] 6.2 Live browser check (desktop + mobile), against the real dev server/
      Supabase project. Found and fixed 3 real bugs not caught by unit tests:
      - `MarkdownFace`'s root used `style={position:'relative', flex:1}`,
        but its parent isn't `display:flex` — the root collapsed to 0
        height, so the textarea's `inset-0`/`h-full` resolved against a
        zero-height box. Fixed to `className="absolute inset-0"`.
      - The editing textarea had no font/color/size styling at all (browser
        default black sans-serif, left-aligned) — added a `textareaClassName`
        prop so Desktop/MobileCardEditor can supply the same per-breakpoint
        classes the original raw `<textarea>` had.
      - Both faces starting `editing: true` broke the flip semantics — see
        spec.md's "Initial state" section for the full story; fixed by only
        starting Question in editing mode.
      Confirmed working after fixes: bold/inline-code/math render correctly
      on close; click-to-reopen restores raw Markdown; flip keeps both faces
      in edit mode mid-session and renders them once closed, exactly per the
      design's documented algorithm; mobile Done/Draft + bottom toolbar;
      Save persists both faces' Markdown source and navigates correctly;
      StudyViewer shows the raw source unrendered, as scoped.

**Done when:** every task above is checked, every acceptance-criteria checkbox in the spec is checked, and 6.2 passes.
