'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useParams, useSearchParams} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'
import {uuidv7 as v7} from 'uuidv7'
import {InternalError} from './internal-error'
import {PaymentError} from './payment-error'
import {PaymentProcessing} from './payment-processing'
import {PaymentSuccess} from './payment-success'

export default function PayPage() {
  const [errorId] = useState(v7())
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.orderId as Id<'orders'>
  const hasInitiated = useRef(false)

  const order = useQuery(api.orders.q.getById, {id: orderId})
  const paygateAccount = useQuery(api.paygateAccounts.q.getDefaultAccount, {})

  const selectedProvider = useMemo(
    () => searchParams.get('provider')?.trim() || '',
    [searchParams],
  )

  useEffect(() => {
    if (!order || !paygateAccount || hasInitiated.current) return

    if (order.payment.status === 'completed') return

    const provider =
      (selectedProvider &&
      paygateAccount.topTenProviders?.some((item) => item.id === selectedProvider)
        ? selectedProvider
        : '') ||
      paygateAccount.defaultProvider ||
      paygateAccount.topTenProviders?.[0]?.id ||
      'moonpay'

    hasInitiated.current = true
    setCheckoutError(null)
    setIsInitializing(true)

    const initializeCheckout = async () => {
      try {
        const response = await fetch('/api/paygate/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order._id,
            providerId: provider,
          }),
        })

        const data = (await response.json().catch(() => null)) as
          | {success?: boolean; paymentUrl?: string; error?: string}
          | null

        if (!response.ok || !data?.success || !data.paymentUrl) {
          throw new Error(data?.error || 'Unable to start PayGate checkout')
        }

        window.location.href = data.paymentUrl
      } catch (error) {
        hasInitiated.current = false
        setCheckoutError(
          error instanceof Error
            ? error.message
            : 'Unable to start PayGate checkout',
        )
      } finally {
        setIsInitializing(false)
      }
    }

    initializeCheckout()
  }, [order, paygateAccount, selectedProvider])

  const paymentStatus = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('payment')
    }
    return null
  }, [])

  if (!order || paygateAccount === undefined) {
    return (
      <div className='h-screen w-screen overflow-hidden pt-100 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <Loader />
      </div>
    )
  }

  if (!paygateAccount) {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <InternalError errorId={errorId} />
      </div>
    )
  }

  if (paymentStatus === 'success' && order.payment.status === 'completed') {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <PaymentSuccess orderId={order.orderNumber.split('-').pop()} />
      </div>
    )
  }

  if (checkoutError) {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <PaymentError errorId={errorId} />
      </div>
    )
  }

  return (
    <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <PaymentProcessing order={order} loading={isInitializing} />
    </div>
  )
}
