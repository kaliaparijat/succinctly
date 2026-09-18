# Handoff: Succinctly — Mobile Redesign

## Overview
A mobile-first redesign of Succinctly, the flashcard app. The goal is for cards to dominate the viewport the way they do in native iOS apps: the library is a flat, tappable list of deck cards, and studying and editing are full-bleed single-card screens with no surrounding page chrome.

Three screens are covered: **Library**, **Study viewer** (`/decks/[id]`), and **Create / edit card** (`/decks/[id]/cards/new`, `/decks/[id]/cards/[cardId]`). Auth and Settings are deliberately out of scope — Settings appears only as a stub so navigation can be evaluated.

## About the Design Files
The files in this bundle are **design references created in HTML** — React-in-a-single-file prototypes showing intended look and behavior. They are **not production code to copy**. The task is to recreate these designs in the existing Succinctly codebase (Next.js App Router + React + Tailwind, with Supabase-backed server actions), using its established components, routes, and patterns.

Notable existing code the implementation should build on rather than replace:
- `components/library/LibraryScreen.tsx`
- `components/cards/StudyViewer.tsx`, `components/cards/CardEditor.tsx`
- `components/decks/DeckThumb.tsx`, `NewDeckModal.tsx`
- `components/ui/QAToggle.tsx`
- `lib/palette.ts`, `lib/greeting.ts`
- `lib/viewTransition.ts` + `components/PathnameTracker.tsx` — already implements `navigateWithTransition(router, href, direction)` wrapping the View Transitions API. Reuse this for the library→card transition described below.
- `hooks/useSwipeGesture.ts`, `hooks/useKeyboardShortcuts.ts`

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, and transition timings below are final and should be matched. The prototype targets a 390×844 iPhone viewport (and 844×390 landscape for the card screens only).

## Design Tokens

### Dark chrome (app surfaces)
| Token | Value |
|---|---|
| `bg` | `#0A0A0B` |
| `bgElev` | `#111113` |
| `bgCard` | `#17171A` |
| `bgHover` | `#1D1D21` |
| `border` | `rgba(255,255,255,0.08)` |
| `borderStrong` | `rgba(255,255,255,0.14)` |
| `text` | `#F5F5F7` |
| `textMuted` | `rgba(245,245,247,0.6)` |
| `textFaint` | `rgba(245,245,247,0.38)` |

### Card palettes (`bg` / `ink` pairs — matches `lib/palette.ts`)
| Name | bg | ink |
|---|---|---|
| butter | `#F5D96B` | `#3A2E0A` |
| sky | `#A8C8E8` | `#0F2940` |
| coral | `#F2A68F` | `#3A1509` |
| mint | `#B8DFC4` | `#0F3320` |
| lilac | `#D4BFE8` | `#2C1840` |
| sage | `#C5D4B0` | `#1F2B10` |

Semi-transparent ink derivations used on cards: `${ink}1c` for hairline dividers, `${ink}14` / `${ink}12` for tinted circular button and pill backgrounds.

### Typography
| Role | Family | Usage |
|---|---|---|
| Display | `"Instrument Serif", Georgia, serif` | deck names, card Q/A body, page headings, wordmark |
| Sans | `"Inter Tight", -apple-system, system-ui, sans-serif` | UI labels, buttons, body |
| Mono | `"JetBrains Mono", ui-monospace, monospace` | eyebrow labels, counters, hints (uppercase, letter-spaced) |

Sizes in use: 9, 10, 11, 12, 13, 14, 15, 17, 22, 26, 27, 28 px. Card body text is 27px portrait / 24px landscape; editor textarea 26px portrait / 22px landscape.

