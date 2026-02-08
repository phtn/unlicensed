'use client'

import {
  ArcActionBar,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcLineItems,
} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Spinner} from '@heroui/react'
import {useAction, useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useMemo, useState, useTransition} from 'react'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as Id<'orders'>
  const [, startTransition] = useTransition()
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Get order
  const order = useQuery(api.orders.q.getById, {id: orderId})

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
    if (order.payment.gateway?.paymentUrl) {
      setPaymentUrl(order.payment.gateway.paymentUrl)
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

  const completePaymentLineItems = useMemo(
    () =>
      [
        {label: 'Total Amount', value: formatPrice(order?.totalCents ?? 0)},
        {label: 'Payment Method', value: order?.payment?.method},
      ] as Array<{label: string; value: string}>,
    [order],
  )

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

  if (paymentStatus === 'failed') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='max-w-md w-full'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>❌</div>
            <h1 className='text-2xl font-semibold'>Payment Failed</h1>
            <p className='text-color-muted'>
              Your payment could not be processed. Please try again or contact
              support if the issue persists.
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

  if (paymentStatus === 'pending') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card className='max-w-md w-full'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>⏳</div>
            <h1 className='text-2xl font-semibold'>Payment Pending</h1>
            <p className='text-color-muted'>
              Your payment is being processed. Please wait while we confirm your
              payment.
            </p>
            {checkingStatus && (
              <div className='flex items-center justify-center gap-2'>
                <Spinner size='sm' />
                <span className='text-sm text-color-muted'>
                  Checking payment status...
                </span>
              </div>
            )}
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
                Refresh
              </Button>
            </div>
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
      <div className='flex items-center justify-center px-4'>
        <Card shadow='none' className='max-w-md w-full'>
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
    <div className='md:h-[calc(100lvh-226px)] overflow-clip pt-18 sm:pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <ArcCard>
        <ArcHeader
          title='Complete Payment'
          description={order.orderNumber}
          icon='hash'
          iconStyle='text-indigo-400'
        />
        <ArcLineItems data={completePaymentLineItems} />

        <ArcCallout
          value={
            order.payment.method === 'crypto_commerce'
              ? 'You will be redirected to complete your cryptocurrency payment.'
              : 'Click the button below to complete your payment securely.'
          }
          icon='info'
        />

        <ArcActionBar>
          <ArcButtonLeft
            label='back to order'
            href={`/account/orders/${orderId}`}
            icon='chevron-left'
          />
          <ArcButtonRight
            label={
              order.payment.method === 'crypto_commerce'
                ? 'Pay with Cryptocurrency'
                : 'Pay Now'
            }
            fn={handlePayNow}
            icon='chevron-right'
          />
        </ArcActionBar>
      </ArcCard>
    </div>
  )
}
