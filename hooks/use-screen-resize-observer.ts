import {useSyncExternalStore} from 'react'

export type ScreenOrientation = 'portrait' | 'landscape'

export interface ScreenResizeSnapshot {
  width: number
  height: number
  orientation: ScreenOrientation
  isPortrait: boolean
  isLandscape: boolean
}

const DEFAULT_SNAPSHOT: ScreenResizeSnapshot = {
  width: 0,
  height: 0,
  orientation: 'portrait',
  isPortrait: true,
  isLandscape: false,
}

let currentSnapshot = DEFAULT_SNAPSHOT

type MediaQueryListener = (event: MediaQueryListEvent) => void
type MediaQueryListCompat = MediaQueryList & {
  addListener?: (listener: MediaQueryListener) => void
  removeListener?: (listener: MediaQueryListener) => void
}

const getOrientation = (
  portraitMediaQuery?: MediaQueryList | null,
): ScreenOrientation => {
  if (portraitMediaQuery) {
    return portraitMediaQuery.matches ? 'portrait' : 'landscape'
  }

  if (typeof window === 'undefined') {
    return DEFAULT_SNAPSHOT.orientation
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

const subscribeToMediaQuery = (
  mediaQueryList: MediaQueryList | null,
  onChange: MediaQueryListener,
) => {
  if (!mediaQueryList) {
    return () => {}
  }

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', onChange)

    return () => {
      mediaQueryList.removeEventListener('change', onChange)
    }
  }

  const legacyMediaQueryList = mediaQueryList as MediaQueryListCompat

  legacyMediaQueryList.addListener?.(onChange)

  return () => {
    legacyMediaQueryList.removeListener?.(onChange)
  }
}

const createSnapshot = (): ScreenResizeSnapshot => {
  if (typeof window === 'undefined') {
    return DEFAULT_SNAPSHOT
  }

  const viewport = window.visualViewport
  const portraitMediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(orientation: portrait)')
      : null
  const width = Math.round(viewport?.width ?? window.innerWidth)
  const height = Math.round(viewport?.height ?? window.innerHeight)
  const orientation = getOrientation(portraitMediaQuery)

  return {
    width,
    height,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  }
}

const getSnapshot = () => {
  const nextSnapshot = createSnapshot()

  if (
    currentSnapshot.width === nextSnapshot.width &&
    currentSnapshot.height === nextSnapshot.height &&
    currentSnapshot.orientation === nextSnapshot.orientation
  ) {
    return currentSnapshot
  }

  currentSnapshot = nextSnapshot
  return currentSnapshot
}

const subscribe = (onStoreChange: VoidFunction) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const viewport = window.visualViewport
  const portraitMediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(orientation: portrait)')
      : null
  let frameId = 0

  // Coalesce rapid resize bursts into one store update per frame.
  const notify = () => {
    if (frameId !== 0) return

    frameId = window.requestAnimationFrame(() => {
      frameId = 0
      onStoreChange()
    })
  }

  window.addEventListener('resize', notify, {passive: true})
  window.addEventListener('orientationchange', notify)
  window.addEventListener('pageshow', notify)
  viewport?.addEventListener('resize', notify)
  const unsubscribeMediaQuery = subscribeToMediaQuery(
    portraitMediaQuery,
    notify,
  )

  return () => {
    if (frameId !== 0) {
      window.cancelAnimationFrame(frameId)
    }

    window.removeEventListener('resize', notify)
    window.removeEventListener('orientationchange', notify)
    window.removeEventListener('pageshow', notify)
    viewport?.removeEventListener('resize', notify)
    unsubscribeMediaQuery()
  }
}

export function useScreenResizeObserver(): ScreenResizeSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SNAPSHOT)
}