### Radii, shadows, motion
- Radii: `16px` deck rows and new-deck row, `22px` full cards, `999px` pills and circular buttons, `14px` misc.
- Deck row shadow: `0 1px 2px rgba(0,0,0,0.25), 0 4px 14px rgba(0,0,0,0.25)`
- Full card shadow: `0 1px 2px rgba(0,0,0,0.25), 0 18px 40px rgba(0,0,0,0.35)`
- Card flip: `transform 380ms cubic-bezier(0.4,0,0.2,1)` on `rotateY`
- Card slide (prev/next): `transform 220ms cubic-bezier(0.4,0,0.2,1)`
- View transitions: `360ms cubic-bezier(0.4,0,0.2,1)`
- Paper texture: an inline SVG `feTurbulence` fractal noise overlay (`baseFrequency 0.9`, 2 octaves, seed 4, alpha 0.06), applied as `position:absolute; inset:0; mix-blend-mode:multiply; opacity:0.5; pointer-events:none` on every colored card surface. Exact data URI is in the HTML file (`PAPER_NOISE`).

## Screens / Views

### 1. Library (`/library`)
**Purpose:** see all decks, start studying one, or create a new deck.

**Layout:** full-height flex column on `bg`. Fixed header block (`padding: 4px 20px 14px`), then a scrolling list (`flex:1; overflow-y:auto; padding: 4px 12px 16px`), then the bottom tab bar.

**Header, top to bottom:**
1. Wordmark row: a 14×18 `text`-colored rectangle, `border-radius:2px`, `rotate(-6deg)`, then "Succinctly" in display 17px, `letter-spacing:-0.2`. 8px gap. 18px bottom margin.
2. Eyebrow: mono 10px, `letter-spacing:0.8`, uppercase, `textFaint` — "Your library · N decks". 6px bottom margin.
3. Greeting: display 28px, weight 400, `letter-spacing:-0.5`, `line-height:1.08` — "Good evening." followed by an italic `textMuted` `<em>` "What are we studying?". Greeting text comes from `lib/greeting.ts`.

**New-deck row (first item in the scroll list):**
- Full width, `padding: 16px 20px`, `border-radius:16px`, `background:transparent`, `border:1.5px dashed` `border` token, `margin-bottom:10px`.
- Flex row, `gap:10px`: a 30×30 circle (`bgCard`, 1px `border`) containing a 14px plus icon at stroke 2, then "New deck" in sans 14px weight 500, `textMuted`.
- Deliberately reads as an action, not a deck. It is pinned at the top of the list so it is reachable without scrolling regardless of deck count. This was chosen over a header `+` button and a sticky bottom bar.
- Tapping it creates a deck (name "Untitled deck", next unused palette) and navigates straight into the new-card editor for that deck.

**Deck row (one per deck):**
- Full-width button, `padding: 18px 20px`, `border-radius:16px`, `margin-bottom:10px`, background = palette `bg`, paper-noise overlay, deck-row shadow.
- Flex row, space-between. Left: deck name in display 22px, `letter-spacing:-0.3`, `line-height:1.1`, palette `ink`; below it mono 10px uppercase `letter-spacing:0.6`, `ink` at 55% opacity, `margin-top:4px` — "N cards" (singular "1 card").
- Right: a 30×30 circle, background `${ink}14`, containing a 15px plus icon at stroke 2 in `ink`. This is a nested action — it must `stopPropagation` and go to the deck's new-card route rather than opening the deck.
- Tapping the row itself opens the deck's **first** card. It does **not** expand an inline list of cards; per-card navigation happens inside the viewer.

**Tab bar (bottom):** two items, Library (grid icon) and Settings (gear icon). `border-top: 1px solid` `border`, `background: rgba(10,10,11,0.92)`, `backdrop-filter: blur(12px)`, `padding: 9px 0 4px` per item plus `padding-bottom:6px` on the bar. Icon 20px (stroke 2 active, 1.6 inactive) over a 10px sans label, `gap:3px`. Active `text`, inactive `textFaint`. The tab bar is hidden entirely on the viewer and editor screens.

The prototype also contains a "Top bar only" navigation variant (no tab bar; a small mono "Settings →" link centered at the bottom of Library, and a back-chevron row on Settings). This was an exploration — **implement the bottom tab bar**; the variant is included only for reference.

### 2. Study viewer (`/decks/[id]`)
**Purpose:** study one card at a time; move through the deck; jump into editing.

**Layout:** flex column: top bar (`padding: 2px 16px 10px`), card area (`flex:1; overflow:hidden; padding: 0 12px 8px`), bottom control row (`padding: 6px 20px 14px`). Landscape tightens these to `0px 16px 6px`, `0 20px 4px`, and `2px 20px 8px`.

