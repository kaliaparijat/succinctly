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
recall, which is unreliable. AI-evaluated active recall solves this — the model
grades conceptual understanding, not word-for-word matching, and feeds accurate
scores into the spaced repetition algorithm.

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
- **Current provider:** Claude (Anthropic) — swappable via `AI_PROVIDER` env var

---

## Core Data Model

### Users
Managed by Supabase Auth. Profile table for preferences.

### Decks
- id, user_id, title, palette, created_at

### Cards
- id, deck_id, question, reference_answer, position, created_at
- `reference_answer` is what the AI grades against

---

## Specs & Roadmap

- Upcoming features and improvements: `docs/specs/`
- Exploratory ideas: `docs/ideas/`
- Iteration 2 (AI grading, spaced repetition): `docs/ideas/iteration-2.md`

---

## Key Engineering Principles

1. **AI provider is always abstracted.** No provider SDK imported outside of provider-specific adapter files.
2. **Mobile-first always.** Build and test on mobile viewport first. Desktop is an enhancement.
3. **No AI calls on the client.** All AI grading happens in Server Actions or API routes. API keys never touch the browser.
4. **Spaced repetition accuracy depends on grading quality.** The AI grading prompt is the most important logic in the app — iterate carefully.
5. **Ship and use it.** The developer is the primary test user. If it's not useful enough to use personally, it's not ready for others.

---

## Code Review Checklist

When reviewing any PR, always check:

1. **`package.json` scripts** — verify `build`, `dev`, `lint`, `test` don't contain unexpected commands. `.claude/settings.json` auto-approves `npm run build` etc., so a malicious script runs without a prompt.
2. **`.claude/settings.json` changes** — any PR that widens the allowlist needs explicit justification.
3. **`app/actions/` and API routes** — no unexpected external calls or env var leaks.
4. **New dependencies** — check for typosquatting before `npm install`.

---

## Design Reference
All design tokens, screen specs, animations, and component breakdown:
`design_handoff_succinctly/README.md`

Auth screen: V3 (form sits on Butter-yellow flashcard; flips 480ms to toggle sign-in/sign-up)
Study mode iteration 1: flip card only (no AI grading, no typing)
