# Study viewer inline edit bugs

Issue: https://github.com/kaliaparijat/succinctly/issues/21

Fixes three bugs in the #15 inline card edit (`components/cards/StudyViewer.tsx`, with the
`DesktopStudyViewer` / `MobileStudyViewer` faces). Production code only — no Markdown involved.
The issue-20 spec builds on this fix; the save/rollback state lives in `StudyViewer` and survives
that work.

## Problems
1. **Edit mode disappears after clearing a face.** `handleEditSave` returns early on empty text
   (`if (!text) return`), which skips `setEditingFace(nextFace)`. `handleToggleFace` still flips the
   card, but editing never moves to the other face.
2. **Original text flashes after blur.** A save sets `editingFace` to null, then runs
   `updateCardInline` + `router.refresh()`. The shown `card` comes from server props and is stale
   until the refresh lands.
3. **Edits lost on toggle.** Same stale `card`: flipping back shows the old text. Saves are also built
   from the stale card (`question = … : card.question`), so editing both faces before the refresh
   lands can overwrite the first edit with the old value.

## Behavior
- **Local saved state.** `StudyViewer` keeps `saved: Record<cardId, { question, reference_answer }>`.
  The displayed and saved-from card is `{ ...cards[idx], ...saved[id] }`. A save updates `saved`
  synchronously, before `updateCardInline` is awaited, so there is no frame showing stale text.
  `router.refresh()` still runs afterwards to reconcile with the server.
- **Rollback.** If `updateCardInline` throws, `saved[id]` is restored to its previous value and the
  viewer shows the last successfully saved text. No new error UI in this fix; failure signals are tracked in #22.
- **Empty text.** Clearing one face is a normal save. If the edit would leave *both* faces empty
  (`trim() === ''`), nothing is saved and the face reverts to its last saved text; the toggle still
  switches faces. Once card delete exists, this case becomes a delete (tracked in #23).
- **Unchanged:** blur-to-save, Escape-to-cancel, ⌘↵, blurring to the Q/A toggle, the WebKit
  `preventDefault` on the toggle's mousedown.

## Tasks
Each task is red test → minimal green → its own commit, tests green after each.
- [ ] 1. Clearing a face then toggling moves editing to the other face (bug 1). Empty text saves
      unless both faces would be empty.
- [ ] 2. Both faces empty: nothing saved, text reverts, toggle still switches.
- [ ] 3. After blur, the edited text shows immediately even while `updateCardInline` is still
      pending (mock never resolves) — bug 2. Introduces `saved` state.
- [ ] 4. Edit Q, toggle to A and back: Q shows the edit. Edit A and save: `updateCardInline` receives
      the edited Q, not the stale one — bug 3.
- [ ] 5. `updateCardInline` rejects: text rolls back to the last saved value.
- [ ] 6. Verify: `npm test`, `npm run build`, live check at 1280×800 and 390×844, then browser-qa
      against the Vercel preview after the PR is open.

Existing blur/toggle/Escape tests in `__tests__/StudyViewer.test.tsx` must stay green; the new
tests go in that file's "blur saves the inline edit (#15)" neighbourhood.

## Follow-ups
- #22 — validation and failure signals when a card save fails (enhancement)
- #23 — editing a card to both-empty should delete it (bug)
