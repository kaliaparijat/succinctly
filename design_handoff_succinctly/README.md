# Handoff: Succinctly — A flashcards web application

## Overview

Succinctly is a flashcards application for studying. Users organize cards into named decks (e.g. "Algorithms", "Linear Algebra", "Indian History") and study them one at a time by flipping question → answer. The app is **gated behind authentication** (Google or email/password). All screens are dark-mode-first, monochrome chrome, with **paper-toned colored decks** as the only color in the interface — the decks *are* the color.

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SvelteKit, Next.js, SwiftUI, etc.) using its established patterns and libraries. If no codebase exists yet, the recommended stack is **Next.js + TypeScript + Tailwind CSS** — the prototype is built in React, so component decomposition translates directly, and Next.js provides routing, auth middleware, and API routes out of the box.

## Fidelity

**High-fidelity.** All colors, typography, spacing, animation timings, and interaction patterns are final. Recreate pixel-perfectly using the codebase's existing libraries.

## Design Tokens

All values are pulled directly from the prototype.

### Colors — Chrome (dark)

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0A0B` | App background |
| `bgElev` | `#111113` | Elevated surfaces (modals, dropdowns) |
| `bgCard` | `#17171A` | Cards, segmented controls, inputs |
| `bgHover` | `#1D1D21` | Hover state on rows |
| `border` | `rgba(255,255,255,0.08)` | Default borders, dividers |
| `borderStrong` | `rgba(255,255,255,0.14)` | Emphasized borders, kbd outline |
| `text` | `#F5F5F7` | Primary text |
| `textMuted` | `rgba(245,245,247,0.6)` | Secondary text |
| `textFaint` | `rgba(245,245,247,0.38)` | Tertiary text, meta |

### Colors — Deck palette

Decks are the only saturated color in the app. Each deck has a paper-toned background (`bg`) and a dark ink color (`ink`) for type on that paper.

| Name | Background | Ink |
|---|---|---|
| Butter | `#F5D96B` | `#3A2E0A` |
| Sky | `#A8C8E8` | `#0F2940` |
| Coral | `#F2A68F` | `#3A1509` |
| Mint | `#B8DFC4` | `#0F3320` |
| Lilac | `#D4BFE8` | `#2C1840` |
| Paper | `#F0E9DC` | `#2A2418` |
| Terracotta | `#D98A6B` | `#3A1509` |
| Sage | `#C5D4B0` | `#1F2B10` |

### Typography

Load from Google Fonts: `Inter Tight`, `Instrument Serif`, `JetBrains Mono`.

| Family | Weights | Use |
|---|---|---|
| **Instrument Serif** (display) | 400 reg + 400 italic | Card content, all `h1`/`h2`, hero copy. Letter-spacing typically `-0.5` to `-1`. |
| **Inter Tight** (sans) | 300/400/500/600 | UI labels, body text, buttons, inputs |
| **JetBrains Mono** (mono) | 400/500 | Meta labels, eyebrow text (uppercase, `letter-spacing: 0.8–1`), keyboard hints, progress counters |

**Display sizes used:** 64px (canvas headline), 56px (library "Good evening"), 44px (empty state), 42px (auth headline), 40px (card content desktop), 36px (settings headers), 34px (mobile auth), 30px (mobile empty), 26px (deck thumb title), 24px (mobile card content).

### Spacing & radius

- Page padding (desktop): `56px 72px`
- Top bar padding: `20px 28px`, height `64px`
- Card padding (desktop): `56px 64px`
- Deck thumb: `220 × 140` px, `border-radius: 10px`
- Card stage: `700 × 460` px, `border-radius: 20px`
- Mobile card: `300 × 400` px, `border-radius: 16px`
- Modal radius: `16px`
- Button radius: `8px` (rect), `999px` (pill)
- Input radius: `8px`

### Shadows

- Deck thumb (front): `0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(0,0,0,0.35)`
- Flashcard (drop-shadow filter): `0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)`
- Dropdown: `0 20px 50px rgba(0,0,0,0.6)`
- Modal: same as dropdown

### Paper texture

