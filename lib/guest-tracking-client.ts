'use client'

import {getDeviceFingerprintId, getFingerprintId} from '@/lib/fingerprintjs2'
import {
  GUEST_VISITOR_ID_STORAGE_KEY,
  getGuestVisitorIdCookie,
  getOrCreateGuestVisitorId,
  hasGuestTrackingOptOut,
  normalizeGuestVisitorId,
} from '@/lib/guest-tracking'

type GuestTrackingEventType = 'page_view' | 'identify'
type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'
type MetadataValue = string | number | boolean | null

type NavigatorWithPrivacy = Navigator & {
  globalPrivacyControl?: boolean
}

type GuestTrackingPayload = {
  visitorId: string
  deviceFingerprintId?: string
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

export type GuestTrackingResult =
  | {
      tracked: true
      visitorId: string
      deviceFingerprintId?: string
      browserFingerprintId?: string
    }
  | {
      tracked: false
      reason:
        | 'server'
        | 'privacy'
        | 'missing-visitor-id'
        | 'request-failed'
      visitorId?: string
      deviceFingerprintId?: string
      browserFingerprintId?: string
    }

type TrackGuestPageViewOptions = {
  awaitPersistence?: boolean
  referrer?: string
}

type TrackGuestIdentifyOptions = {
  awaitPersistence?: boolean
  visitorId?: string | null
}

export function getExistingGuestVisitorId() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    normalizeGuestVisitorId(
      window.localStorage.getItem(GUEST_VISITOR_ID_STORAGE_KEY),
    ) ?? getGuestVisitorIdCookie()
  )
}

export function shouldSkipGuestTracking() {
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

async function getFingerprintMetadata() {
  const [browserFingerprintResult, deviceFingerprintResult] =
    await Promise.allSettled([getFingerprintId(), getDeviceFingerprintId()])

  return {
    browserFingerprintId:
      browserFingerprintResult.status === 'fulfilled'
        ? browserFingerprintResult.value
        : undefined,
    deviceFingerprintId:
      deviceFingerprintResult.status === 'fulfilled'
        ? deviceFingerprintResult.value
        : undefined,
  }
}

async function sendGuestTrackingPayload(
  payload: GuestTrackingPayload,
  awaitPersistence: boolean,
) {
  const body = JSON.stringify(payload)

  if (!awaitPersistence) {
    const blob = new Blob([body], {type: 'application/json'})

    if (
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/guest-tracking', blob)
    ) {
      return true
    }
  }

  const response = await fetch('/api/guest-tracking', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    credentials: 'same-origin',
    keepalive: true,
  })

  return response.ok
}

export async function trackGuestPageView({
  awaitPersistence = false,
  referrer,
}: TrackGuestPageViewOptions = {}): Promise<GuestTrackingResult> {
  if (typeof window === 'undefined') {
    return {tracked: false, reason: 'server'}
  }

  if (shouldSkipGuestTracking()) {
    return {tracked: false, reason: 'privacy'}
  }

  const existingVisitorId = getExistingGuestVisitorId()
  const visitorId = getOrCreateGuestVisitorId()
  if (!visitorId) {
    return {tracked: false, reason: 'missing-visitor-id'}
  }

  const {browserFingerprintId, deviceFingerprintId} =
    await getFingerprintMetadata()
  const fullPath = `${window.location.pathname}${window.location.search}`
  const searchParams = new URLSearchParams(window.location.search)
  const metadata = {
    returningVisitor: Boolean(existingVisitorId),
    ...(browserFingerprintId ? {browserFingerprintId} : {}),
  } satisfies Record<string, MetadataValue>
  const payload = {
    visitorId,
    ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
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
    metadata,
  } satisfies GuestTrackingPayload

  const tracked = await sendGuestTrackingPayload(
    payload,
    awaitPersistence,
  ).catch(() => false)

  return tracked
    ? {
        tracked,
        visitorId,
        ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
        ...(browserFingerprintId ? {browserFingerprintId} : {}),
      }
    : {
        tracked,
        reason: 'request-failed',
        visitorId,
        ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
        ...(browserFingerprintId ? {browserFingerprintId} : {}),
      }
}

export async function trackGuestIdentify({
  awaitPersistence = false,
  visitorId: visitorIdOverride,
}: TrackGuestIdentifyOptions = {}): Promise<GuestTrackingResult> {
  if (typeof window === 'undefined') {
    return {tracked: false, reason: 'server'}
  }

  if (shouldSkipGuestTracking()) {
    return {tracked: false, reason: 'privacy'}
  }

  const visitorId =
    normalizeGuestVisitorId(visitorIdOverride) ?? getExistingGuestVisitorId()

  if (!visitorId) {
    return {tracked: false, reason: 'missing-visitor-id'}
  }

  const {browserFingerprintId, deviceFingerprintId} =
    await getFingerprintMetadata()
  const metadata = {
    ...(browserFingerprintId ? {browserFingerprintId} : {}),
  } satisfies Record<string, MetadataValue>
  const payload = {
    visitorId,
    ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
    type: 'identify',
    path: window.location.pathname || '/',
    fullPath: `${window.location.pathname}${window.location.search}`,
    title: document.title,
    consent: 'unknown',
    ...(Object.keys(metadata).length > 0 ? {metadata} : {}),
  } satisfies GuestTrackingPayload

  const tracked = await sendGuestTrackingPayload(
    payload,
    awaitPersistence,
  ).catch(() => false)

  return tracked
    ? {
        tracked,
        visitorId,
        ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
        ...(browserFingerprintId ? {browserFingerprintId} : {}),
      }
    : {
        tracked,
        reason: 'request-failed',
        visitorId,
        ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
        ...(browserFingerprintId ? {browserFingerprintId} : {}),
      }
}