**Top bar:** 34×34 circular back button on the left (`bgCard`, 1px `border`, 16px chevron-left); centered two-line label — deck name in sans 12px `textMuted` over "idx+1 / total" in mono 10px `textFaint`, `margin-top:1px`; 34×34 circular edit button on the right with a 15px pencil icon, routing to that card's edit page.

**Card:** fills the card area. Wrapper has `perspective: 1800px`; inner has `transform-style: preserve-3d` and `rotateY(0deg | 180deg)`. Two faces, each `position:absolute; inset:0; border-radius:22px`, palette `bg`, `backface-visibility:hidden`, back face pre-rotated `rotateY(180deg)`, card shadow, noise overlay.

Each face is a flex column:
- Face header: `padding: 18px 22px 14px`, `border-bottom: 1px solid ${ink}1c`, space-between — left "QUESTION"/"ANSWER" in mono 10px uppercase `letter-spacing:0.8`, `ink` at 50%; right the deck name in sans 11px, `ink` at 40%.
- Body: `flex:1`, centered both axes, `padding: 18px 26px` (landscape `6px 40px`). Text in display 27px (landscape 24px), `line-height:1.28`, `letter-spacing:-0.3`, centered, `text-wrap: pretty`, color `ink`.
- First card, front face only: a "Tap to flip" pill absolutely positioned `bottom:18px`, centered, mono 10px `letter-spacing:0.5`, `ink` at 45%, `padding: 5px 12px`, `border-radius:999px`, `background:${ink}12`.

**Bottom control row:** 40×40 circular prev button (`bgCard`, 1px `border`, chevron-left 16px), `opacity:0.3` and non-interactive at index 0. Centered mono 10px `textFaint` hint: "swipe or tap to flip", replaced by "last card" on the final card. Right side, 40×40:
- Not the last card → chevron-right on `bgCard` with 1px `border`; advances.
- **Last card → a plus button** filled with the deck's palette `bg`, `border` transparent, icon in palette `ink` at stroke 2. It navigates to `/decks/[id]/cards/new`. This is the "add a card when you reach the end of a deck" affordance. (Noted for later: eventually a user should be able to create a card from anywhere in the app; the current web implementation only supports it from within a deck, so this end-of-deck entry point plus the library `+` buttons are the scope for now.)

### 3. Create / edit card (`/decks/[id]/cards/new`, `/decks/[id]/cards/[cardId]`)
**Purpose:** write or revise a card's question and answer.

Same full-bleed card geometry as the viewer, so editing feels like writing directly on the card.

**Top bar:** 34×34 circular back button; centered sans 12px `textMuted` label "{deck name} · New card" or "{deck name} · Edit card"; a "Save" pill on the right — `padding: 7px 14px`, `border-radius:999px`, background `text`, color `bg`, sans 12px weight 500.

**Card:** identical two-face flip structure. Face header right-hand label reads "Draft" instead of the deck name. Body holds a borderless transparent `<textarea>` (`resize:none`, no outline) styled in display 26px (landscape 22px), `line-height:1.3`, `letter-spacing:-0.3`, centered, color and caret both palette `ink`. Placeholders: "What's the question?" and "Write the answer…". Body padding `10px 26px` portrait / `4px 40px` landscape. The question textarea autofocuses when creating a new card.

An "Auto-saved" indicator sits absolutely at `bottom:16px`, centered: a 5×5 `ink` dot and mono 9px `ink` at 40% opacity, `gap:6px`.

**Q/A toggle (bottom):** centered segmented control — outer `padding:3px`, `border-radius:999px`, `bgCard`, 1px `border`; two buttons `padding: 7px 18px`, `border-radius:999px`, sans 12px weight 500; selected background `text` / color `bg`, unselected transparent / `textMuted`. Reuse `components/ui/QAToggle.tsx`.

### Settings (stub)
Display 26px "Settings" heading, then rows "Profile", "Preferences", "Data", "Danger zone" — `padding: 16px 6px`, 1px `border` bottom hairlines except the last, 15px label with a 15px `textFaint` chevron-right. Out of scope for this redesign; the existing Settings screen stands.

