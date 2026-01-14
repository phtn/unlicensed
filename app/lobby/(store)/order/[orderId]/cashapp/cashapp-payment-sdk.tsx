'use client'

import {useEffect, useRef, useState} from 'react'

interface CashAppPaymentSDKProps {
  applicationId: string
  locationId?: string
  amountCents: number
  orderId: string
  onSuccess: () => void
  onError: (error: string) => void
}

/**
 * Cash App Pay SDK Integration Component
 *
 * This component loads Square's Web Payments SDK and handles Cash App Pay flow.
 *
 * Desktop: Shows QR code for scanning with Cash App mobile app
 * Mobile: Redirects to Cash App for payment authorization
 */
export function CashAppPaymentSDK({
  applicationId,
  locationId,
  amountCents,
  orderId,
  onSuccess,
  onError,
}: CashAppPaymentSDKProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const paymentRef = useRef<Awaited<ReturnType<NonNullable<typeof window.CashApp>['pay']>> | null>(null)

  // Load Square Web Payments SDK
  useEffect(() => {
    if (sdkLoaded || !applicationId) return

    // Check if SDK is already loaded
    if (typeof window !== 'undefined' && window.CashApp) {
      // Initialize Cash App Pay if SDK is already loaded
      const initCashApp = async () => {
        try {
          const cashApp = await window.CashApp!.pay({
            clientId: applicationId,
            ...(locationId && {locationId}),
          })
          paymentRef.current = cashApp
          setSdkLoaded(true)
        } catch (error) {
          console.error('Failed to initialize Cash App Pay:', error)
          onError(
            error instanceof Error
              ? error.message
              : 'Failed to initialize Cash App Pay',
          )
        }
      }
      initCashApp()
      return
    }

    // Load the SDK script
    const script = document.createElement('script')
    script.src = 'https://kit.cash.app/v1/pay.js'
    script.async = true
    script.onload = async () => {
      try {
        if (window.CashApp) {
          // Initialize Cash App Pay
          const cashApp = await window.CashApp.pay({
            clientId: applicationId,
            ...(locationId && {locationId}),
          })
          paymentRef.current = cashApp
          setSdkLoaded(true)
        }
      } catch (error) {
        console.error('Failed to initialize Cash App Pay:', error)
        onError(
          error instanceof Error
            ? error.message
            : 'Failed to initialize Cash App Pay',
        )
      }
    }
    script.onerror = () => {
      onError('Failed to load Cash App Pay SDK')
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [applicationId, locationId, sdkLoaded, onError])

  // Handle payment when SDK is loaded
  const handlePayment = async () => {
    if (!paymentRef.current || isProcessing) return

    try {
      setIsProcessing(true)

      // Convert cents to dollars
      const amount = (amountCents / 100).toFixed(2)

      // Create payment request
      const result = await paymentRef.current.pay({
        amount: parseFloat(amount),
        currency: 'USD',
        referenceId: orderId,
      })

      if (result.status === 'OK') {
        onSuccess()
      } else {
        onError(result.error?.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Cash App payment error:', error)
      onError(
        error instanceof Error ? error.message : 'Payment processing failed',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto-trigger payment when SDK is ready (optional)
  useEffect(() => {
    if (sdkLoaded && !isProcessing) {
      // You can auto-trigger or wait for user action
      // For now, we'll wait for explicit user action
    }
  }, [sdkLoaded, isProcessing])

  return (
    <div className='space-y-4'>
      {!sdkLoaded && (
        <div className='text-center py-4'>
          <p className='text-sm text-muted-foreground'>
            Loading Cash App Pay...
          </p>
        </div>
      )}

      {sdkLoaded && (
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className='w-full px-6 py-3 bg-[#00D632] text-white rounded-lg font-semibold hover:bg-[#00C02E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
          {isProcessing ? 'Processing...' : 'Pay with Cash App'}
        </button>
      )}
    </div>
  )
}

// Extend Window interface for Cash App SDK
declare global {
  interface Window {
    CashApp?: {
      pay: (config: {clientId: string; locationId?: string}) => Promise<{
        pay: (request: {
          amount: number
          currency: string
          referenceId: string
        }) => Promise<{
          status: 'OK' | 'FAILED'
          error?: {message: string}
        }>
      }>
    }
  }
}
