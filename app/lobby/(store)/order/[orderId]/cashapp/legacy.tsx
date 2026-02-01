'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCashApp} from '@/hooks/use-cashapp'
import {useQuery} from 'convex/react'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'
import {uuidv7 as v7} from 'uuidv7'
import {CashAppError} from './cashapp-error'
import {CashAppProcessing} from './cashapp-processing'
import {CashAppSuccess} from './cashapp-success'

export default function CashAppPage() {
  const [debug] = useState(false)
  const [errorId] = useState(v7())
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as Id<'orders'>
  const hasInitiated = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<{
    paymentId?: string
    applicationId?: string
    locationId?: string
  } | null>(null)

  // Get order
  const order = useQuery(api.orders.q.getById, {id: orderId})

  // Validate payment method during render
  const paymentMethodError = useMemo(() => {
    if (order && order.payment.method !== 'cash_app') {
      return 'Invalid payment method for this checkout'
    }
    return null
  }, [order])

  // Combine payment method error with other errors
  const displayError = paymentMethodError || error

  // Use Cash App hook
  const {
    initiatePayment,
    checkPaymentStatus,
    loading: cashAppLoading,
  } = useCashApp()
  const loading = cashAppLoading || (!paymentConfig && !displayError)

  // Initialize Cash App payment when order is loaded
  useEffect(() => {
    if (!order || hasInitiated.current || debug) return

    // If payment is already completed, redirect to order page
    if (order.payment.status === 'completed') {
      router.push(`/lobby/account/orders/${orderId}`)
      return
    }

    // Skip if payment method is invalid (handled during render)
    if (order.payment.method !== 'cash_app') {
      return
    }

    // Initiate Cash App payment
    const initCashAppPayment = async () => {
      try {
        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : ''
        const result = await initiatePayment({
          orderId,
          returnUrl: `${baseUrl}/lobby/account/orders/${orderId}?payment=success`,
          cancelUrl: `${baseUrl}/lobby/order/${orderId}/cashapp?payment=cancelled`,
        })

        if (result.success) {
          setPaymentConfig({
            paymentId: result.paymentId,
            applicationId: result.applicationId,
            locationId: result.locationId,
          })
          hasInitiated.current = true
        } else {
          setError(result.error || 'Failed to initialize Cash App payment')
        }
      } catch (err) {
        console.error('Cash App payment initialization error:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to initialize payment',
        )
      }
    }

    initCashAppPayment()
  }, [order, orderId, router, debug, initiatePayment])

  // Check URL params for payment status
  const paymentStatus = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams?.get('payment')
    }
    return null
  }, [])

  if (!order) {
    return (
      <div className='h-screen w-screen overflow-hidden pt-100 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <Loader />
      </div>
    )
  }

  if (paymentStatus === 'success' && order.payment.status === 'completed') {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <CashAppSuccess orderId={order.orderNumber.split('-').pop()} />
      </div>
    )
  }

  if (displayError || paymentStatus === 'failed') {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <CashAppError errorId={errorId} />
      </div>
    )
  }

  return (
    <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <CashAppProcessing
        order={order}
        loading={loading && !paymentConfig}
        paymentConfig={paymentConfig}
        onPaymentSuccess={() => {
          // Check payment status and redirect on success
          checkPaymentStatus({orderId}).then((status) => {
            if (status.status === 'completed') {
              router.push(`/lobby/account/orders/${orderId}?payment=success`)
            }
          })
        }}
        onPaymentError={(errorMessage) => {
          setError(errorMessage)
        }}
      />
    </div>
  )
}
