import { useSyncExternalStore } from 'react'

// Width-based check for portrait phones/narrow windows, OR'd with a
// short-and-landscape-and-touch check for phones rotated to landscape
// (landscape width = portrait height, which exceeds 767px on nearly every
// modern phone, so the width clause alone never catches them). pointer:
// coarse excludes an ordinary short desktop browser window, which is
// wide-short too but mouse-driven, not touch-driven.
const QUERY = '(max-width: 767px), (max-height: 767px) and (orientation: landscape) and (pointer: coarse)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
