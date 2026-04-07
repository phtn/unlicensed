'use client'

import dynamic from 'next/dynamic'
import {useEffect, useState} from 'react'

const DynamicEmailLinkHandler = dynamic(
  () =>
    import('./email-link-handler').then((module) => module.EmailLinkHandler),
  {ssr: false},
)

const DynamicGlobalAuthModal = dynamic(
  () =>
    import('@/components/auth/global-auth-modal').then(
      (module) => module.GlobalAuthModal,
    ),
  {ssr: false},
)

const DynamicScreenDimensionsTracker = dynamic(
  () =>
    import('./screen-dimensions-tracker').then(
      (module) => module.ScreenDimensionsTracker,
    ),
  {ssr: false},
)

const DynamicUserLocationTracker = dynamic(
  () =>
    import('./user-location-tracker').then(
      (module) => module.UserLocationTracker,
    ),
  {ssr: false},
)

const DynamicAgeConfirmationModal = dynamic(
  () =>
    import('./age-confirmation-modal').then((m) => m.AgeConfirmationModal),
  {ssr: false},
)

export function DeferredRootClient() {
  const [mountDeferredClients, setMountDeferredClients] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        setMountDeferredClients(true)
      })

      return () => {
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(() => {
      setMountDeferredClients(true)
    }, 1200)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      <DynamicAgeConfirmationModal />
      {mountDeferredClients ? (
        <>
          <DynamicEmailLinkHandler />
          <DynamicGlobalAuthModal />
          <DynamicScreenDimensionsTracker />
          <DynamicUserLocationTracker />
        </>
      ) : null}
    </>
  )
}
