'use client'

import {useSyncExternalStore} from 'react'

function getScrollYSnapshot(): number {
  if (typeof window === 'undefined') return 0
  return window.scrollY
}

function subscribeScrollY(callback: () => void): () => void {
  window.addEventListener('scroll', callback, {passive: true})
  return () => window.removeEventListener('scroll', callback)
}

/**
 * Subscribes to window vertical scroll position.
 * Uses useSyncExternalStore so no setState-in-effect; safe for SSR (returns 0 on server).
 */
export function useScrollY(): number {
  return useSyncExternalStore(subscribeScrollY, getScrollYSnapshot, () => 0)
}
