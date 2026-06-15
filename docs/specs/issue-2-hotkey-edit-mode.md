# Issue #2 — Unnecessary double flip on card face animation when transitioning from view to edit mode.
https://github.com/kaliaparijat/succinctly/issues/2

## Problem
This problem is described in the Github issue linked above but this problem is now evolved from the original position and talks a few more issues. 
As a user, viewing a card, I want to be able to transition into editing the card (question or answer) by double clicking on the card. When the user double clicks on the card, two flips are performed, before the user can see the card face in edit mode. 
When the user is in the edit mode, they see a border bottom added to the contenteditable div, and the original position of the text shifts slightly.

## Acceptance Criteria
- When the user is on the decks route, then the user is viewing a card and when the user double clicks on the cardface, then the user is transitioned into the edit mode for the card immediately without any flip animations 
- When the user is in the edit mode for a cardface, they do not see a border-bottom added to the contenteditable div
- When the user transitions from the view to the edit mode for a cardface, then the text position does not shift.

