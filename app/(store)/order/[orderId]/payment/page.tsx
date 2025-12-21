'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Spinner} from '@heroui/react'
import {useAction, useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useState, useTransition} from 'react'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as Id<'orders'>
  const [isPending, startTransition] = useTransition()
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Get order
  const order = useQuery(api.orders.q.getOrder, {orderId})

  // PayGate actions
  const initiatePayment = useAction(api.orders.paygate.initiatePayGatePayment)
  const checkPaymentStatus = useAction(
    api.orders.paygate.checkPayGatePaymentStatus,
  )

  // Payment URL state
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize payment when order is loaded
  useEffect(() => {
    if (!order || paymentUrl || error) return

    // If order already has a PayGate payment URL, use it
    if (order.payment.paygatePaymentUrl) {
      setPaymentUrl(order.payment.paygatePaymentUrl)
      return
    }

    // If payment is already completed, redirect to order page
    if (order.payment.status === 'completed') {
      startTransition(() => {
        router.push(`/account/orders/${orderId}`)
      })
      return
    }

    // Initiate PayGate payment
    const initPayment = async () => {
      try {
        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : ''
        const result = await initiatePayment({
          orderId,
          returnUrl: `${baseUrl}/account/orders/${orderId}?payment=success`,
          cancelUrl: `${baseUrl}/order/${orderId}/payment?payment=cancelled`,
          webhookUrl: `${baseUrl}/api/paygate/webhook`,
        })

        if (result.success && result.paymentUrl) {
          setPaymentUrl(result.paymentUrl)
        } else {
          setError('Failed to initialize payment. Please try again.')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize payment',
        )
      }
    }

    initPayment()
  }, [order, orderId, initiatePayment, router, paymentUrl, error])

  // Poll for payment status if payment URL is set
  useEffect(() => {
    if (!order || !paymentUrl || order.payment.status === 'completed') return

    const interval = setInterval(async () => {
      try {
        setCheckingStatus(true)
        const status = await checkPaymentStatus({orderId})

        if (status.status === 'completed') {
          // Payment completed, redirect to order page
          clearInterval(interval)
          startTransition(() => {
            router.push(`/account/orders/${orderId}?payment=success`)
          })
        } else if (status.status === 'failed') {
          clearInterval(interval)
          setError('Payment failed. Please try again.')
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
      } finally {
        setCheckingStatus(false)
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [order, orderId, paymentUrl, checkPaymentStatus, router])

  // Handle payment URL redirect
  const handlePayNow = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl
    }
  }

  if (!order) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  // Check URL params for payment status
  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null
  const paymentStatus = urlParams?.get('payment')

  if (paymentStatus === 'success' && order.payment.status === 'completed') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='max-w-md w-full'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>✅</div>
            <h1 className='text-2xl font-semibold'>Payment Successful!</h1>
            <p className='text-color-muted'>
              Your payment has been processed successfully.
            </p>
            <Button
              as={NextLink}
              href={`/account/orders/${orderId}`}
              color='primary'
              size='lg'
              className='w-full'>
              View Order
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (paymentStatus === 'cancelled') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='max-w-md w-full'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>⚠️</div>
            <h1 className='text-2xl font-semibold'>Payment Cancelled</h1>
            <p className='text-color-muted'>
              Your payment was cancelled. You can try again or return to your
              order.
            </p>
            <div className='flex gap-4'>
              <Button
                as={NextLink}
                href={`/account/orders/${orderId}`}
                variant='flat'
                className='flex-1'>
                View Order
              </Button>
              <Button
                onPress={handlePayNow}
                color='primary'
                className='flex-1'
                isDisabled={!paymentUrl}>
                Try Again
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='max-w-md w-full'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>❌</div>
            <h1 className='text-2xl font-semibold'>Payment Error</h1>
            <p className='text-color-muted'>{error}</p>
            <div className='flex gap-4'>
              <Button
                as={NextLink}
                href={`/account/orders/${orderId}`}
                variant='flat'
                className='flex-1'>
                View Order
              </Button>
              <Button
                onPress={() => window.location.reload()}
                color='primary'
                className='flex-1'>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen lg:pt-24 px-4 sm:px-6 lg:px-8 py-8'>
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardBody className='p-8 space-y-6'>
            <div>
              <h1 className='text-2xl font-semibold mb-2'>Complete Payment</h1>
              <p className='text-color-muted'>Order #{order.orderNumber}</p>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-color-muted'>Total Amount</span>
                <span className='text-xl font-semibold'>
                  ${formatPrice(order.totalCents)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Payment Method</span>
                <span className='capitalize'>
                  {order.payment.method.replace('_', ' ')}
                </span>
              </div>
            </div>

            {paymentUrl ? (
              <div className='space-y-4'>
                <p className='text-sm text-color-muted'>
                  {order.payment.method === 'crypto'
                    ? 'You will be redirected to complete your cryptocurrency payment.'
                    : 'Click the button below to complete your payment securely.'}
                </p>
                <Button
                  onClick={handlePayNow}
                  color='primary'
                  size='lg'
                  className='w-full'
                  isLoading={isPending}>
                  {order.payment.method === 'crypto'
                    ? 'Pay with Cryptocurrency'
                    : 'Pay Now'}
                </Button>
                {checkingStatus && (
                  <div className='flex items-center justify-center gap-2 text-sm text-color-muted'>
                    <Spinner size='sm' />
                    <span>Checking payment status...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex items-center justify-center py-8'>
                <Spinner size='lg' />
              </div>
            )}

            <div className='pt-4 border-t border-divider'>
              <Button
                as={NextLink}
                href={`/account/orders/${orderId}`}
                variant='flat'
                className='w-full'>
                Back to Order
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
