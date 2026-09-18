import type { useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>
type Direction = 'forward' | 'back'

let currentPathname = typeof window !== 'undefined' ? window.location.pathname : ''
const pendingWaiters = new Map<string, () => void>()

function stripQueryAndHash(path: string) {
  return path.split('?')[0].split('#')[0]
}

// Called by <PathnameTracker> (mounted once in the root layout) on every
// pathname change, so navigateWithTransition can detect when the destination
// route has actually rendered instead of guessing with a fixed delay.
export function reportPathname(pathname: string) {
  currentPathname = pathname
  const resolve = pendingWaiters.get(pathname)
  if (resolve) {
    pendingWaiters.delete(pathname)
    resolve()
  }
}

function waitForPathname(href: string): Promise<void> {
  const target = stripQueryAndHash(href)
  if (currentPathname === target) return Promise.resolve()
  // Resolve as soon as the pathname flips — no requestAnimationFrame here.
  // document.startViewTransition() suppresses rendering until this promise
  // resolves, and rAF is tied to that same rendering pipeline, so waiting on
  // rAF inside this callback deadlocks: rendering is paused waiting on us,
  // and we'd be waiting on a frame that can't render until we're done.
  return new Promise(resolve => {
    pendingWaiters.set(target, resolve)
  })
}

// Wraps a Next.js client navigation in the browser's View Transitions API so
// route changes (e.g. last card -> /cards/new) slide like the in-page card
// carousel instead of hard-cutting. Falls back to a plain push when the API
// is unavailable.
export function navigateWithTransition(router: Router, href: string, direction: Direction) {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    router.push(href)
    return
  }

  document.documentElement.dataset.transitionDirection = direction

  // Register the waiter and fire the navigation *before* starting the
  // transition. document.startViewTransition() pauses rendering until its
  // callback's promise resolves — nesting router.push() inside that callback
  // deadlocks, since the paused-rendering window blocks the very commit the
  // callback is waiting on.
  const done = waitForPathname(href)
  router.push(href)

  const transition = document.startViewTransition(() => done)

  // Any of these can reject if the browser skips the transition (e.g. a
  // second transition starts before this one finishes) — none of that is
  // actionable here, so swallow rejections rather than let them surface as
  // unhandled promise errors.
  transition.updateCallbackDone.catch(() => {})
  transition.ready.catch(() => {})
  transition.finished
    .catch(() => {})
    .finally(() => {
      delete document.documentElement.dataset.transitionDirection
    })
}
