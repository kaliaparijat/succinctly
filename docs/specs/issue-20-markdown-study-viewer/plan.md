# Plan: issue-20-markdown-study-viewer

Source spec: `docs/specs/issue-20-markdown-study-viewer/spec.md`
(issue #20: https://github.com/kaliaparijat/succinctly/issues/20)
Delivered on the `issue-18` branch / PR #19 with #18's work.

## Context

`DesktopStudyViewer` / `MobileStudyViewer` render `card.question` / `card.reference_answer` as plain
strings and edit through a `contentEditable="plaintext-only"` div. `StudyViewer.tsx` owns the edit
lifecycle: `editingFace`, `editRef`, the `saved` local state + rollback added by #21, and the
`handleEditSave` / `handleToggleFace` / `handleEditBlur` / `handleEditKeyDown` handlers. This plan
swaps the display for `MarkdownRenderer` and the editor for a Markdown textarea + `FormatToolbar`,
reusing #18's `useMarkdownFace`, `MarkdownFace` and `FormatToolbar`, while keeping the lifecycle
handlers and their behavior.

## What #21 and the live app changed about this plan

Reading the shipped code (and the three bugs it surfaced) changed the plan from the spec's first
draft:

1. **`StudyViewer` already has a source of truth for saved text** (`saved` merged over server props,
   with rollback). The Markdown editor must seed from and save through that merged `card`, never from
   `cards[idx]` — otherwise bug 2 (stale flash) and bug 3 (lost edits) return. Every edit task below
   asserts against pending-save state, not just the post-refresh state.
2. **Empty-text rules are already implemented** in `handleEditSave` (clear one face = save; both
   empty = revert, nothing saved, toggle still switches). They are preserved, not rebuilt; the
   migrated tests keep those cases.
3. **Click semantics differ from the create editor.** `MarkdownFace` opens edit on a single
   mousedown on its rendered view. In the study viewer a single click/tap *flips* the card
   (`onClick={onFlip}` / `handleClick`), and edit starts from double-click (desktop) or the pencil
   (mobile). `MarkdownFace` therefore needs a display-only mode (`openOnClick={false}`), or the
   viewer uses `MarkdownRenderer` directly. Without this, every flip click would open the editor.
4. **Escape must cancel, but `useMarkdownFace`'s Escape handler calls `el.blur()` first.** A blur
   handler that saves would save on Escape. #15 avoided this by clearing `editingFace` before the
   blur lands; the new flow needs the same guarantee, with a test (the existing "Escape-to-cancel
   followed by blur does not trigger a save" test is the model).
5. **The hook's `text` is initial-only.** `useMarkdownFace` takes `initialText` once; the viewer
   re-enters edit mode many times per card and across cards. It needs a way to seed on entry
   (`open(seedText)`), or edit text will be stale from the previous card.
6. **Two `editing` states would drift.** The viewer's `editingFace` and each hook's own `editing`
   must not both be sources of truth. The plan makes the hooks' `editing` the only state and derives
   `editingFace` from it.
7. **jsdom can't prove the layout/3D behavior** (the #18 lesson: backface hit-testing, flipped-face
   focus). Those get an explicit live check, not just unit tests.
8. **Test migration is real work.** Existing viewer edit tests set `contentEditable.innerText`; they
   move to textarea value changes in the same commit as the swap (see 2.2).

## Process: every task is test-first

Red (failing test, confirmed for the right reason) → green (smallest change) → refactor with tests
green. One logical change per commit, suite green after each. Phase 4 is verification only.

## Dependency graph

```
1.1 display-only face ──┐
                        ├─ 1.2 desktop render ─ 1.3 mobile render ─ 1.4 empty face ─ 1.5 layout
2.1 hook: seed + cancel ┘
        │
2.2 swap contentEditable → Markdown textarea (migrates existing edit tests)
        │
2.3 toolbar (desktop header / mobile) ─ 2.4 mobile Done ─ 2.5 ⌘B/⌘I, Tab-in-fence in viewer
        │
3.1 createCard both-empty guard ─ 3.2 CardEditor stays put on null ─ 3.3 disabled Save
        │
4.x cleanup, verification, PR
```

## Phase 1 — Display

- [ ] **1.1 `MarkdownFace` display-only mode.** Red: with `openOnClick={false}`, mousedown on the
      rendered view does not open editing (existing default behavior unchanged). Green: new prop.
- [ ] **1.2 Desktop viewer renders Markdown.** Red: card `*italic* and \`code\`` renders `<em>` and
      `<code>`, bold/list/fenced code/math too (one test each). Green: replace `{!isEditing && text}`
      in `DesktopStudyViewer`'s `CardFace` with `MarkdownRenderer`.
- [ ] **1.3 Mobile viewer renders Markdown.** Same tests against `MobileStudyViewer`.
- [ ] **1.4 Empty faces render cleanly.** Red: `reference_answer: ''` (and empty question) renders the
      placeholder, no errors, layout intact; double-click (desktop) / Edit (mobile) still enters edit
      mode on it. Green as needed.
- [ ] **1.5 Layout tokens.** Class assertions for face padding (26/44/74 desktop, 18/20/66 mobile,
      applied on the face's own wrapper — see #18's absolute-positioning padding lesson) and
      vertical centering of short single-block text. Open: see Questions.

## Phase 2 — Edit

- [ ] **2.1 `useMarkdownFace`: seed + cancel.** Red: `open(seed)` replaces text and puts the caret at
      the end; `cancel()` closes without invoking an `onClose`/save callback and restores seed.
      Green: add both. (Hook tests in `useMarkdownFace.test.ts`.)
- [ ] **2.2 Swap `contentEditable` for the Markdown textarea.** Red: migrate the existing edit tests
      in `StudyViewer.test.tsx` from `innerText` to textarea changes — blur saves, Escape cancels,
      ⌘↵ saves, toggle saves and switches, #21's cases (clear one face; both-empty reverts; edits
      survive toggle; save built from merged text; failed save rolls back; pending save shows
      edited text). Add: caret at end on entry; shortcuts disabled while editing. Green: two
      `useMarkdownFace` instances in `StudyViewer` (hooks' `editing` is the only state;
      `editingFace` derived), `MarkdownFace` as the editing surface on both viewers, `editRef`
      removed. One commit, because the swap and the test migration cannot be green apart.
