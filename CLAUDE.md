# Flashcard App — Project Context for Claude

## Project Overview
A mobile-first flashcard application built for active recall and spaced repetition.
The core differentiator is AI-graded free-text answers — users type their recall
response and an AI evaluates it for conceptual correctness against the card's
reference answer. This removes self-grading bias and makes spaced repetition
intervals more accurate.

Built for a wider audience from day one, with the developer as the primary
test user during early development. iOS app is a later-stage target; the MVP
is a responsive web app.

---

## The Problem Being Solved
Existing flashcard tools (Anki, Quizlet) require users to self-grade their
recall, which is unreliable. Users either pass themselves when they shouldn't,
or fail themselves when they were close enough. AI-evaluated active recall
solves this — the model grades conceptual understanding, not word-for-word
matching, and feeds accurate scores into the spaced repetition algorithm.

---

## Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI approach:** Mobile-first, responsive

### Backend
- **Platform:** Next.js API routes / Server Actions (no separate backend)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth

### AI Grading Layer
- **Architecture:** Abstracted behind a single interface — provider is swappable
  via environment config without touching application logic
- **Current provider:** Claude (Anthropic) — swappable via AI_PROVIDER env var
- **Task:** Evaluate a user's free-text answer against a reference answer for
  conceptual correctness, return a score and brief rationale

---

## Core Data Model

### Users
Managed by Supabase Auth. Profile table for preferences.

### Decks
- id, user_id, title, palette, created_at
- A deck belongs to a user and contains many cards

### Cards
- id, deck_id, question, reference_answer, position, created_at
- reference_answer is what the AI grades against — written by the user
  when creating the card

### Reviews (Iteration 2)
- id, card_id, user_id, user_answer, ai_score, ai_rationale, reviewed_at
- ai_score: numeric (0–3) representing recall quality
- This table drives the spaced repetition scheduling

### Spaced Repetition State (Iteration 2)
- id, card_id, user_id, interval_days, ease_factor, next_review_at
- Updated after each review based on ai_score

---

## AI Grading Interface

All AI calls go through a single abstracted function. Never call a provider
SDK directly from application code.

```typescript
interface GradingResult {
  score: number;        // 0 = no recall, 1 = partial, 2 = good, 3 = perfect
  rationale: string;   // Brief explanation shown to the user
  isCorrectEnough: boolean; // Convenience boolean for spaced rep logic
}

interface GradingInput {
  question: string;
  referenceAnswer: string;
  userAnswer: string;
}

// All providers implement this signature
type GradeAnswer = (input: GradingInput) => Promise<GradingResult>;
```

Swap providers by changing the AI_PROVIDER environment variable.
Application logic never references a specific provider.

---

## Spaced Repetition Logic
Based on SM-2 algorithm:
- Cards due for review are surfaced based on next_review_at
- After each review, interval and ease_factor are updated based on ai_score
- Score of 0-1: interval resets, ease_factor decreases
- Score of 2: interval stays short, ease_factor unchanged
- Score of 3: interval multiplies by ease_factor, ease_factor increases
- New cards start with interval_days = 1

---

## MVP Scope (Iteration 1)

### Phase 0: Foundation
- [ ] Task 1: Project scaffold — Next.js App Router, TypeScript, Tailwind, Supabase client
- [ ] Task 2: Design system tokens — Tailwind config with all colors, fonts, spacing from spec
- [ ] Task 3: Supabase schema + RLS — `profiles`, `decks`, `cards` tables

### Phase 1: Auth
- [ ] Task 4: Supabase Auth server wiring — session middleware, `getUser()`, sign-in/up/out actions
- [ ] Task 5: V3 Auth screen — flashcard flips between sign-in and sign-up (480ms, Butter palette)
- [ ] Task 6: Route protection middleware — gate `/library` and below, `?next=` redirect

### Phase 2: Library + Decks
- [ ] Task 7: Deck server actions — `createDeck`, `listDecks`, `deleteDeck`
- [ ] Task 8: DeckThumb component — stacked paper card visual, palette-aware, stable tilt
- [ ] Task 9: TopBar component — all variants (library, viewer, create, settings) + Avatar
- [ ] Task 10: Library screen — populated state (grid, greeting, "New deck" button)
- [ ] Task 11: Empty library state — dashed card frames, first-run copy, CTA
- [ ] Task 12: New deck modal — name input + palette picker (8 swatches)
- [ ] Task 13: Avatar dropdown — account rows, settings link, sign out

### Phase 3: Cards + Study
- [ ] Task 14: Card server actions — `createCard`, `listCards`, `updateCard`, `deleteCard`
- [ ] Task 15: Create card screen — flippable card editor, Tab to flip, Q/A textareas, save
- [ ] Task 16: Study viewer screen — flashcard viewer, flip animation, prev/next, progress rail
- [ ] Task 17: Keyboard shortcuts — Space, ←/→, ?, Esc bindings for desktop
- [ ] Task 18: Keyboard shortcuts overlay modal

### Phase 4: Polish
- [ ] Task 19: Mobile gestures — tap to flip, swipe left/right (60px threshold)
- [ ] Task 20: Settings screen — Profile tab (name), Preferences tab (flip speed, tilt, hints)
- [ ] Task 21: Responsive polish + Vercel deploy

---

## Post-MVP (Iteration 2 — Do Not Build Yet)
- AI grading: user types recall answer → Claude grades (0–3) → reference answer + rationale shown
- SM-2 spaced repetition scheduling
- Dashboard: cards due today, review history

## Post-MVP Ideas (Do Not Build Yet)
- AI-generated flashcard decks from a topic or URL
- Adaptive card difficulty based on review history
- Social decks / shared decks
- iOS wrapper via Capacitor or React Native
- Streaks, gamification
- LeetCode problem ingestion → auto-generated cards

---

## Key Engineering Principles

1. **AI provider is always abstracted.** No provider SDK is imported outside
   of the provider-specific adapter files.

2. **Mobile-first always.** Build and test on mobile viewport first.
   Desktop is an enhancement.

3. **No AI calls on the client.** All AI grading happens in Next.js
   Server Actions or API routes. API keys never touch the browser.

4. **Spaced repetition accuracy depends on grading quality.** The AI grading
   prompt is the most important piece of logic in the app. Iterate on it
   carefully and test it against real examples before trusting the intervals.

5. **Ship and use it.** The developer is the primary test user. If it's
   not useful enough to use personally, it's not ready for others.

---

## Out of Scope for MVP
- Offline support
- Native iOS app
- Collaborative/shared decks
- Monetization
- Analytics

---

## Design Reference
All design tokens, screen specs, animations, and component breakdown:
`design_handoff_succinctly/README.md`

Auth screen: V3 (form sits on Butter-yellow flashcard; flips 480ms to toggle sign-in/sign-up)
Study mode iteration 1: flip card only (no AI grading, no typing)
