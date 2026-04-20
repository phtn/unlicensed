'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  checkIsEmailLink,
  clearStoredEmailForSignIn,
  getStoredEmailForSignIn,
  getPostEmailLinkRedirectUrl,
  hasEmailLinkParams,
  loginWithEmailLink,
} from '@/lib/firebase/auth'
import {parseFirebaseAuthError} from '@/lib/firebase/parseAuthError'
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
      const email = getStoredEmailForSignIn()

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
          setStatus('done')
          window.location.replace(getPostEmailLinkRedirectUrl())
        })
        .catch((err: unknown) => {
          setErrorMessage(parseFirebaseAuthError(err))
          setStatus('error')
          clearStoredEmailForSignIn()
        })
    }

    // Defer so we're definitely on client and URL is final (e.g. after hydration)
    const t = setTimeout(run, 0)
    return () => clearTimeout(t)
  }, [setAuthModalOpen, setCompleteEmailLink])

  if (status === 'idle' || status === 'done') return null

  if (status === 'handling') return null

  // need-email: auth modal shows the input in place of Email Link + Google buttons
  if (status === 'need-email') return null

  if (status === 'error') {
    return (
      <div
        className='fixed inset-x-0 top-6 z-9999 flex justify-center p-4 mt-16 md:mt-28'
        role='alert'>
        <div className='w-full max-w-md rounded-[1.75rem] border border-white/12 bg-background/88 p-5 shadow-2xl backdrop-blur-2xl'>
          <p className='font-clash text-lg'>Sign-in failed</p>
          <p className='mt-1 text-sm'>{errorMessage}</p>
          <button
            type='button'
            onClick={() => {
              setStatus('idle')
              setErrorMessage(null)
              handledRef.current = false
              const url = new URL(window.location.href)
              window.history.replaceState({}, '', url.pathname)
            }}
            className='mt-4 w-full rounded-2xl bg-white/10 px-4 py-2.5 font-medium transition hover:bg-white/16'>
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  return null
}