Every colored card surface has a faint SVG noise overlay at `mix-blend-mode: multiply, opacity: 0.5` for tactility. The full data URI is in the source.

## Screens / Views

There are **5 unauthenticated screens**, **6 authenticated screens**, and **3 modal/overlay states**. All screens have a desktop and mobile variant unless noted.

### 1. Auth — Sign in / Sign up

Three explored directions; **pick one** for production. All three share the same top-right "Don't have an account? / Sign up" toggle and the same `AuthForm` (Google button + divider + email/name/password inputs + primary submit).

- **V1 Minimal centered** — recommended for production. 380px form column, headline above (`The deck is where you left it.` / `One deck, then another.`), Google button → "OR" divider → fields → primary submit.
- **V2 Hero split** — form left, fanned stack of 5 paper cards on the right with sample questions. Use only if marketing-led signup matters.
- **V3 Form on a flashcard** — the form sits on a yellow paper card; flipping the card switches between sign-in and sign-up. Charming but slower; **skip unless launching as a brand moment**.

Form fields: Email (required), Name (sign-up only), Password (sign-in shows "Forgot?" link inline with label).

### 2. Library — Deck grid

The home screen after auth.
- Top bar: logo (rotated card mark + "Succinctly" wordmark) on the left, `?` keyboard-shortcuts button + circular avatar (28px, initials in butter-yellow) on the right.
- Below: eyebrow `Your library · N decks` + h1 `Good evening. What are we studying?` (italic muted tail).
- "New deck" pill button top-right of the content area (white pill on dark, plus icon + label).
- 4-column grid of `DeckThumb` cards, gap `48px 40px`. Each thumb is a stack of three paper cards (back two are slightly rotated and dimmed) with the deck name in display serif + card count in mono uppercase.
- Last grid cell is a dashed "+ New deck" ghost slot.

### 3. Empty library

Shown on first run.
- Same top bar.
- Centered: four overlapping dashed-outline empty card frames (rotated stack) with "NOTHING HERE YET" inside.
- Headline `A blank deck. Ready when you are.` (italic muted tail).
- Body copy + "Create your first deck" pill button.

### 4. View card

The studying experience.
- Top bar: back link ("← Library"), divider, deck name + mono progress `1 / 3`, `?` button on right.
- 2px progress rail directly below the top bar, fills with the deck's color as the user advances.
- Centered 700×460 flashcard with a small randomized tilt (±0.6°) per card.
- Card has header strip: `QUESTION` / `ANSWER` (mono uppercase, left) + deck name (right), divider below.
- Card content centered in Instrument Serif 40–42px, `letter-spacing: -0.5`.
- On the first card only, a `SPACE to flip` hint pill sits at the bottom of the front face.
- Left/right circular nav arrows pinned at vertical center of the stage (44×44, `bgCard`, disabled at deck bounds).
- Footer: three keyboard-hint pills (`← Prev`, `Space Show answer/Show question` (highlighted), `→ Next`), divider, secondary "Add card" button.

### 5. Create card

A blank, editable card.
- Top bar: back, deck name suffixed with `· New card`.
- Formatting toolbar row below top bar: Bold / Italic / List | Code / Math, right side has `Tab to flip` hint pill.
- Same 700×460 card as the viewer, but each face is a `<textarea>` styled to look like card text (Instrument Serif 40px, transparent background, centered).
- Placeholders: front = `What's the question?`, back = `Write the answer…`
- Front auto-focuses; pressing `Tab` inside textarea flips to the back.
- Bottom-center: Q / A segmented control (3px padding, 999px radius, dark pill with white-on-black active state).
- Footer: meta `Card #N · {deckName}` left; Cancel + Save card (with ⌘↵ kbd inset on the primary button) right.
- Both faces show an `Auto-saved` dot indicator at the bottom of the card.

### 6. Settings

