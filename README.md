# Succinctly

A flashcard app built for active recall and spaced repetition. The core differentiator is AI-graded free-text answers — instead of self-grading, you type/speak your recall response and an AI evaluates it for conceptual correctness. Spaced repitition is enhanced using AI by framing questions made by the user differently. This removes self-grading bias and makes spaced repetition intervals more accurate.

## Status: Prototype → MVP

The current state of this project is a **prototype**, built to validate the foundation: auth, deck and card management, a study viewer with flip animations, keyboard shortcuts, and mobile gestures.

It was built rapidly using [Claude Code](https://claude.ai/code) and AI-assisted design — deliberately, as an experiment in how far AI tooling can take a solo developer in a short sprint. The honest answer: pretty far on scaffolding, but the fun begins now, as I learn more about my own project and turn to more deliberate spec driven development

**The prototype is missing its own reason to exist.** The core differentiator — AI-graded free-text answers — hasn't been built yet. Without it, this is just a CRUD flashcard app. The next phase is building that, correctly.

## What's next

The project is moving from vibe-coded prototype to deliberate product. That means:

- **Dogfooding first** — using the app daily to surface real bugs and friction before building new features. All of which are recorded as Github issues. 
- **Spec-driven development** — every non-trivial change starts as a written spec in `docs/specs/` before any code is touched
- **Iteration 2** — AI grading layer (Claude as the default provider, abstracted behind a swappable interface) + SM-2 spaced repetition scheduling

Issues are tracked on [GitHub Issues](https://github.com/kaliaparijat/succinctly/issues).

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS — mobile-first
- **Database + Auth:** Supabase (Postgres + Supabase Auth)
- **AI grading:** Claude (Anthropic) — abstracted behind a provider interface, swappable via `AI_PROVIDER` env var
- **Tests:** Vitest + React Testing Library
- **Deploy:** Vercel

## Running locally

```bash
npm install
npm run dev
```

Requires a Supabase project. Set the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Design

Design tokens, screen specs, and component breakdown: `design_handoff_succinctly/README.md`
