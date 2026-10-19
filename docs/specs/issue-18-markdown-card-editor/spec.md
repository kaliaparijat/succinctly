# Markdown Card Editor

Issue: https://github.com/kaliaparijat/succinctly/issues/18

Design reference: `design_handoff_succinctly/card_editor_improvements/` (`README.md`,
`Card Editor.html`, `editor-shared.jsx`, `editor-simple.jsx`). Decision history for
the scope cuts below: this spec's own PR discussion (no separate questions doc).

## Problem
`CardEditor`'s two faces are plain `<textarea>` fields — no formatting, no code,
no math. The design handoff replaces each face with a GitHub-comment-style
Markdown field: rendered (bold/italic/inline+fenced code with syntax
highlighting/KaTeX math/lists) until clicked, then a raw Markdown textarea;
Esc/blur/mobile-"Done" renders it again. A formatting toolbar (Bold/Italic/Code/
Math/List) sits in the card header (desktop) or a bottom bar (mobile), with
⌘B/⌘I shortcuts and smart list continuation.

## Scope
`CardEditor` create mode only (desktop + mobile), i.e. `DesktopCardEditor.tsx` /
`MobileCardEditor.tsx`. Per the design doc's Card/Rendered-content/Editing-state
sections for exact tokens, colors and sizing.

## Non-Goals
- **No "Save & next" flow.** The prototype's only wired-up save path resets the
  form in place for rapid multi-card entry. Production keeps today's explicit
  Save → `createCard` → `navigateWithTransition` to the new card's page
  (`CardEditor.tsx`'s existing `formAction`). Decided over adopting the
  prototype's flow because it's a bigger, separately-worth-designing UX change
  (toast timing, "N saved" copy, abandoned-draft handling) than the Markdown
  authoring interaction itself.
- **No image upload/paste.** The prototype inserts images via
  `URL.createObjectURL` blob URLs and its own README says production needs
  real upload/storage. That storage path (bucket, upload endpoint, draft
  cleanup for unused uploads) doesn't exist yet — deferred to a follow-up
  issue. Ship Bold/Italic/inline+fenced code/Math/Lists only; the toolbar has
  no Image button in this round.
- **No `StudyViewer` rendering changes.** Cards continue to render as plain
  text when studying. Markdown source saved here will show its raw syntax
  (`**bold**`, `` `code` ``) in the viewer until a follow-up spec gives it the
  same renderer. Flagged explicitly so it isn't mistaken for a bug.
- **No edit-mode work.** Unchanged from `docs/specs/mobile-card-editor/mobile-card-editor.md`:
  `CardEditor`'s `isEdit` branch isn't reachable in production (only
  `/cards/new` renders it).
- **No schema change.** `question` / `reference_answer` stay plain `text`
  columns — Markdown source *is* the stored string, same as today.

## Architecture

### New dependencies
- `katex` (math rendering) — `katex/dist/katex.min.css` must be imported
  somewhere global (bundles KaTeX's webfonts via webpack; no CDN).
- `highlight.js` (code syntax highlighting) — import the core
  (`highlight.js/lib/core`) plus only the languages actually needed —
  `python`, `javascript`, and `typescript` to start, since those cover the
  design's sample content and the languages a flashcard app's users are most
  likely to actually write cards about; add more on demand — rather than the
  full `highlight.js` bundle, to keep JS payload down.
  **Do not** import a stock highlight.js theme stylesheet (e.g.
  `github-dark`, `atom-one-dark`). Those ship their own complete, fixed color
  palette, so layering the design's exact syntax colors (keyword `#F5D96B`,
  string `#B8DFC4`, number/literal `#F2A68F`, comment
  `rgba(237,230,214,0.45)` italic, function title `#A8C8E8`, meta
  `#D4BFE8`) on top would mean two independent stylesheets both claiming the
  same `.hljs-*` classes — a specificity fight today, and silent drift
  tomorrow if the stock theme's package version bumps and changes its rules.
  hljs's token classes (`.hljs-keyword`, `.hljs-string`, `.hljs-built_in`,
  `.hljs-comment`, `.hljs-title.function_`, `.hljs-meta`, …) are themeable on
  their own — map them directly to the design's tokens in one small app CSS
  block, so the card's syntax colors have a single source of truth (the
  design tokens) instead of a theme file plus overrides.
- The prototype's `{1|2-3}` code-block line-step/highlight syntax is
  explicitly out of scope per its own README — don't port it.

### New modules
- `lib/markdown.ts` — pure parse/render functions ported from
  `editor-shared.jsx`'s `parseMD` / `inlineHTML` / `tex`: paragraph, fenced
  code, display/inline math, bullet list, and image-syntax detection (parsed
  but rendered as a no-op/placeholder in this round, since image upload is
  deferred — don't error on `![]()` syntax, just don't make it interactive).
- `components/cards/markdown/useMarkdownFace.ts` — per-face hook ported from
  `editor-simple.jsx`'s `useSimpleFace`: `text`/`editing` state, `open()`/
  `close()`, selection-aware `fmt(kind)` insertion (bold/italic/code/math/
  list), auto-growing textarea height, and `onKeyDown` (Escape → blur+close;
  ⌘B/⌘I → `fmt`; Tab inside an open fence → insert 4 spaces + stop
  propagation so the outer Tab-to-flip handler doesn't also fire; Enter on a
  `- item` line → continue the list, on an empty `- ` line → end it).