## Interactions & Behavior

**Library → card, and back (View Transitions).**
Each deck row carries `view-transition-name: card-{deckId}`. On the viewer screen the card's **front face** carries the same name. Navigating between the two therefore morphs the deck row into the full card (and shrinks back on return) rather than cutting. Duration 360ms, `cubic-bezier(0.4,0,0.2,1)`.

In the real app, use the existing `navigateWithTransition(router, href, direction)` from `lib/viewTransition.ts` (with `PathnameTracker` mounted) for these route changes. Only one element per snapshot may hold a given `view-transition-name` — the back face must not carry it.

**Flip.** Tap anywhere on the card, or press Tab (existing shortcut behavior). Toggles `rotateY` 0↔180 over 380ms.

**Swipe between cards.** Horizontal touch drag on the card area translates the card 1:1 with the finger. On release, a drag over 60px commits: left → next, right → prev; otherwise it springs back to 0. Committing animates the card out by `translateX(∓100%)` over 220ms, then swaps in the new card and resets. Prev is a no-op at index 0; next is a no-op on the last card (the button becomes "add card" instead). Flip state resets to the question side on every card change. Reuse `hooks/useSwipeGesture.ts`.

**Orientation.** Landscape (844×390) is supported **only on the viewer and editor**. The library stays portrait-only — a landscape library was explicitly not wanted. Landscape reduces vertical padding throughout and drops card body type from 27→24px (editor 26→22px) while widening horizontal padding to 40px.

**Creating.** New deck (library dashed row) → create deck with an unused palette → land in that deck's new-card editor. Deck row `+` → new-card editor for that deck. Last-card `+` in the viewer → new-card editor for that deck. Save returns to the previous screen.

## State Management
Per-screen local state in the prototype; in the app this maps onto route state plus existing server actions (`app/actions/decks.ts`, `app/actions/cards.ts`).

- `screen` — derived from the route in the real app (`/library`, `/decks/[id]`, `/decks/[id]/cards/*`).
- `activeDeck`, `activeIdx` — deck from the route params; card index within the deck (viewer). Consider persisting index so returning to a deck resumes where the user left off.
- `flipped` (boolean) — resets to `false` on every `activeIdx` change.
- `dragX` (number) and `anim` (`null | 'next' | 'prev'`) — swipe/slide animation state.
- `q`, `a` (strings) — editor drafts, seeded from the card being edited or empty for new.
- `tab` — Library / Settings, only meaningful when the tab bar is visible.

Data fetching stays as-is: decks and cards via the Supabase queries in `lib/data/decks.ts`; the prototype uses hardcoded sample decks (Algorithms, Linear Algebra, Indian History, Spanish Verbs, Philosophy 101).

## Assets
No image assets. All icons are inline 24×24 stroke SVGs (`stroke-linecap`/`linejoin` round, default stroke width 1.7): chevron-left, chevron-down, chevron-right, plus, pencil, 4-square grid, gear. The paper texture is a generated inline SVG noise filter, not a file. Fonts load from Google Fonts: Inter Tight (300/400/500/600), Instrument Serif (regular + italic), JetBrains Mono (400/500).

## Screenshots
In `screens/`. Captured from the prototype; the paper-noise overlay does not survive the capture process, so the card surfaces read as flat color here — the texture is real in the HTML.

| File | Shows |
|---|---|
| `01-library.png` | Library: header, pinned dashed "New deck" row, deck rows, tab bar |
| `02-viewer-question.png` | Study viewer, question side, with the "Tap to flip" pill |
| `03-viewer-answer.png` | Study viewer, answer side |
| `04-editor-portrait.png` | Edit card, portrait, Q/A toggle |
| `05-editor-landscape.png` | Edit card, landscape (tighter chrome, wider card) |

## Files
- `Succinctly Mobile.html` — the mobile redesign prototype (all three screens; includes the nav-pattern and orientation toggles above the device frame, which are prototype controls only, not app UI).
- `ios-frame.jsx` — the iPhone bezel wrapper used by the prototype. Presentation scaffolding; nothing to port.
