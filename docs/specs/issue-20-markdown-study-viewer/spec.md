# Markdown in the Study Viewer

Issue: https://github.com/kaliaparijat/succinctly/issues/20

Delivered on the `issue-18` branch / PR #19, together with #18's work (one PR to review, test and merge).

Plan: `plan.md` (this folder). Builds on `docs/specs/issue-18-markdown-card-editor/spec.md`, which shipped Markdown
authoring for new cards and explicitly deferred the two items below.

## Problem
- Existing cards can't be edited in Markdown: `DesktopStudyViewer` / `MobileStudyViewer` edit
  through a plain-text `contentEditable="plaintext-only"`.
- The viewers render `card.question` / `card.reference_answer` as plain strings, so Markdown
  source shows as literal syntax (`*italic*`, `` `code` ``).

## Scope
Both study viewers (`DesktopStudyViewer.tsx`, `MobileStudyViewer.tsx`), driven by `StudyViewer.tsx`.
Reuses `MarkdownRenderer`, `MarkdownFace`, `FormatToolbar` and `useMarkdownFace` from #18 — no new
parsing or rendering logic.

## Non-Goals
- No schema change; Markdown source remains the stored string.
- No image upload (still deferred, as in #18).
- No changes to `CardEditor` (create mode) beyond the #18 defect fixes tracked separately and the both-empty guard under Behavior.

## Behavior
- **Display:** each face renders via `MarkdownRenderer` (bold, italic, inline/fenced code with
  highlighting, math, lists). **Empty faces are valid and must render cleanly.** `createCard` does
  no validation, so a card can be saved with an empty question or answer (e.g. the user blurs out
  of the mobile editor and saves with one face untouched). An empty face renders
  `MarkdownRenderer`'s muted placeholder ("What's the question?" / "Write the answer…") with no
  errors, keeps the full card layout, and double-click / Edit still enters edit mode on it.
- **Enter edit mode:** unchanged entry points — double-click on desktop, Edit button on mobile.
  The face being edited is the currently visible one. The caret starts at the end of the text.
- **Editing UI:** the visible face becomes a `MarkdownFace` textarea. The `FormatToolbar` appears
  in the card header on both desktop and mobile (compact buttons, so the iPhone keyboard cannot cover it).
  ⌘B/⌘I, list continuation and Tab-in-fence behave as in #18.
- **Save/cancel (preserve #15):** blur away from the face saves via `updateCardInline`; ⌘↵ saves;
  Esc cancels and restores the last saved text; blurring *to* the Q/A toggle saves and switches the
  edited face while staying in edit mode (`handleToggleFace`). **Empty-text rules (decided; the study-viewer half already shipped in #21 for the
  `contentEditable` path — keep the same behavior through `MarkdownFace`, and keep #21's
  `saved` local state / rollback logic rather than reintroducing server-prop-only rendering):**
  - Clearing *one* face of a card is a normal save.
  - Editing a card so *both* faces are empty is a deliberate discard, i.e. a delete. Until card
    delete exists (#23) this case saves nothing and reverts to the last saved text.
  - Saving a *new* card with both faces empty is a no-op: `createCard` inserts nothing and returns
    `null`; `CardEditor` stays on the page (no navigation, no error). "Empty" means
    `trim() === ''`, so whitespace-only counts as empty on every path above. The create
    editor's Save button is also disabled in that state and ⌘↵ does nothing.
- **Keyboard shortcuts:** study shortcuts (flip, next, prev, help) stay disabled while editing.
- **Layout (dynamic):** the edited face fills the card exactly as the rendered face does — it must
  not change the card's size when toggling between view and edit. Face padding is 26px 44px 74px
  on desktop and 18px 20px 66px on mobile (the bottom value clears the Q/A toggle), applied on the
  face's own wrapper, not inherited from an ancestor.

## Acceptance Criteria
- [ ] Study viewer renders Markdown on both faces, desktop and mobile
- [ ] A card with an empty question or answer renders the placeholder without errors and can
      be entered for editing (test: card with `reference_answer: ''`)
- [ ] Existing cards can be edited with the Markdown textarea and toolbar, desktop and mobile
- [ ] Editing a card, then blurring, persists the new source via `updateCardInline`
- [ ] Clearing one face and blurring saves the empty face; clearing both faces saves nothing
- [ ] Save on a new card with both faces empty (or whitespace-only) is disabled; ⌘↵ and the server
      both refuse it (inserts nothing, does not navigate)
- [ ] Esc cancels and restores the last saved text
- [ ] ⌘↵ saves; study shortcuts are inactive while editing
- [ ] Switching Q/A via the toggle mid-edit saves and keeps editing the other face
- [ ] Toggling view ↔ edit does not resize the card (checked at 390×844 and 1280×800)
- [ ] Padding matches the numbers above in both viewers
- [ ] Text keeps the viewer's current sizes; short text is vertically centered when viewing and
      top-aligned when editing
- [ ] The `contentEditable` path is removed; `npm test` and `npm run build` pass
