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

const createSnapshot = (): ScreenResizeSnapshot => {
  if (typeof window === 'undefined') {
    return DEFAULT_SNAPSHOT
  }

  const viewport = window.visualViewport
  const width = Math.round(viewport?.width ?? window.innerWidth)
  const height = Math.round(viewport?.height ?? window.innerHeight)
  const orientation = width > height ? 'landscape' : 'portrait'

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
  const root = document.documentElement
  let frameId = 0

  // Coalesce rapid resize bursts into one store update per frame.
  const notify = () => {
    if (frameId !== 0) return

    frameId = window.requestAnimationFrame(() => {
      frameId = 0
      onStoreChange()
    })
  }

  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(notify)

  resizeObserver?.observe(root)
  window.addEventListener('resize', notify, {passive: true})
  window.addEventListener('orientationchange', notify)
  viewport?.addEventListener('resize', notify)

  return () => {
    if (frameId !== 0) {
      window.cancelAnimationFrame(frameId)
    }

    resizeObserver?.disconnect()
    window.removeEventListener('resize', notify)
    window.removeEventListener('orientationchange', notify)
    viewport?.removeEventListener('resize', notify)
  }
}

export function useScreenResizeObserver(): ScreenResizeSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SNAPSHOT)
}