Reached from the avatar dropdown.
- Top bar: back link, "Settings" as the page label, avatar still visible on the right.
- Two-column layout: 240px left side rail with tabs (Profile / Preferences / Data / Danger zone), the rest is content.
- Each setting row is a 220px label column + flexible control column, separated by a top-border. Label cell has primary text + muted hint underneath.
- **Profile:** Avatar (with Upload photo button), Name (input), Email (input + "we'll send a confirmation" hint), Password (Change password… button).
- **Preferences:** Theme (segmented Dark/Light/Auto), Flip speed (Weighty/Medium/Crisp), Sound on flip (toggle), Show keyboard hints (toggle, default on), Tactile tilt (toggle, default on).
- **Data:** Export decks (JSON / CSV buttons), Import (Choose file…).
- **Danger zone:** Delete all decks, Delete account (both red-tinted).

### 7. Avatar dropdown (overlay)

Triggered by clicking the avatar in any top bar.
- Anchored top-right, 260px wide, `bgElev` with `borderStrong`, `border-radius: 12px`, padding 6px.
- Header: 36px avatar + name + email (single line, truncated), divider below.
- Rows: Account, Settings, Keyboard shortcuts (with `?` kbd badge). 8×10 padding, 7px radius, hover = `bgHover`.
- Divider, then Sign out row in red (`#ff9999`, hover bg `rgba(255,80,80,0.08)`).
- Click outside closes.

### 8. Keyboard shortcuts overlay (modal)

Triggered by `?` button or `?` key.
- Backdrop: `rgba(0,0,0,0.6)` with `backdrop-filter: blur(8px)`.
- Modal: 420px wide, `bgElev`, 16px radius, 28×32 padding.
- Header: mono eyebrow "Cheatsheet" + h3 "Keyboard shortcuts" + close button.
- Rows: label left, kbd badges right, separated by `border-bottom`.
- Shortcuts shown: `Space` flip, `← / →` prev/next, `N` add, `Esc` back, `?` toggle help.

## Interactions & Behavior

### Animations

| Action | Animation | Duration | Easing |
|---|---|---|---|
| Card flip (Q↔A) | `rotateY` 3D flip with `transform-style: preserve-3d` and `backface-visibility: hidden` | 320ms desktop, 320ms mobile, **480ms** for the auth-flashcard (slower, more weighty) | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Next/prev card | Horizontal slide: current card translates `±110%` and fades, new card snaps to center | 280ms total (transform + opacity) | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Progress bar | Width transition | 300ms | `ease` |
| Toggle switch | `left` position of the knob | 150ms | default |
| Card tilt (decoration) | Static `rotate()` of ±0.6° per card, hashed from the question text so it's stable | n/a | n/a |
| Mobile swipe | Live `translateX` tracking the finger; if `|dx| > 60px` on release, commit prev/next | n/a | n/a |

### Keyboard shortcuts (desktop only)

| Key | Action | Active when |
|---|---|---|
| `Space` | Flip current card | Viewer only, when focus is not in an input |
| `←` / `→` | Prev / next card | Viewer only |
| `Tab` | Flip card | Create screen, only when focus is in a textarea |
| `?` | Toggle shortcuts overlay | Viewer / Library |
| `Esc` | Close overlay / back to library | Anywhere |
| `N` | New card (planned) | Viewer / Library |
| `⌘↵` | Save card (planned binding shown on button) | Create screen |

### Mobile gestures

- **Tap the card** → flip Q ↔ A.
- **Swipe left/right** on the card area → next/prev card. Threshold 60px.
- Vertical swipe is intentionally **not bound** — reserved for scrolling long answers.

### Authentication flow

1. User lands on **Auth (sign-in)** if unauthenticated.
2. Two paths:
   - **Google OAuth** → success → Library.
   - **Email + password** → success → Library. New users use the Sign-up form (name field appears).
3. **Forgot password** link triggers a separate password-reset email flow (not designed yet — out of scope for v1, copy a generic "Check your email" page).
4. Sign-up agreement copy: "By signing up you agree to our Terms and Privacy Policy." Link to legal pages.
5. **Sign out** from avatar dropdown returns to Auth.

### Empty / loading / error states

