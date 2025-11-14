'use client'

import {getCurrentUser, loginWithGoogleCredential} from '@/lib/firebase/auth'
import {GoogleAuthProvider} from 'firebase/auth'
import {useEffect, useRef} from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: {credential: string}) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            use_fedcm_for_prompt?: boolean // Optional: can enable FedCM if properly configured
          }) => void
          prompt: (
            momentNotification?: (notification: {
              getNotDisplayedReason: () => string
              getSkippedReason: () => string
              getDismissedReason: () => string
            }) => void,
          ) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleOneTapProps {
  clientId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

// Export a function to cancel One Tap (useful when user clicks Google button)
export const cancelGoogleOneTap = () => {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.cancel()
    } catch (error) {
      // Silently handle - One Tap might not be initialized
    }
  }
}

export const GoogleOneTap = ({
  clientId,
  onSuccess,
  onError,
}: GoogleOneTapProps) => {
  const initializedRef = useRef(false)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Suppress FedCM errors (they're harmless if we're not using FedCM)
    // These errors occur when the browser tries to use FedCM automatically
    const originalConsoleError = console.error
    const fedcmErrorHandler = (message: string, ...args: unknown[]) => {
      // Filter out FedCM-related errors
      const messageStr = typeof message === 'string' ? message : String(message)
      if (
        messageStr.includes('FedCM') ||
        messageStr.includes('IdentityCredentialError') ||
        messageStr.includes('Error retrieving a token') ||
        messageStr.includes('FedCM get() rejects')
      ) {
        // Silently ignore FedCM errors - they don't affect functionality
        return
      }
      // Log other errors normally
      originalConsoleError(message, ...args)
    }

    // Override console.error to filter FedCM errors
    console.error = fedcmErrorHandler as typeof console.error

    // Also catch unhandled promise rejections related to FedCM
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '')
      if (
        reason.includes('FedCM') ||
        reason.includes('IdentityCredentialError') ||
        reason.includes('Error retrieving a token')
      ) {
        // Prevent FedCM errors from showing in console
        event.preventDefault()
        return
      }
    }

    window.addEventListener('unhandledrejection', unhandledRejectionHandler)

    // Check if user is already authenticated
    const checkAuth = () => {
      const user = getCurrentUser()
      if (user) {
        // User is already logged in, don't show One Tap
        return
      }

      // Load Google Identity Services script
      if (!scriptLoadedRef.current) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          scriptLoadedRef.current = true
          initializeOneTap()
        }
        document.head.appendChild(script)
      } else if (window.google) {
        initializeOneTap()
      }
    }

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || initializedRef.current) return
      if (!clientId || clientId.trim() === '') {
        console.warn(
          'Google Client ID is not configured. One Tap will not be shown.',
        )
        return
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          // Explicitly disable FedCM to prevent CORS and token retrieval errors
          use_fedcm_for_prompt: false,
        })

        // Add a small delay to ensure initialization is complete
        setTimeout(() => {
          try {
            // Show the One Tap prompt
            window?.google?.accounts.id.prompt((notification) => {
              // Handle notification if needed (e.g., for analytics)
              if (notification) {
                const notDisplayedReason = notification.getNotDisplayedReason()
                const skippedReason = notification.getSkippedReason()
                const dismissedReason = notification.getDismissedReason()

                if (notDisplayedReason) {
                  console.log('One Tap not displayed:', notDisplayedReason)
                  // Don't show error for common reasons like user already signed in
                  if (
                    notDisplayedReason !== 'browser_not_supported' &&
                    notDisplayedReason !== 'invalid_client'
                  ) {
                    // Only log, don't show error to user
                  }
                }
                if (skippedReason) {
                  console.log('One Tap skipped:', skippedReason)
                }
                if (dismissedReason) {
                  console.log('One Tap dismissed:', dismissedReason)
                }
              }
            })
          } catch (promptError) {
            // Silently handle prompt errors - they're often due to browser/domain restrictions
            console.warn(
              'One Tap prompt error (this is usually harmless):',
              promptError,
            )
          }
        }, 100)

        initializedRef.current = true
      } catch (error) {
        console.error('Error initializing Google One Tap:', error)
        // Don't show error to user - One Tap is optional
        if (
          onError &&
          error instanceof Error &&
          !error.message.includes('CORS')
        ) {
          // Only call onError for non-CORS issues
          onError(error)
        }
      }
    }

    const handleCredentialResponse = async (response: {credential: string}) => {
      try {
        const provider = GoogleAuthProvider.credential(response.credential)
        await loginWithGoogleCredential(provider)

        // Disable auto-select after successful login
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect()
        }

        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error('Error signing in with Google One Tap:', error)
        if (onError) {
          onError(
            error instanceof Error
              ? error
              : new Error('Failed to sign in with Google'),
          )
        }
      }
    }

    checkAuth()

    // Cleanup function
    return () => {
      // Restore original console.error
      console.error = originalConsoleError
      // Remove unhandled rejection handler
      window.removeEventListener(
        'unhandledrejection',
        unhandledRejectionHandler,
      )
      // Note: We don't remove the script as it might be used elsewhere
      // The One Tap prompt will be automatically dismissed when component unmounts
    }
  }, [clientId, onSuccess, onError])

  // This component doesn't render anything visible
  return null
}
