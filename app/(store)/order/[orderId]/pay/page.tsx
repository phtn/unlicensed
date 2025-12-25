'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {usePaygate} from '@/hooks/use-paygate'
import {paygatePublicConfig} from '@/lib/paygate/config'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams, useRouter} from 'next/navigation'
import {useEffect, useRef} from 'react'

export default function PayPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as Id<'orders'>
  const hasInitiated = useRef(false)

  // Get order
  const order = useQuery(api.orders.q.getOrder, {orderId})

  // Get admin settings for PayGate wallet address
  const adminSettings = useQuery(api.admin.q.getAdminSettings)

  // Use PayGate hook
  const {handleProcessPaymentSubmit, loading, response} = usePaygate()

  // Initialize payment when order and settings are loaded
  useEffect(() => {
    if (!order || !adminSettings || hasInitiated.current) return

    // If payment is already completed, redirect to order page
    if (order.payment.status === 'completed') {
      router.push(`/account/orders/${orderId}`)
      return
    }

    // Get wallet address from admin settings
    const walletAddress =
      // adminSettings.paygate?.usdcWallet ||
      process.env.NEXT_PUBLIC_TEST_ADDRESS_IN || ''

    if (!walletAddress) {
      console.error('PayGate wallet address not configured')
      return
    }

    // Convert cents to dollars for PayGate
    const amountInDollars = (order.totalCents / 100).toFixed(2)

    // Initiate hosted payment
    hasInitiated.current = true
    handleProcessPaymentSubmit(
      walletAddress,
      amountInDollars,
      'moonpay',
      order.contactEmail,
      'USD',
    )
  }, [order, adminSettings, handleProcessPaymentSubmit, router, orderId])

  // Handle HTML response - extract URL and redirect
  useEffect(() => {
    if (!response || !response.success) return

    const data = response.data
    if (
      data &&
      typeof data === 'object' &&
      'type' in data &&
      data.type === 'html' &&
      'content' in data &&
      typeof data.content === 'string'
    ) {
      const html = data.content

      // Try to extract URL from HTML
      // Method 1: Look for meta refresh redirect
      const metaRefreshMatch = html.match(
        /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)["']/i,
      )
      if (metaRefreshMatch && metaRefreshMatch[1]) {
        const redirectUrl = decodeURIComponent(metaRefreshMatch[1].trim())
        window.location.href = redirectUrl
        return
      }

      // Method 2: Look for window.location redirect in script
      const scriptRedirectMatch = html.match(
        /window\.location\.(href|replace)\s*=\s*["']([^"']+)["']/i,
      )
      if (scriptRedirectMatch && scriptRedirectMatch[2]) {
        const redirectUrl = scriptRedirectMatch[2].trim()
        window.location.href = redirectUrl
        return
      }

      // Method 3: Look for form action URL (especially for auto-submit forms)
      const formActionMatch = html.match(/<form[^>]*action=["']([^"']+)["']/i)
      if (formActionMatch && formActionMatch[1]) {
        const formUrl = formActionMatch[1].trim()
        // If it's a relative URL, make it absolute using checkout URL from config
        const checkoutUrl = paygatePublicConfig.checkoutUrl
        const redirectUrl = formUrl.startsWith('http')
          ? formUrl
          : `${checkoutUrl}${formUrl}`
        window.location.href = redirectUrl
        return
      }

      // Method 4: Look for anchor tags with checkout URLs
      const anchorMatch = html.match(
        /<a[^>]*href=["']([^"']*checkout[^"']*)["']/i,
      )
      if (anchorMatch && anchorMatch[1]) {
        const anchorUrl = anchorMatch[1].trim()
        const checkoutUrl = paygatePublicConfig.checkoutUrl
        const redirectUrl = anchorUrl.startsWith('http')
          ? anchorUrl
          : `${checkoutUrl}${anchorUrl}`
        window.location.href = redirectUrl
        return
      }

      // Method 5: Look for any absolute URL in the HTML
      const urlMatch = html.match(/https?:\/\/[^\s"'>]+/i)
      if (urlMatch && urlMatch[0]) {
        const foundUrl = urlMatch[0].trim()
        // Only use it if it looks like a checkout/payment URL
        if (
          foundUrl.includes('checkout') ||
          foundUrl.includes('paygate') ||
          foundUrl.includes('payment')
        ) {
          window.location.href = foundUrl
          return
        }
      }

      // Fallback: If response URL is available, redirect to it
      // The response URL is the PayGate endpoint that returned the HTML
      if (response.url) {
        window.location.href = response.url
        return
      }

      // Last resort: log warning
      console.warn('Could not extract redirect URL from HTML response', {
        htmlLength: html.length,
        responseUrl: response.url,
      })
    }
  }, [response])

  if (!order || !adminSettings) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader />
      </div>
    )
  }

  // Check if wallet address is configured
  const walletAddress =
    adminSettings.value?.paygate?.usdcWallet ||
    process.env.NEXT_PUBLIC_PAYGATE_USDC_WALLET ||
    ''

  if (!walletAddress) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card
          shadow='none'
          className='max-w-md w-full border border-foreground/50 dark:bg-dark-table/40'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>⚠️</div>
            <h1 className='text-2xl font-semibold'>Configuration Error</h1>
            <p className='text-color-muted'>
              PayGate wallet address is not configured. Please contact support.
            </p>
            <Button
              as={NextLink}
              href={`/account/orders/${orderId}`}
              color='primary'
              className='w-full'>
              Back to Order
            </Button>
          </CardBody>
        </Card>
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
      <div className='min-h-screen pt-16 md:pt-28 flex items-center justify-center px-4'>
        <Card
          shadow='none'
          className='max-w-md w-full border border-foreground/50 dark:bg-dark-table/40'>
          <CardBody className='p-8 text-center space-y-4'>
            <Icon
              name='check-fill'
              className='text-6xl mb-4 text-emerald-500'
            />
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

  if (response?.error) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <Card
          shadow='none'
          className='max-w-md w-full border border-foreground/50 dark:bg-dark-table/40'>
          <CardBody className='p-8 text-center space-y-4'>
            <div className='text-6xl mb-4'>❌</div>
            <h1 className='text-2xl font-semibold'>Payment Error</h1>
            <p className='text-color-muted'>{response.error}</p>
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
    <div className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <div className='max-w-2xl mx-auto'>
        <Card
          shadow='none'
          className='w-full border border-dashed border-foreground/50 dark:bg-dark-table/40'>
          <CardBody className='p-8 space-y-6'>
            <div>
              <h1 className='text-2xl font-semibold mb-2'>
                Processing Payment
              </h1>
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

            {loading ? (
              <div className='flex flex-col items-center justify-center py-8 space-y-4'>
                <Icon name='spinners-ring' className='text-orange-400' />
                <p className='text-sm text-color-muted'>
                  Initializing payment...
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                <p className='text-sm text-color-muted'>
                  You will be redirected to complete your payment securely.
                </p>
                {response && (
                  <div className='flex items-center justify-center gap-2 text-sm text-color-muted'>
                    <Icon name='spinners-ring' className='text-featured' />
                    <span>Redirecting to payment page...</span>
                  </div>
                )}
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