- `components/cards/markdown/MarkdownFace.tsx` — wires the hook to markup:
  renders `lib/markdown.ts` output when `!editing` (or the placeholder when
  empty), a `<textarea>` when `editing`. Click/mousedown on the rendered view
  or the empty-space filler opens editing; blur outside the face closes it
  (same outside-click logic as `editor-simple.jsx`'s `SimpleFace`).
- `components/cards/markdown/FormatToolbar.tsx` — Bold/Italic/Code/Math/List
  buttons (no Image). One component, sized via props: compact 26px icons for
  the desktop face header, 38px hit targets for the mobile bottom bar
  (matches `SimpleFmtBar`'s `size`/`gap` props).

### Form submission (the one real gotcha)
The prototype has no `<form>` — it keeps face text in React state and reads
it directly (`d.q.text`) on save. Production submits via a native
`<form action={formAction}>` reading `FormData` by `name`. Because a face's
visible `<textarea>` only exists while `editing` is true, a plain
`<textarea name="question">` would silently drop from the submission the
moment that face auto-renders (e.g. user types the question, flips to the
answer, and the question face renders). **Fix:** `MarkdownFace` keeps the
Markdown source in its own state regardless of editing/rendered display, and
renders an always-present `<input type="hidden" name={name} value={text} />`
alongside the (sometimes-absent) visible `<textarea>`. The visible textarea
itself carries no `name` — it's write-only UI for the hidden input's value.

### Initial state
Both faces start in `editing` mode on a fresh `/cards/new` (Question
autofocused, same as today). This isn't what the prototype's demo harness
does (it opens with Answer flipped-to and *not* editing, for screenshot
purposes), but starting both faces open preserves today's "just start typing
either face" flow with no extra click, and still gets the real payoff of the
redesign: flip Question → Answer and back, and Question now shows its
*rendered* Markdown (bold applied, code highlighted) rather than raw syntax,
because `editor-simple.jsx`'s flip behavior renders the outgoing face once
the flip animation completes (~420ms) and opens the incoming face in edit
mode immediately.

### Existing Tab-to-flip integration
`CardEditor.tsx`'s top-level `handleKeyDown` (Tab → flip face, focus the
other side after `flipDuration`) stays, but face-local Tab handling (insert
4 spaces inside an open code fence) must run first and call
`stopPropagation()` to suppress it — see `useMarkdownFace.ts` above.

## Behavior
- **Enter edit mode:** click/tap the rendered face (caret goes to text end),
  or Tab/QA-toggle flips to a face that was already editing before the flip.
- **Exit edit mode:** Esc, blur to anything outside the face. (No mobile
  "Done" pill needed as a *separate* mechanism if Esc/blur alone cover it on
  touch — but per the design, include the Done pill in the mobile face
  header while editing, since tap-to-blur is less discoverable on mobile.)
- **Toolbar:** Bold (⌘B) wraps selection in `**…**`, keeps inner text
  selected. Italic (⌘I) → `*…*`. Code: single-line selection → `` `…` ``;
  no/multi-line selection → inserts a fenced ` ```python ` block with caret
  inside. Math: inline `$…$` for a selection/mid-line caret, else a `$$`
  block. List: prefixes the current line with `- `. Toolbar buttons call
  `preventDefault()` on `mousedown` so the textarea never loses focus/
  selection.
- **Flip duration:** unchanged — respects the `flipSpeed` preference /
  `flipDuration` prop already threaded through `CardEditor`.
- **Landscape (mobile):** same CSS-variant approach as the existing mobile
  card editor spec — manual/devtools-verified, not unit-tested.

## Acceptance Criteria
- [ ] Each face renders Markdown (bold, italic, inline code, fenced code with
      syntax highlighting, inline/display math, bullet lists) when not being
      edited, and a raw Markdown textarea when clicked/tapped into
- [ ] Formatting toolbar (Bold/Italic/Code/Math/List — no Image) present on
      both faces, desktop (header, right-aligned) and mobile (bottom bar);
      ⌘B/⌘I work from anywhere in the textarea
- [ ] Tab inside an open fenced code block inserts 4 spaces and does not flip
      the card; Tab elsewhere still flips, matching today's behavior
- [ ] Submitting the form always includes both faces' current Markdown
      source in `FormData` (`question`, `reference_answer`), regardless of
      which face is currently rendered vs. editing
- [ ] Save still calls `createCard` and `navigateWithTransition` to the new
      card's page, unchanged from current behavior (no "Save & next")
- [ ] Cancel behavior (previousCardId-or-`/library`) unchanged
- [ ] No Image button/paste/drop handling present in this round
- [ ] `StudyViewer` is untouched — cards still render as plain text there
- [ ] At >768px and ≤768px, respectively, the editor matches the design
      doc's desktop/mobile tokens for the face chrome, toolbar and rendered
      content styles
- [ ] `npm test` and `npm run build` pass
