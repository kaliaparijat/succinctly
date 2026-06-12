# Middleware-based Route Protection

## Problem
Route protection is currently scattered across 5 individual pages — each calls
`getUser()` and redirects to `/signin` if there's no session. This means:

- Auth logic is duplicated and easy to forget on new routes
- Protection runs inside the Server Component render, not before it
- Any new protected route requires remembering to add the guard manually

## Solution
Replace per-page guards with a single Next.js `middleware.ts` at the project
root. Middleware runs on the Edge *before* any page renders, so unauthenticated
users are redirected immediately — no partial render, no per-page boilerplate.

## Acceptance Criteria
- `middleware.ts` exists at the project root and protects all routes under `/(app)/`
- Unauthenticated requests to any `/(app)/` route redirect to `/signin?next=<original-path>`
- After sign-in, the `?next=` param redirects the user back to where they were going
- `/signin`, `/signup`, `/auth/callback`, and `/` are explicitly excluded from protection
- The per-page `getUser()` + `redirect()` guards are removed from all 5 pages:
  - `app/(app)/library/page.tsx`
  - `app/(app)/settings/page.tsx`
  - `app/(app)/decks/[id]/page.tsx`
  - `app/(app)/decks/[id]/cards/new/page.tsx`
  - `app/page.tsx`
- `getUser()` calls that exist purely for the auth guard are removed; calls that
  also use `user.id` for data fetching are kept

## Implementation Notes
- Supabase requires the middleware to refresh the session cookie on every request —
  use `@supabase/ssr` `updateSession` helper pattern (see Supabase docs for Next.js middleware)
- The middleware `matcher` config should target `/(app)/` routes only, excluding
  static files and Next.js internals (`_next/`, `favicon.ico`, etc.)
- `getUser()` in `lib/auth.ts` can stay — it's still used by Server Actions that
  need `user.id` (e.g. `createDeck`)

## Not Doing
- Replacing `getUser()` calls in Server Actions — those serve a different purpose
  (getting `user.id` for writes), not just guarding access
- Role-based access control — all authenticated users have the same access for now
- Middleware for API routes — there are none yet
