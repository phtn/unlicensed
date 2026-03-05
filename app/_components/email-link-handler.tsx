'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  checkIsEmailLink,
  hasEmailLinkParams,
  loginWithEmailLink,
} from '@/lib/firebase/auth'
import {useEffect, useRef, useState} from 'react'

type Status = 'idle' | 'handling' | 'need-email' | 'done' | 'error'

/**
 * EmailLinkHandler
 *
 * Handles Firebase email link auth when the user clicks the magic link.
 * - Passes the full URL explicitly so Firebase receives the exact link.
 * - If email is missing from localStorage (e.g. different device), shows a form to enter it.
 * - Shows visible loading and error states.
 */
export function EmailLinkHandler() {
  const {setAuthModalOpen, setCompleteEmailLink} = useAuthCtx()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (handledRef.current) return

    const href = window.location.href

    const run = () => {
      if (handledRef.current) return
      // Use Firebase check first; fallback to URL param detection (redirect/hash quirks)
      const isEmailLink = checkIsEmailLink(href) || hasEmailLinkParams(href)
      if (!isEmailLink) return

      handledRef.current = true
      const email = window.localStorage.getItem('emailForSignIn')

      if (!email) {
        setCompleteEmailLink({href})
        setAuthModalOpen(true)
        setStatus('need-email')
        return
      }

      setStatus('handling')
      setErrorMessage(null)

      loginWithEmailLink(email, href)
        .then(() => {
          window.history.replaceState({}, '', window.location.origin)
          setStatus('done')
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
          setErrorMessage(message)
          setStatus('error')
          window.localStorage.removeItem('emailForSignIn')
        })
    }

    // Defer so we're definitely on client and URL is final (e.g. after hydration)
    const t = setTimeout(run, 0)
    return () => clearTimeout(t)
  }, [setAuthModalOpen, setCompleteEmailLink])

  if (status === 'idle' || status === 'done') return null

  if (status === 'handling') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="rounded-2xl bg-[var(--color-bg-elevated)] px-8 py-6 shadow-xl">
          <p className="text-center font-medium text-[var(--color-fg)]">
            Signing you in…
          </p>
        </div>
      </div>
    )
  }

  // need-email: auth modal shows the input in place of Email Link + Google buttons
  if (status === 'need-email') return null

  if (status === 'error') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="alert"
      >
        <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-elevated)] p-6 shadow-xl">
          <p className="font-medium text-[var(--color-fg)]">Sign-in failed</p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle')
              setErrorMessage(null)
              handledRef.current = false
              window.history.replaceState({}, '', window.location.origin)
            }}
            className="mt-4 w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:opacity-90"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return null
}
