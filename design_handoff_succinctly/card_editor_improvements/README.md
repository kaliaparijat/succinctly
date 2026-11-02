# Handoff: Succinctly Card Editor (Markdown, GitHub-comment style)

## Overview
This replaces the plain-text card editor in Succinctly (flashcards) on desktop and mobile. Each card face (Question / Answer) is one Markdown field. The interaction works like a GitHub comment, but without tabs. The face shows **rendered** content until you click it. It then becomes a **raw Markdown textarea**. Clicking away, pressing Esc or tapping Done renders it again.

Supported content: paragraphs with **bold** / *italic* / `inline code`, fenced code blocks with syntax highlighting, KaTeX math (inline `$…$` and display `$$…$$`), bullet lists, and images (paste, drop or pick a file). Long answers scroll inside the card.

## About the Design Files
The files in this bundle are **design references created in HTML**. They are React/Babel prototypes that show the intended look and behavior. They are not production code to copy directly. The task is to **recreate these designs in Succinctly's existing codebase**, using its established framework, components, state handling and storage patterns. If a Markdown renderer, a highlighter or KaTeX already exists in the app, use those rather than the hand-rolled parser in `editor-shared.jsx`.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and interactions are final. Match them closely using the codebase's own primitives.

## Screens / Views

### 1. Desktop: New card (1280×800 reference)
- **Shell:** full-height column, background `#0A0A0B`.
  - Top bar, 56px tall, padding 0 28px, bottom border `rgba(255,255,255,0.08)`. Contains a back chevron (16px, muted) and "Algorithms · New card" (14px Inter Tight; " · New card" in faint).
  - Bottom hint bar, padding 12px 28px, top border, gap 22px.
- **Content:** centered column, gap 22px, padding 24px.
  - Card: max-width 760px, height 540px.
  - Footer row: the same 760px width.
- **Card face** (see Card below): header label "QUESTION" / "ANSWER" on the left. The formatting toolbar sits right-aligned in the header.
- **Footer row:**
  - Left: "CARD #4 · ALGORITHMS" (mono 11px, letter-spacing 0.8, uppercase, faint).
  - Right: toast, then buttons Cancel, Save and **Save & next** (primary, with a `⌘↵` kbd).
- **Hint bar:**
  - Click → edit
  - Esc → done
  - Tab → flip
  - ⌘B ⌘I → format
  - ⌘↵ → save & next
  - Each hint is a key pill (mono 10px, 4px 10px padding, pill radius, 1px `rgba(255,255,255,0.14)` border) followed by a label (mono 10px uppercase, faint).

### 2. Mobile: New card (402×874 reference, iPhone)
- **Header:** starts below the status bar (54px). Padding 2px 16px 10px.
  - Left: 34px round back button (`#17171A` fill, 1px border).
  - Center: "Algorithms · New card" (12px muted) over "card 4" (mono 10px faint).
  - Right: white pill "Save" (7px 14px, 12px/500).
- **Card:** fills the remaining height, padding 0 12px 10px.
- **Bottom bar:** `#111113`, top border, padding 8px 10px 30px.
  - Left: formatting toolbar with 38px hit targets, gap 0.
  - Right: a yellow pill "Next →" (`#F5D96B` bg, `#3A2E0A` ink, 10px 14px, 12.5px/600).
- **Done button:** while a face is editing, its header shows a "DONE" pill on the right (ink bg, card-yellow text, mono 9.5px uppercase, 5px 10px). Tapping it renders the face.

### Card (shared)
- **Flip card:**
  - Perspective 1800px.
  - Two absolutely positioned faces with `backface-visibility:hidden`. The back face is rotated 180° on Y.
  - Transition `transform 380ms cubic-bezier(0.4,0,0.2,1)`.
- **Face:**
  - Background `#F5D96B`, ink `#3A2E0A`, radius 22px.
  - Shadow `0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)`.
  - A subtle SVG fractal-noise overlay (multiply, 0.5 opacity; see `NOISE` in `editor-shared.jsx`).
- **Face header:**
  - Padding 11px 20px (mobile 10px 16px), min-height 28px.
  - Bottom border `#3A2E0A` at 12.5% alpha (`#3A2E0A20`).
  - Label: mono 10px, letter-spacing 0.8, uppercase, 55% opacity.
