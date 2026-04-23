'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  GUEST_VISITOR_ID_STORAGE_KEY,
  getGuestVisitorIdCookie,
  getOrCreateGuestVisitorId,
  hasGuestTrackingOptOut,
  normalizeGuestVisitorId,
} from '@/lib/guest-tracking'
import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'

type GuestTrackingEventType = 'page_view' | 'identify'
type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'
type MetadataValue = string | number | boolean | null

type NavigatorWithPrivacy = Navigator & {
  globalPrivacyControl?: boolean
}

type GuestTrackingPayload = {
  visitorId: string
  type: GuestTrackingEventType
  path: string
  fullPath?: string
  title?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  deviceType?: DeviceType
  screenWidth?: number
  screenHeight?: number
  timezone?: string
  locale?: string
  consent?: 'unknown' | 'granted' | 'denied'
  metadata?: Record<string, MetadataValue>
}

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

function getExistingVisitorId() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    normalizeGuestVisitorId(
      window.localStorage.getItem(GUEST_VISITOR_ID_STORAGE_KEY),
    ) ?? getGuestVisitorIdCookie()
  )
}

function shouldSkipTracking() {
  if (typeof window === 'undefined') {
    return true
  }

  const navigatorWithPrivacy = window.navigator as NavigatorWithPrivacy
  return (
    hasGuestTrackingOptOut() ||
    navigatorWithPrivacy.doNotTrack === '1' ||
    navigatorWithPrivacy.globalPrivacyControl === true
  )
}

function getDeviceType(): DeviceType {
  const userAgent = window.navigator.userAgent

  if (/ipad|tablet|kindle|silk/i.test(userAgent)) {
    return 'tablet'
  }

  if (/mobi|iphone|android/i.test(userAgent)) {
    return 'mobile'
  }

  return userAgent ? 'desktop' : 'unknown'
}

function getUtmParams(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source') ?? undefined,
    utmMedium: searchParams.get('utm_medium') ?? undefined,
    utmCampaign: searchParams.get('utm_campaign') ?? undefined,
    utmTerm: searchParams.get('utm_term') ?? undefined,
    utmContent: searchParams.get('utm_content') ?? undefined,
  }
}

function queueIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, {timeout: 2000})
    return () => window.cancelIdleCallback(idleId)
  }

  const timeoutId = globalThis.setTimeout(callback, 750)
  return () => globalThis.clearTimeout(timeoutId)
}

function sendTrackingPayload(payload: GuestTrackingPayload) {
  const body = JSON.stringify(payload)
  const blob = new Blob([body], {type: 'application/json'})

  if (
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon('/api/guest-tracking', blob)
  ) {
    return
  }

  void fetch('/api/guest-tracking', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    credentials: 'same-origin',
    keepalive: true,
  }).catch((error) => {
    console.error('Failed to send guest tracking event:', error)
  })
}

export function GuestBehaviorTracker() {
  const pathname = usePathname()
  const {user} = useAuthCtx()
  const previousUrlRef = useRef<string | null>(null)
  const lastPageViewRef = useRef<string | null>(null)
  const lastIdentifyRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || shouldSkipTracking()) {
      return
    }

    const existingVisitorId = getExistingVisitorId()

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
        sendTrackingPayload({
          visitorId: existingVisitorId,
          type: 'identify',
          path: window.location.pathname || '/',
          fullPath: `${window.location.pathname}${window.location.search}`,
          title: document.title,
          consent: 'unknown',
        })
      })
    }

    if (!isTrackablePath(pathname)) {
      return
    }

    const visitorId = getOrCreateGuestVisitorId()
    if (!visitorId) {
      return
    }

    const fullPath = `${window.location.pathname}${window.location.search}`
    if (lastPageViewRef.current === fullPath) {
      return
    }

    lastPageViewRef.current = fullPath

    const searchParams = new URLSearchParams(window.location.search)
    const referrer = previousUrlRef.current ?? document.referrer
    const wasReturningVisitor = Boolean(existingVisitorId)

    return queueIdle(() => {
      sendTrackingPayload({
        visitorId,
        type: 'page_view',
        path: window.location.pathname || '/',
        fullPath,
        title: document.title,
        ...(referrer ? {referrer} : {}),
        ...getUtmParams(searchParams),
        deviceType: getDeviceType(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: window.navigator.language,
        consent: 'unknown',
        metadata: {
          returningVisitor: wasReturningVisitor,
        },
      })

      previousUrlRef.current = window.location.href
    })
  }, [pathname, user?.uid])

  return null
}