- **No decks** → show the dedicated Empty state.
- **No cards in a deck** → take the user directly to Create.
- **Loading auth submission** → swap button label for spinner + "Signing in…" (not in mock; implement standard pattern).
- **Auth error** → red caption below the failing field (validation) or below the submit button (server).

## State management

Per-screen state can be local (`useState`/`useReducer`). Globals:

| State | Where | Notes |
|---|---|---|
| `user` | App-level / auth context | `{ id, name, email, avatarColor }`. Drives gating. |
| `decks` | App-level | Array of `{ id, name, palette, cards }`. Persist to backend. |
| `currentDeckId`, `currentCardIdx`, `flipped` | Route state | URL-bind these so refresh keeps position (`/decks/:id/cards/:idx?side=answer`). |
| `preferences` | User preferences store | `theme`, `flipSpeed`, `soundOnFlip`, `showKbdHints`, `tactileTilt`. |
| `helpOpen`, `dropdownOpen`, `editing` | Local UI state | Doesn't need persistence. |

## Components to build

Suggested decomposition (mirrors the prototype):

- `<Avatar user size onClick />`
- `<TopBar />` (variants for: library, viewer, create, settings, auth)
- `<DeckThumb deck count onClick />`
- `<Flashcard deck question answer flipped onFlip showHint />` — the core, reused everywhere
- `<KeyHint keys label primary />`
- `<HelpOverlay onClose />`
- `<NavArrow side onClick disabled />`
- `<AuthShell mode onModeChange>{form}</AuthShell>`
- `<AuthForm mode inkColor />` — accepts an `inkColor` so it can sit on a colored card (V3)
- `<GoogleG />` — Google "G" SVG, ready-baked
- `<AccountDropdown user ... />`
- `<SettingsScreen user onBack />` with `<ProfileTab>` / `<PreferencesTab>` / `<DataTab>` / `<DangerTab>`
- `<SettingRow label hint>{control}</SettingRow>`
- `<Toggle on onChange />`, `<Seg2 value options onChange />`, `<TextInput />`

## Recommended routing (web)

```
/                         → redirect to /signin or /library
/signin                   → AuthMinimal (sign-in mode)
/signup                   → AuthMinimal (sign-up mode)
/library                  → LibraryScreen
/decks/new                → CreateDeckFlow (out of scope v1; placeholder)
/decks/:id                → ViewerScreen (defaults to first card)
/decks/:id/cards/:idx     → ViewerScreen anchored to that card
/decks/:id/cards/new      → CreateScreen
/settings                 → SettingsScreen (default Profile tab)
/settings/:tab            → SettingsScreen (Preferences / Data / Danger)
```

Gate `/library` and below behind auth; redirect to `/signin` if no user, preserving the original URL in a `?next=` param.

## Assets

- **Icons**: all custom inline SVG (no icon font, no external library needed). See the `Icon` component and `I.*` map in the source. If your codebase already uses Lucide / Heroicons, the icon list maps cleanly: plus, arrow-left, arrow-right, x, more-horizontal, keyboard, arrow-left (back), bold, italic, list, code, function-square (math).
- **Google G logo**: inline SVG provided.
- **Fonts**: Google Fonts (link in the prototype `<head>`).
- **No image assets** beyond the SVG paper-noise texture (a data URI).

## Files in this handoff

- `Succinctly Flashcards.html` — the source-of-truth prototype. All components inlined as React/Babel JSX. Open in any modern browser to interact.

## Implementation notes

1. The card flip relies on `perspective` on the parent, `transform-style: preserve-3d` on the rotating element, and `backface-visibility: hidden` on both faces. Don't skip any of these — the flip will look flat otherwise.
2. The randomized card tilt is stable per card — hash the question text to a number and modulo it. This keeps a card's tilt consistent across re-renders.
3. The progress rail color comes from the deck palette, **not** the chrome — this is the only place chrome and color mix.
4. The auth-flashcard variant (V3) passes a non-default `inkColor` into `AuthForm`. Inputs and buttons recolor accordingly. Keep this prop if you ship V3.
5. The body needs `overscroll-behavior: none` on both axes to stop trackpad two-finger gestures from triggering browser back/forward.
