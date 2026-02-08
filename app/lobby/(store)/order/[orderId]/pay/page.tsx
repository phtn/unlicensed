'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {onSuccess} from '@/ctx/toast'
import {usePaygate} from '@/hooks/use-paygate'
import {paygatePublicConfig} from '@/lib/paygate/config'
import {useQuery} from 'convex/react'
import {useParams, useRouter, useSearchParams} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'
import {uuidv7 as v7} from 'uuidv7'
import {InternalError} from './internal-error'
import {PaymentError} from './payment-error'
import {PaymentProcessing} from './payment-processing'
import {PaymentSuccess} from './payment-success'

export default function PayPage() {
  const [debug] = useState(false)
  const [errorId] = useState(v7())
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params.orderId as Id<'orders'>
  const hasInitiated = useRef(false)

  // Get order
  const order = useQuery(api.orders.q.getById, {id: orderId})

  // Get admin settings for PayGate wallet address
  const adminSettings = useQuery(api.admin.q.getAdminSettings)
  const paygateAccount = useQuery(api.paygateAccounts.q.getDefaultAccount)

  // Use PayGate hook
  const {handleProcessPaymentSubmit, loading, response} = usePaygate()
  const selectedProvider = useMemo(
    () => searchParams.get('provider')?.trim() || '',
    [searchParams],
  )

  // Initialize payment when order and settings are loaded
  useEffect(() => {
    if (!order || !paygateAccount || hasInitiated.current || debug) {
      onSuccess('LINE:39 TRIGGER')
      return
    }

    /****
     *****--DISABLED NAVIGATION--*****
     ****/

    // If payment is already completed, redirect to order page
    if (order.payment.status === 'completed') {
      // router.push(`/lobby/account/orders/${order.orderNumber}`)
      onSuccess('LINE:47 TRIGGER')
      return
    }

    // Get wallet address from admin settings
    const wallet =
      // adminSettings.paygate?.usdcWallet ||
      paygateAccount?.addressIn

    if (!wallet) {
      console.error('PayGate wallet address not configured')
      return
    }

    // Convert cents to dollars for PayGate
    const amountInDollars = (order.totalCents / 100).toFixed(2)
    const provider =
      (selectedProvider &&
      paygateAccount.topTenProviders?.some(
        (item) => item.id === selectedProvider,
      )
        ? selectedProvider
        : '') ||
      paygateAccount.defaultProvider ||
      paygateAccount.topTenProviders?.[0]?.id ||
      'wert'

    // Initiate hosted payment
    hasInitiated.current = true
    handleProcessPaymentSubmit(
      wallet,
      amountInDollars,
      provider,
      order.contactEmail,
      'USD',
    )
  }, [
    order,
    paygateAccount,
    handleProcessPaymentSubmit,
    router,
    orderId,
    debug,
    selectedProvider,
  ])

  // Handle HTML response - extract URL and redirect
  useEffect(() => {
    if (!response || !response.success) return

    const data = response.data
    // Handle HTML responses
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
    }
  }, [response])

  // Check URL params for payment status
  const paymentStatus = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams?.get('payment')
    }
    return null
  }, [])
  if (!order || !adminSettings) {
    return (
      <div className='h-screen w-screen overflow-hidden pt-100 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
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
  if (response?.error) {
    return (
      <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <PaymentError errorId={errorId} />
      </div>
    )
  }

  return (
    <div className='h-[calc(100vh-104px)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
      <PaymentProcessing order={order} loading={loading && !response} />
    </div>
  )
}
