#

# MVP: A modern flashcard app, built for the age of AI

## Mission Statement
The tool for everyone to learn, practice active recall and spaced repetition, leveraging AI to advance more quickly then traditional flashcards allow!  

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

A spec is a single file (`docs/specs/<name>.md`) by default. Once a spec
picks up its own implementation-tracking artifacts during a real build-out
— a `plan.md` task breakdown, a `todo.md` checklist — give it its own
folder instead: `docs/specs/<name>/spec.md` alongside `plan.md`/
`todo.md`, rather than leaving those loose elsewhere in the repo. Don't
restructure a spec into a folder preemptively — monly once it actually has
more than the one file.

---

## Idea → Issue → Spec Workflow

Ideas start as rough brainstorms in `docs/ideas/`. When one is ready to build:

1. Open a GitHub issue — the durable, external record of what's being
   proposed and why. Short, descriptive title; labeled `enhancement` or
   `bug`; body states the problem, the approaches considered, and the
   decision made.
2. Create `docs/specs/issue-N-<name>.md` linking back to the issue URL,
   following the existing issue-numbered spec pattern.
3. Branch and commits for the work are named `issue-N`.
4. Delete the original `docs/ideas/<name>.md` once promoted — the issue +
   spec are the source of truth from that point on.

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

## Planning and Testing

- Tests are part of each implementation task, not a closing step. For any task that changes
  behavior, write the failing test first, make it pass with the smallest change, then move on.
- A plan's end-to-end or manual check (e.g. a live browser run) supplements the unit and component
  tests. It never replaces them.
- Plans and todo lists for a spec follow this order per behavior change: red test, green
  implementation, then the next task.
- Commit atomically: one logical change per commit (e.g. a migration, a server action and its
  tests, a UI change and its tests), each leaving the tests green. Never squash a whole feature
  into a single commit before opening a PR.

---

## PR Descriptions
Keep them short — a summary of a few bullets and a test plan, not a
restatement of the diff. Skip sections that don't apply rather than writing
"N/A." Save narrative detail (why a decision was made, alternatives
considered) for the spec/commit, not the PR body.

---

## Design Reference
All design tokens, screen specs, animations, and component breakdown:
`design_handoff_succinctly/README.md`

Auth screen: V3 (form sits on Butter-yellow flashcard; flips 480ms to toggle sign-in/sign-up)
Study mode iteration 1: flip card only (no AI grading, no typing)

**Screenshots in `design_handoff_succinctly*/screens/` are not reliable for
geometry.** They're exported at a fixed capture size that doesn't match the
prototype's own stated viewport targets, so they can visually misrepresent
proportions (e.g. a full-bleed card has read as short/square in a capture
that didn't match the 390×844 target). Treat the HTML prototype and its
README as the source of truth for layout; screenshots are fine for visual
tokens (color/type/spacing) only.

**When a spec cites a design screen for *dynamic* layout behavior** (fills
available space, responsive, flex-based — as opposed to static visual
tokens), state that behavior explicitly in the spec's own Behavior/
Acceptance Criteria section rather than just pointing at "Screen N." A
screenshot only shows one viewport size; even a correctly-captured one
can't distinguish a fixed-height element from one that expands to fill its
container — only prose (or reading the actual layout code) encodes that
distinction. This is how `mobile-study-viewer.md` and
`mobile-card-editor.md` ended up shipping a fixed-height card instead of
the intended full-bleed one: "full-bleed" was mentioned once in each
spec's Problem section but never became its own checkable Acceptance
Criterion.