- **Face body:**
  - Scrollable. Padding 26px 44px 74px on desktop, 18px 20px 66px on mobile. The bottom padding clears the Q/A toggle.
  - Below the content is a filler area that also enters edit mode when clicked.
- **Q/A toggle:**
  - Centered and absolutely positioned 16px from the bottom (14px on mobile).
  - Pill container `#17171A`, padding 4, gap 4.
  - Buttons are 6px 16px, mono 12px uppercase "Q" / "A".
  - Active button: `#F5F5F7` bg, `#0A0A0B` text. Inactive: `rgba(245,245,247,0.4)` text.
- **Formatting toolbar:**
  - Buttons: Bold (Inter Tight 700 "B"), Italic (Instrument Serif italic "I"), Code, Math (Σ), List, Image.
  - Buttons are 26px square on desktop, 38px on mobile, radius 7.
  - Hover: `rgba(127,127,127,0.18)` background.
  - Buttons call `preventDefault` on mousedown so the textarea keeps focus and its selection.

### Rendered content styles (on card)
- **Paragraph:**
  - Instrument Serif, 25px desktop / 19px mobile, line-height 1.28, letter-spacing −0.3, `text-wrap: pretty`.
  - Blocks are spaced by gap = round(size × 0.55).
  - A face with a single paragraph block is centered.
- **Bold:** weight stays 400. Instead it gets a highlighter underline: `linear-gradient(transparent 62%, rgba(58,46,10,0.16) 62%)`.
- **Italic:** serif italic.
- **Inline code:** JetBrains Mono at 0.62em, `rgba(58,46,10,0.12)` bg, padding 2px 6px, radius 5, vertical-align 0.12em.
- **Code block:**
  - Background `#1E1B14`, radius 10, padding 9px 0 10px.
  - Mono 13px desktop / 10.5px mobile, line-height 1.6, text `#EDE6D6`, inset shadow `0 0 0 1px rgba(0,0,0,0.25)`.
  - Header: the language label (9.5px uppercase, `rgba(237,230,214,0.45)`).
  - Line numbers: 2.4ch wide, `rgba(237,230,214,0.28)`.
  - Scrolls horizontally.
  - Syntax colors:
    - Keyword / built-in: `#F5D96B`
    - String: `#B8DFC4`
    - Number / literal: `#F2A68F`
    - Comment: `rgba(237,230,214,0.45)` italic
    - Function title: `#A8C8E8`
    - Meta: `#D4BFE8`
- **Display math:** KaTeX display mode at 0.8 × paragraph size, horizontal scroll. Inline math renders inside paragraphs.
- **List:** serif at 0.92 × size, line-height 1.3, padding-left 1.1em.
- **Image:** max-width 100%, max-height 9 × size, radius 10, `object-fit: contain`.
- **Hover on rendered content:** `rgba(58,46,10,0.06)` background, radius 8. Uses −6px −10px margin and 6px 10px padding so the hover area bleeds past the text. Cursor: text.
- **Empty face placeholder:** serif at 30% opacity, "What's the question?" / "Write the answer…".

### Editing state (textarea)
- **Textarea:**
  - Transparent background, no border or outline.
  - JetBrains Mono 14px desktop / 12.5px mobile, line-height 1.65, color and caret in the ink color, min-height 6em.
  - Auto-grows: no internal scroll; the card body scrolls instead.
- **Placeholder:** "What's the question?   **bold**  `code`  $math$" at 35% opacity.
- **Footer under the textarea:**
  - Margin-top 14px, padding-top 8px, 1px dashed top border in the ink color at ~19% alpha (`#3A2E0A30`).
  - Mono 9.5px uppercase at about 60% ink (`#3A2E0A99`).
  - Text: "MARKDOWN SUPPORTED" · "PASTE, DROP OR CLICK TO ADD IMAGES".

## Interactions & Behavior
- **Enter edit mode:**
  - Click or tap the rendered face. The caret goes to the end of the text.
  - The New card flow opens with the Question face already editing.
- **Exit edit mode:**
  - Esc, blur to anything outside the face, or Done on mobile.
  - Toolbar clicks do not blur the textarea.
