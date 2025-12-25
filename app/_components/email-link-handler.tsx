'use client'

import {checkIsEmailLink, loginWithEmailLink} from '@/lib/firebase/auth'
import {useEffect, useState} from 'react'

/**
 * EmailLinkHandler
 *
 * Automatically handles Firebase email link authentication when user clicks
 * the magic link from their email. This component should be mounted in the
 * root layout to check for email links on every page load.
 */
export function EmailLinkHandler() {
  const [isHandling, setIsHandling] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleEmailLink = async () => {
      // Check if current URL is an email link
      const isEmailLink = checkIsEmailLink()
      if (!isEmailLink) return

      // Get email from localStorage (stored when sendEmailLink was called)
      const email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        console.warn(
          'Email link detected but no email found in localStorage. User may need to enter email again.',
        )
        // You might want to prompt user to enter email here
        return
      }

      setIsHandling(true)

      try {
        // Complete the sign-in with the email link
        await loginWithEmailLink(email)
        // Redirect to home page after successful sign-in
        // The auth state change will be handled by useAuth hook
        window.history.replaceState({}, '', window.location.origin)
      } catch (error) {
        console.error('Failed to sign in with email link:', error)
        // Clear invalid email from localStorage
        window.localStorage.removeItem('emailForSignIn')
        // Optionally show error to user
      } finally {
        setIsHandling(false)
      }
    }

    handleEmailLink()
  }, [])

  // This component doesn't render anything
  return null
}

