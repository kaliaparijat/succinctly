# Succinctly

I have always found that learning new topics is best achieved using active recall, deliberate practice and spaced repetition. Flashcards are one of the best tools to help achieve that and this is my spin on this tool, in the age of AI! 

The core differentiator is AI-graded free-text answers — instead of self-grading, a user types/speaks their recall response and the AI evaluates it for conceptual correctness. Spaced repetition is enhanced using AI by framing questions made by the user differently. This removes self-grading bias and makes spaced repetition intervals more accurate.

Overtime, succinctly will learn just how accurately a user needs spaced repetiton to ensure whether they have recalled a concept well enough and tailor the app to their needs. More ideas are in the pipeline if I can get significant traction to make this learning a social and cross learning experience to see how well similar concepts. 

## Status: Prototype → MVP

The current state of this project is a **prototype**, built to validate the foundation: auth, deck and card management, a study viewer, keyboard shortcuts, and mobile gestures.  The aim is to quickly iterate away the friction in the core experience of creating and reviewing flashcards. 

I deliberately **vibe-coded** the prototype using Claude Code with a mix of known technologies (React, Typescript) and unknown technologies (NextJS, Supabase). Now, I am leveraging Claude to learn more about the new technologies introduced within the app and some of the decisions it takes, a perfect way for me to dog food my own app!

## What's next: Delivering the MVP with AI graded reviews. 

The project is moving from **vibe-coded prototype** to a more deliberate **spec driven development** for the MVP. That means:

- **Dogfooding first** — using the app daily with a small set of trusted users to remove the friction involved in the core experience 
- **Spec-driven development** — every non-trivial change starts as a written spec in `docs/specs/` before any code is touched
- **Iteration 2** — AI grading layer (Claude as the default provider, abstracted behind a swappable interface) + spaced repetition scheduling

Issues are tracked on [GitHub Issues](https://github.com/kaliaparijat/succinctly/issues).

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS, Mobile first 
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

## Design:
Design tokens, screen specs, and component breakdown: `design_handoff_succinctly/README.md`
