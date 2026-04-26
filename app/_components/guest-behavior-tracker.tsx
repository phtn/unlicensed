'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  getExistingGuestVisitorId,
  shouldSkipGuestTracking,
  trackGuestIdentify,
  trackGuestPageView,
} from '@/lib/guest-tracking-client'
import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

const EXCLUDED_PATH_PREFIXES = [
  '/admin',
  '/account',
  '/api',
  '/auth',
  '/studio',
]

function isTrackablePath(pathname: string) {
  return !EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function queueIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {timeout: 2000})
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = globalThis.setTimeout(callback, 750)
  return () => globalThis.clearTimeout(timeoutId)
}

export function GuestBehaviorTracker() {
  const pathname = usePathname()
  const {user} = useAuthCtx()
  const previousUrlRef = useRef<string | null>(null)
  const lastPageViewRef = useRef<string | null>(null)
  const lastIdentifyRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || shouldSkipGuestTracking()) {
      return
    }

    const existingVisitorId = getExistingGuestVisitorId()

    if (user?.uid) {
      if (!existingVisitorId) {
        return
      }

      const identifyKey = `${existingVisitorId}:${user.uid}`
      if (lastIdentifyRef.current === identifyKey) {
        return
      }

      lastIdentifyRef.current = identifyKey
      return queueIdle(() => {
        void trackGuestIdentify({
          visitorId: existingVisitorId,
        })
      })
    }

    if (!isTrackablePath(pathname)) {
      return
    }

    const fullPath = `${window.location.pathname}${window.location.search}`
    if (lastPageViewRef.current === fullPath) {
      return
    }

    lastPageViewRef.current = fullPath

    const referrer = previousUrlRef.current ?? document.referrer

    return queueIdle(() => {
      void trackGuestPageView({referrer}).then((result) => {
        if (result.tracked) {
          previousUrlRef.current = window.location.href
        }
      })
    })
  }, [pathname, user?.uid])

  return null
}
