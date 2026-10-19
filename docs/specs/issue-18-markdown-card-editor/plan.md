# Plan: issue-18-markdown-card-editor

Source spec: `docs/specs/issue-18-markdown-card-editor/spec.md`
(issue #18: https://github.com/kaliaparijat/succinctly/issues/18)

## Context

`DesktopCardEditor.tsx` / `MobileCardEditor.tsx` currently render two plain
`<textarea name="question">` / `<textarea name="reference_answer">` fields,
always present in the DOM (one per face, hidden via `backface-visibility`
during the flip), submitted natively through `<form action={formAction}>` to
`createCard`. This plan replaces those two textareas with a click-to-edit
Markdown face (render Markdown when idle, raw textarea when active), adds a
Bold/Italic/Code/Math/List toolbar, and adds `katex` + `highlight.js` as
dependencies. The spec's one real architectural wrinkle — a face's textarea
only exists while editing, so a plain `name="question"` would drop from
`FormData` the moment that face renders — is solved by giving each face an
always-present hidden input as the actual form field.

Both new deps checked against npm for typosquatting before use (`npm view
katex`, `npm view highlight.js` — real package names, current maintainers),
per `CLAUDE.md`'s code-review checklist.

## Process: every task is test-first

1. **Red:** write the test(s) for the task; confirm they fail for the right
   reason.
2. **Green:** smallest change that makes them pass.
3. **Refactor** only with tests green.

Phase 6 is end-to-end browser verification, not where tests get written.
Markdown parsing/rendering (Phase 1) and the per-face hook's text-editing
logic (Phase 2) are pure/jsdom-testable. Auto-grow textarea height
(`ResizeObserver` + real layout) is not meaningfully testable in jsdom —
that one behavior is manual/devtools-verified in Phase 6, flagged inline
below rather than silently skipped.

## Dependency graph

```
0.1 npm install katex highlight.js
        │
        ▼
1.1 lib/markdown.ts — parseMD (block-level)        (test-first)
        │
        ▼
1.2 lib/markdown.ts — inline formatting + KaTeX     (test-first)
        │
        ▼
1.3 components/cards/markdown/CodeBlock.tsx         (test-first)
    (highlight.js + custom token-color CSS)
        │
        ▼
1.4 components/cards/markdown/MarkdownRenderer.tsx  (test-first)
        │                                   │
        ▼                                   │
2.1 useMarkdownFace — text/editing/         │
    open()/close()            (test-first)  │
        │                                   │
        ▼                                   │
2.2 useMarkdownFace — fmt() insertion        │
    (bold/italic/code/math/list) (test-first)│
        │                                   │
        ▼                                   │
2.3 useMarkdownFace — onKeyDown              │
    (Escape/⌘B/⌘I/Tab-in-fence/list Enter)   │
    (test-first)                             │
        │                                   │
        └─────────────┬─────────────────────┘
                       ▼
        3.1 MarkdownFace.tsx (render/edit toggle +
            always-present hidden input)   (test-first)
                       │
                       ▼
        4.1 FormatToolbar.tsx              (test-first)
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
5.1 DesktopCardEditor.tsx wiring   5.2 MobileCardEditor.tsx wiring
    (test-first)                      (test-first)
        │                              │
        └──────────────┬───────────────┘
                        ▼
        5.3 CardEditor.tsx: reconcile top-level
            Tab-to-flip with face-local Tab      (test-first)
                        │
                        ▼
                6.1 Full suite + build
                        │
                        ▼
                6.2 Live browser check (desktop + mobile)
```

## Phase 0 — Dependencies

### Task 0.1 — Install `katex` and `highlight.js`
**Do:** `npm install katex highlight.js`. Import `katex/dist/katex.min.css`
once, globally (`app/globals.css` via `@import "katex/dist/katex.min.css";`
— consistent with the existing single `@import "tailwindcss"` there). Do
**not** import any `highlight.js/styles/*` theme file — Task 1.3 hand-maps
hljs's token classes to the design's own colors instead.
**Depends on:** nothing.
**Verify:** `npm run build` still succeeds with the new deps present but
unused.

## Phase 1 — Markdown core (pure, no React)

### Task 1.1 — `lib/markdown.ts`: block-level `parseMD`
**Red:** New `__tests__/markdown.test.ts`. Cases: a single paragraph; two
paragraphs separated by a blank line; a fenced code block (language tag
captured, body captured verbatim including internal blank lines); inline
`$...$` vs. a `$$...$$` block (single-line and multi-line); a bullet list
(`-` and `*` markers); an image line `![alt](src)`; mixed content in one
source producing blocks in source order. All fail (no `lib/markdown.ts`
yet).
**Green:** Port `parseMD` from `editor-shared.jsx` (lines 25-47) to
TypeScript, typed block union (`{type:'text'|'code'|'math'|'image'|'list', ...}`).
Image blocks are parsed but intentionally inert per the spec's Non-Goals —
no upload wiring, just `{type:'image', alt, src}` data.
**Depends on:** nothing.

### Task 1.2 — `lib/markdown.ts`: inline formatting + KaTeX
**Red:** Add cases for `inlineHTML`: `**bold**`, `*italic*`, `` `code` ``,
inline `$math$`, and escaping (`<`, `&`, `>` in plain text are escaped;
inside a code/math token they're handled by that token's own renderer, not
double-escaped). A KaTeX render-failure case (malformed TeX) falls back to
the escaped raw source rather than throwing.
**Green:** Port `esc` / `tex` / `inlineHTML` (lines 15-24). `tex()` wraps
`katex.renderToString` in try/catch exactly as the prototype does.
**Depends on:** 1.1 (shares the module), 0.1 (`katex` installed).

### Task 1.3 — `components/cards/markdown/CodeBlock.tsx`
**Red:** `__tests__/CodeBlock.test.tsx`. Renders a `python` snippet and
asserts `.hljs-keyword` / `.hljs-string` classes appear on the expected
tokens (highlight.js's own output, so assert presence of the classes, not
exact HTML); same for a `javascript` and a `typescript` snippet; an
unregistered language falls back to plain escaped text, not a throw.
**Green:** Register only `python`, `javascript`, `typescript` via
`highlight.js/lib/core` + `highlight.js/lib/languages/{python,javascript,typescript}`
(not the full bundle). Add the hand-mapped color CSS (keyword `#F5D96B`,
string `#B8DFC4`, number/literal `#F2A68F`, comment
`rgba(237,230,214,0.45)` italic, function title `#A8C8E8`, meta `#D4BFE8`)
targeting `.hljs-keyword`, `.hljs-string`, `.hljs-built_in`,
`.hljs-comment`, `.hljs-title.function_`, `.hljs-meta` in `app/globals.css`
or a co-located CSS module — whichever matches how `CardHeader`-style
component CSS already lives in this codebase (check before adding a new
pattern).
**Depends on:** 0.1.

### Task 1.4 — `components/cards/markdown/MarkdownRenderer.tsx`
**Red:** `__tests__/MarkdownRenderer.test.tsx`. Given parsed blocks (or raw
source), renders a paragraph as Instrument-Serif text, a code block via
`CodeBlock`, a math block via KaTeX output, a list as `<ul><li>`, and an
empty/blank source as the placeholder text passed in via prop.
**Green:** Port `Block` / `Rich` (`editor-shared.jsx` lines 86-100),
typed, using `lib/markdown.ts` + `CodeBlock`.
**Depends on:** 1.1, 1.2, 1.3.

## Phase 2 — `useMarkdownFace` hook

### Task 2.1 — State + `open()`/`close()`
**Red:** `__tests__/useMarkdownFace.test.ts` (`@testing-library/react`'s
`renderHook`). Starts with given initial text and `editing` flag; `open()`
sets `editing: true`; `close()` sets `editing: false`; text updates via
`setText` are preserved across an open/close cycle (this is the form-
submission-correctness property from the spec — text must survive while
not editing).
**Green:** Port the state shell of `useSimpleFace` (`editor-simple.jsx`
lines 2-16), minus DOM-measurement concerns (deferred to 2.4/manual).
**Depends on:** nothing (independent of Phase 1).

### Task 2.2 — `fmt(kind)` insertion
**Red:** For each of `bold`/`italic`/`code`/`math`/`list`, given a text
value and a selection range, assert the resulting text and the resulting
selection range (so the "keep inner text selected" behavior is covered):
- `bold`/`italic`: wraps selection, selection moves to the inner text
- `code`: single-line selection → inline backtick-wrap; empty or
  multi-line selection → fenced block with language `python` and caret
  placed inside
- `math`: selection or non-start-of-line caret → inline `$…$`; otherwise a
  `$$` block
- `list`: prefixes the current line with `- `
**Green:** Port `fmt` (`editor-simple.jsx` lines 18-27).
**Depends on:** 2.1.

### Task 2.3 — `onKeyDown`
**Red:** Simulate `keydown` events on a rendered textarea (via the hook's
returned `onKeyDown`, called directly with a constructed event, or through
`renderHook` + a throwaway `<textarea>`):
- `Escape` → blurs and calls `close()`
- `⌘B` / `⌘I` (and `Ctrl+B`/`Ctrl+I`) → calls `fmt('bold'|'italic')`
- `Tab` with the caret inside an **open** fenced code block (odd number of
  ` ``` ` lines above the caret) → inserts 4 spaces, calls
  `stopPropagation()`, does not flip
- `Tab` outside a fence → does *not* call `stopPropagation()` (so the
  caller — `CardEditor.tsx`'s window-level handler — still sees it and
  flips)
- `Enter` on a non-empty `- item` line → continues the list (`\n- `);
  `Enter` on an empty `- ` line → removes the marker, ends the list
**Green:** Port `onKeyDown` (`editor-simple.jsx` lines 29-39).
**Depends on:** 2.2.

(Task 2.4, auto-grow via `ResizeObserver`, is intentionally not a unit-test
task — see Phase 6.2.)

## Phase 3 — `MarkdownFace` component

### Task 3.1 — Render/edit toggle + always-present hidden input
**Red:** `__tests__/MarkdownFace.test.tsx`:
- initial `editing=true` prop → a `<textarea>` is present, no rendered
  content
- initial `editing=false` with non-empty text → `MarkdownRenderer` output
  is present, no `<textarea>`
- **in both states**, `input[name="question"]` (or whatever `name` prop is
  passed) exists with `value` equal to the current text — this is the
  acceptance-criterion regression test for the spec's "form submission"
  gotcha
- clicking the rendered view opens editing (textarea appears, focused)
- blurring to an element outside the face's container closes editing
  (rendered view reappears) — matching `editor-simple.jsx`'s outside-click
  check (`e.currentTarget.closest('[data-face]')`)
**Green:** Port `SimpleFace` (`editor-simple.jsx` lines 45-68) as a typed
component wrapping `useMarkdownFace`, rendering `MarkdownRenderer` when
idle and a bare `<textarea>` (no `name` attr) plus the hidden input when
editing or not.
**Depends on:** 1.4, 2.3.

## Phase 4 — `FormatToolbar`

### Task 4.1 — Buttons + sizing + focus retention
**Red:** `__tests__/FormatToolbar.test.tsx`: renders 5 buttons (Bold,
Italic, Code, Math, List — explicitly asserts no Image button, per the
spec's Non-Goals); clicking each calls `onFmt('bold'|'italic'|'code'|'math'|'list')`;
every button's `mousedown` calls `preventDefault()` (assert via a spy on
the event, or assert `document.activeElement` — the textarea — is
unchanged after a button `mousedown`); a `size`/`gap` prop changes the
rendered button dimensions (desktop vs. mobile sizing).
**Green:** Port `SimpleFmtBar` (`editor-simple.jsx` lines 70-73), typed,
with the Image entry removed.
**Depends on:** nothing (independent of Phases 1-3; can be done in
parallel).

## Phase 5 — Wire into the editors

### Task 5.1 — `DesktopCardEditor.tsx`
**Red:** Update `__tests__/CardEditor.test.tsx`'s desktop describe blocks:
- the two always-present-textbox assumption changes to "two always-present
  hidden inputs carrying `question`/`reference_answer`" — update
  `'renders empty textareas'` accordingly (rename/rewrite, don't leave a
  stale false-passing test)
- `FormatToolbar` renders in each face's header, right-aligned
- Tab-to-flip (existing test) still passes with the new face wiring
- Save still submits `question`/`reference_answer` via the hidden inputs
  regardless of which face was last edited (the core regression this whole
  effort hinges on) — extend the existing "Save navigation" test to also
  assert the submitted `FormData`/action payload contains both fields with
  typed content
**Green:** Replace the two `<textarea>` blocks (lines 73-83, 94-104) with
`<MarkdownFace name="question" .../>` / `<MarkdownFace name="reference_answer" .../>`,
each with its `FormatToolbar` in `CardHeader`'s right slot. Remove
`questionRef`/`answerRef` textarea refs in favor of whatever
`MarkdownFace` exposes for focus management (or keep thin wrapper refs if
`CardEditor.tsx`'s Tab-handler still needs to call `.focus()` on the
active face after a flip — confirm this during implementation, don't
guess ahead of the code).
**Depends on:** 3.1, 4.1.

### Task 5.2 — `MobileCardEditor.tsx`
**Red:** Mirrors 5.1's test updates for the mobile component, plus: the
mobile face header shows a "Done" pill while that face is editing (asserts
presence/absence tied to the face's `editing` state), and `FormatToolbar`
renders in the bottom bar (`size=38`), not the face header.
**Green:** Same replacement as 5.1, using the mobile layout from
`Card Editor.html` / `editor-simple.jsx`'s `EditorSimple_Mobile` (lines
111-131) for toolbar placement and the Done pill.
**Depends on:** 3.1, 4.1.

### Task 5.3 — `CardEditor.tsx`: reconcile Tab-to-flip
**Red:** Extend the existing "Tab to flip" test(s): Tab while the caret is
inside an open code fence in the question face does **not** flip (focus
stays on the question textarea, face stays the question); Tab outside a
fence still flips, unchanged from today.
**Green:** Adjust `handleKeyDown` (`CardEditor.tsx` lines 64-73) and/or how
it's threaded to `MarkdownFace`/`useMarkdownFace`'s own `onKeyDown` so the
face-local handler's `stopPropagation()` (Task 2.3) actually prevents the
outer flip — this may mean `onKeyDown` moves from a raw prop passed to a
`<textarea>` to a callback `MarkdownFace` invokes only for the "not
consumed locally" case, rather than both handlers independently observing
the same event. Resolve the exact seam during implementation; don't
over-design it here.
**Depends on:** 5.1, 5.2.

## Phase 6 — Verification

### Task 6.1 — Full suite and build
**Do:** `npm test` and `npm run build`, both green, no tests skipped or
deleted to get there.
**Depends on:** all of Phases 0-5.

### Task 6.2 — Live browser check (desktop + mobile)
**Do:** In the dev server (and Chrome DevTools MCP for a mobile viewport):
type a question with **bold**, a fenced ` ```python ` block, and inline
`$math$`; flip to the answer and back — confirm the question face now
shows *rendered* output (this is the auto-grow/`ResizeObserver` behavior
from Task 2.4 that isn't unit-tested — watch for the textarea sizing
correctly as you type multi-line content, both faces); click back into the
rendered question to confirm it reopens as raw Markdown text, cursor at
the end; confirm ⌘B/⌘I and the toolbar buttons all work; confirm Tab inside
a fenced block inserts a tab-width of spaces without flipping, and Tab
outside one still flips; Save still navigates to the new card as today;
Cancel unchanged.
**Depends on:** 6.1.
**Acceptance criteria (spec):** all checkboxes in
`docs/specs/issue-18-markdown-card-editor/spec.md` — tick them off there.