- **Flip** (Tab on desktop when not inside a code fence, or Q/A toggle):
  - The card keeps the current mode. If you were editing, the incoming face opens in edit mode at once. The outgoing face renders only after the flip finishes (~420ms), so content never visibly swaps mid-rotation.
  - If you were viewing, both faces stay rendered.
- **Toolbar / shortcuts:**
  - Bold (⌘B) wraps the selection in `**…**` and keeps the inner text selected.
  - Italic (⌘I) wraps it in `*…*`.
  - Code: a single-line selection becomes `` `…` ``. No selection, or a multi-line one, inserts a fenced block (`` ```python `` … `` ``` ``) on a new paragraph, with the caret inside.
  - Math: a selection, or a caret in the middle of a line, becomes `$…$`. Otherwise it inserts a `$$\n…\n$$` block.
  - List: adds `- ` at the start of the current line.
  - Image: opens the file picker.
  - If the face is rendered, a toolbar action switches it to edit mode first.
- **Lists:** Enter on a `- item` line continues the list with `- `. Enter on an empty `- ` line removes the marker and ends the list.
- **Tab inside a fenced code block** inserts 4 spaces and does not flip.
- **Images:** pasting an image from the clipboard, dropping a file on the face, or picking a file inserts `![filename](url)` as its own paragraph. The prototype uses `URL.createObjectURL`. Production should upload the image and insert the stored URL. Consider showing a placeholder while it uploads.
- **Save & next** (⌘↵ / Next):
  - The card slides out (translateX −48px, opacity 0, 200ms), then the fields reset.
  - A new card slides in from +48px.
  - The Question face opens editing and empty.
  - A toast "✓ Card N saved" (check icon `#B8DFC4`) fades in, then fades out after 1.8s.

## State Management
- **Per face:** `text` (the Markdown string, which is the stored value) and `editing` (boolean).
- **Per draft:** `face` (`'question' | 'answer'`). This flips the card.
- **Session:**
  - Card number `n`.
  - Toast text.
  - Slide animation phase (`'out' | 'in' | null`).
- **Storage:** save each face as plain Markdown. Rendering is a pure function of the text.
- **Rendering in study mode:** use the same renderer and styles as the rendered face.

## Design Tokens
- **Colors:**
  - App background `#0A0A0B`
  - Elevated surface `#111113`
  - Card surface (UI) `#17171A`
  - Hover `#1D1D21`
  - Border `rgba(255,255,255,0.08)`
  - Strong border `rgba(255,255,255,0.14)`
  - Text `#F5F5F7`
  - Muted text `rgba(245,245,247,0.6)`
  - Faint text `rgba(245,245,247,0.38)`
  - Flashcard background `#F5D96B`
  - Flashcard ink `#3A2E0A`
  - Code background `#1E1B14`
  - Code text `#EDE6D6`
- **Fonts:**
  - Instrument Serif (display; card content)
  - Inter Tight 300–700 (UI)
  - JetBrains Mono 400/500 (labels, code, editing)
- **Radii:**
  - Card face 22
  - Buttons 10
  - Code and images 10
  - Hover area 8
  - Toolbar buttons 7
  - Inline code 5
  - Pills 999
- **Motion:**
  - Flip: 380ms `cubic-bezier(0.4,0,0.2,1)`
  - Save & next slide: 200ms, same easing
  - Toast fade: 240ms

## Assets
- No raster assets.
- Icons are inline 24×24 stroke SVGs (stroke 1.7, round caps): back, arrow-right, code, sigma, image, list, check. Their path data is in `Ic` in `editor-shared.jsx`. Swap in the app's icon set if it has one.
- Fonts come from Google Fonts.
- KaTeX 0.16 is used for math, and highlight.js 11.9 for code.

## Files
- `Card Editor.html`: open this to see the desktop and mobile frames side by side.
- `editor-simple.jsx`: editor behavior, including the per-face state hook, toolbar actions, key handling, flip logic, and the desktop and mobile layouts.
- `editor-shared.jsx`: tokens, the Markdown parser and renderer (`parseMD`, `Block`, `CodeBlock`), the flip card, the Q/A toggle, the shells, the footer and the session/save-next hook.
  - Note: `CodeBlock` also supports a `{1|2-3}` line-step syntax left over from an earlier exploration. It is **out of scope**; don't implement it.
- `ios-frame.jsx`: the device bezel used for presentation only.
