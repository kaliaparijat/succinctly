# Card Save Behaviour — Create vs Edit

## Problem
The save behaviour between create mode (CardEditor) and edit mode (inline StudyViewer) is inconsistent, and the current "Save card" label in create mode doesn't clearly communicate what's happening. The two modes need a clear, intentional distinction.

## Decision
Create and edit are different contexts and intentionally have different save behaviour:
- **Create mode**: explicit save trigger. The card does not exist yet — the user should consciously decide when it's ready.
- **Edit mode (inline)**: auto-save. The card already exists — saving on face switch and on exit is natural.

---

## Create Mode (CardEditor)

### Behaviour
- No auto-save. Nothing is written to the database until the user explicitly submits.
- The user writes Q, optionally flips to A via QAToggle, writes answer, then hits "Add card".
- Partial cards are allowed — a card with only a question and no answer is valid.
- After saving, navigate to the new card's position in the study viewer (not back to the start of the deck).

### Changes
- Rename "Save card" → "Add card" in create mode
- Rename "Save changes" → "Done" in edit mode (CardEditor opened for an existing card)
- Remove the ⌘↵ keyboard hint from the button label (keep the shortcut working, just remove the visual clutter)

### Not Doing
- Auto-save on blur or keystroke in create mode
- Navigating back to deck start after save (tracked separately — see issue #3)

---

## Edit Mode (Inline — StudyViewer)

### Behaviour
- Auto-save on QAToggle face switch — current face saves before flipping
- ESC discards unsaved changes on the current face and exits edit mode
- No explicit save button — the user signals "done" by exiting edit mode (ESC) or switching faces

### Changes
- None — this behaviour is already implemented and correct

### Not Doing
- Adding a "Done" or "Save" button to inline edit mode
- Auto-save on keystroke or blur (overkill for this use case)