- [ ] **2.3 Formatting toolbar.** Red: toolbar present only while editing, in the card header on both
      desktop and mobile (compact buttons, replacing the deck name; mobile keeps clear of the
      keyboard); buttons call the editing face's `fmt`. Green: wire `FormatToolbar`.
- [ ] **2.4 Mobile "Done".** Red: tapping Done saves (not cancels), via `onMouseDown` preventDefault.
- [ ] **2.5 Keyboard.** Red: ⌘B/⌘I, list continuation, Tab in a fence inserts 4 spaces and does not
      flip/navigate.

## Phase 3 — Creating a card

- [ ] **3.1 `createCard` both-empty guard.** Red (`createCard.test.ts`): both faces empty or
      whitespace-only → nothing inserted, returns `null`. Green.
- [ ] **3.2 `CardEditor` handles `null`.** Red: Save on a blank card does not navigate and shows
      no error. Green: skip `navigateWithTransition` when `createCard` returns null.
- [ ] **3.3 Disabled Save + ⌘↵ guard.** Red: Save is disabled while both faces are blank
      (`trim() === ''`) on desktop and mobile, enabled once either has text; ⌘↵ does not submit
      while blank. Green: derive from the two faces' text in `CardEditor`.

## Phase 4 — Verification

- [ ] **4.1** Delete unused `contentEditable` code/props/types; `npm test`, `tsc --noEmit`,
      `npm run lint` (no new errors), `npm run build`, no skipped tests.
- [ ] **4.2 Live check** at 1280×800 and 390×844 (jsdom can't cover these): Markdown renders on both
      faces after a flip; single click still flips, double-click edits; view ↔ edit does not resize
      the card; the first and second face are both editable after a toggle (backface hit-testing);
      replay #21's three bugs (clear a face then toggle; flash after blur; edit one face, toggle,
      edit the other); an empty face; a card with code + math.
- [ ] **4.3** browser-qa against the PR preview (desktop + mobile), including WebKit for the Q/A
      toggle's mousedown handling.
- [ ] **4.4 PR #19:** title/body cover #18 and #20 with "Closes #18" and "Closes #20"; verify
      with `gh pr view 19 --json closingIssuesReferences` that exactly those are linked.

## Decisions and open questions

Decided:
1. **Vertical position:** short text stays vertically centered when viewing; when editing, the text
   area is top-aligned (as when the card was created). Top-align once content overflows too.
2. **Text size:** keep the viewer's current sizes (fluid 20–40px desktop, 27px mobile).
   `MarkdownRenderer` gets a way to take a CSS size.
3. **Mobile toolbar:** while editing on mobile the toolbar goes in the card header, not a bottom bar,
   so the iPhone keyboard can't cover it. #18's create editor should follow the same placement.
   Verify on a real iPhone via the Vercel preview of PR #19.
5. **Blank new card:** Save is disabled while both faces are blank and ⌘↵ does nothing.

Open:
4. **Editing font.** The design handoff specifies a monospace editing box; the shipped create editor
   uses the serif card font. Recommendation: fix the create editor to match the design first (it is
   a defect against #18's acceptance criteria), and the viewer inherits it.
