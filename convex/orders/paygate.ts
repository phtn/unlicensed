/**
 * PayGate payment integration for orders
 *
 * PayGate API integration for credit card and cryptocurrency payments.
 * No API keys required - just configure your USDC Polygon wallet address.
 */

import type {DefaultFunctionArgs, FunctionReference} from 'convex/server'
import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {action} from '../_generated/server'
import type {AdminSettings} from '../admin/d'
import type {OrderType} from './d'

// Type-safe access to internal API modules that may not be in generated types yet
const internalApi = internal as {
  orders?: {
    q?: {
      getOrder?: FunctionReference<
        'query',
        'internal',
        {orderId: string},
        OrderType | null
      >
    }
    m?: {
      updatePayment?: FunctionReference<
        'mutation',
        'internal',
        {
          orderId: string
          payment: {
            method: 'credit_card' | 'crypto' | 'cashapp'
            status:
              | 'pending'
              | 'processing'
              | 'completed'
              | 'failed'
              | 'refunded'
              | 'partially_refunded'
            transactionId?: string
            paymentIntentId?: string
            paidAt?: number
            refundedAt?: number
            refundAmountCents?: number
            paygateSessionId?: string
            paygatePaymentUrl?: string
            paygateTransactionId?: string
          }
        },
        string
      >
    }
  }
  admin?: {
    q?: {
      getAdminSettings?: FunctionReference<
        'query',
        'internal',
        DefaultFunctionArgs,
        AdminSettings | null
      >
    }
  }
}

/**
 * Initiate PayGate payment for an order
 *
 * This action creates a payment session with PayGate and updates the order
 * with the payment URL and session ID.
 */
export const initiatePayGatePayment = action({
  args: {
    orderId: v.id('orders'),
    returnUrl: v.string(),
    cancelUrl: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean
    paymentUrl: string
    sessionId: string | undefined
    transactionId: string | undefined
  }> => {
    // Get order
    const order: OrderType | null = await ctx.runQuery(
      internalApi.orders?.q?.getOrder as unknown as FunctionReference<'query'>,
      {
        orderId: args.orderId,
      },
    )

    if (!order) {
      throw new Error('Order not found')
    }

    if (order.payment.status !== 'pending') {
      throw new Error('Order payment already processed')
    }

    // Get admin settings for PayGate configuration
    const adminSettings: AdminSettings | null = await ctx.runQuery(
      internalApi.admin?.q
        ?.getAdminSettings as unknown as FunctionReference<'query'>,
      {},
    )
    const paygateSettings = adminSettings?.paygate

    // Get PayGate configuration (admin settings override env vars)
    const apiUrl: string = paygateSettings?.apiUrl || 'https://api.paygate.to'
    const checkoutUrl: string =
      paygateSettings?.checkoutUrl || 'https://checkout.paygate.to'
    const usdcWallet: string = paygateSettings?.usdcWallet || ''

    // Validate PayGate configuration
    if (!usdcWallet || usdcWallet.trim() === '') {
      throw new Error(
        'PayGate USDC wallet address is required. Please configure it in admin settings.',
      )
    }

    // Determine payment method for PayGate
    // Map our payment methods to PayGate's expected format
    let paygatePaymentMethod: 'credit_card' | 'crypto' | undefined
    if (order.payment.method === 'credit_card') {
      paygatePaymentMethod = 'credit_card'
    } else if (order.payment.method === 'crypto') {
      paygatePaymentMethod = 'crypto'
    }
    // cashapp is not directly supported by PayGate, treat as credit_card
    else if (order.payment.method === 'cashapp') {
      paygatePaymentMethod = 'credit_card'
    }

    // Convert cents to dollars for PayGate API
    const amountInDollars: number = order.totalCents / 100

    // PayGate uses different endpoints for credit card vs crypto
    // For credit card: use hosted payment endpoint (checkout.paygate.to/pay.php)
    // For crypto: use crypto endpoint (api.paygate.to/crypto/create.php)
    let endpoint: string
    const params: URLSearchParams = new URLSearchParams()

    if (paygatePaymentMethod === 'crypto') {
      // Crypto payments use the crypto endpoint
      endpoint = `${apiUrl}/crypto/create.php`
      params.append('amount', amountInDollars.toString())
      params.append('currency', 'USD')
      params.append('order_id', order.orderNumber)
      params.append('return_url', args.returnUrl)
      if (args.cancelUrl) params.append('cancel_url', args.cancelUrl)
      if (args.webhookUrl) params.append('webhook_url', args.webhookUrl)
      if (order.contactEmail) params.append('email', order.contactEmail)
      if (order.contactPhone) params.append('phone', order.contactPhone)
      if (order.shippingAddress.firstName) {
        params.append(
          'name',
          `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
        )
      }
      params.append('wallet', usdcWallet)
    } else {
      // Credit card payments use the hosted payment endpoint
      endpoint = `${checkoutUrl}/pay.php`
      params.append('address', usdcWallet) // Use 'address' parameter for hosted payments
      params.append('amount', amountInDollars.toString())
      params.append('provider', 'hosted') // Required for hosted payment endpoint
      params.append('currency', 'USD')
      if (order.contactEmail) params.append('email', order.contactEmail)
      // Note: hosted payment endpoint may not support return_url, cancel_url, webhook_url
      // These are typically handled via PayGate's callback system
    }

    // Build full URL for logging/debugging
    const fullUrl: string = `${endpoint}?${params.toString()}`

    // Create payment session via PayGate API
    let response: Response
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    } catch (error) {
      throw new Error(
        `Unable to reach PayGate API. Check network connection. Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }

    // Get content type before reading response body
    const contentType: string | null = response.headers.get('content-type') || ''
    const isJson: boolean = contentType.includes('application/json')
    const isHtml: boolean = contentType.includes('text/html')

    // Handle non-OK responses with better error messages
    if (!response.ok) {
      let errorText: string

      try {
        errorText = await response.text()
      } catch {
        errorText = 'Unable to read error response'
      }

      // Provide specific error messages based on status code
      if (response.status === 404) {
        throw new Error(
          `PayGate endpoint not found. Please verify the API URL configuration. Attempted URL: ${endpoint}`,
        )
      } else if (response.status === 400) {
        throw new Error(
          `Invalid PayGate request. Check required parameters (address/wallet, amount, etc.). Error: ${errorText.substring(0, 200)}`,
        )
      } else {
        throw new Error(
          `PayGate API error (${response.status}): ${errorText.substring(0, 500)}`,
        )
      }
    }

    // Parse response - hosted payment endpoint may return HTML or JSON
    let data: {
      success?: boolean
      error?: string
      payment_url?: string
      checkout_url?: string
      session_id?: string
      sessionId?: string
      transaction_id?: string
      transactionId?: string
      qr_code?: string
      url?: string
    } = {}

    if (isJson) {
      try {
        data = await response.json()
      } catch (error) {
        throw new Error(
          `PayGate API returned invalid JSON response: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    } else if (isHtml && paygatePaymentMethod !== 'crypto') {
      // Hosted payment endpoint may return HTML with redirect
      // For hosted payments, we'll construct the payment URL from the endpoint
      // The actual redirect happens client-side
      const responseText: string = await response.text()
      
      // Try to extract URL from HTML meta refresh or script redirect
      const metaRefreshMatch = responseText.match(
        /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)["']/i,
      )
      const scriptRedirectMatch = responseText.match(
        /window\.location\.(href|replace)\s*=\s*["']([^"']+)["']/i,
      )
      
      if (metaRefreshMatch && metaRefreshMatch[1]) {
        data.payment_url = decodeURIComponent(metaRefreshMatch[1].trim())
      } else if (scriptRedirectMatch && scriptRedirectMatch[2]) {
        data.payment_url = scriptRedirectMatch[2]
      } else {
        // If no redirect found, use the endpoint URL itself as payment URL
        // The hosted payment page will handle the payment flow
        data.payment_url = fullUrl
      }
      
      // Generate a session ID from order ID for tracking
      data.session_id = `session_${args.orderId}`
    } else if (!isJson && !isHtml) {
      throw new Error(
        `PayGate API returned unexpected content type: ${contentType}. Expected JSON or HTML.`,
      )
    }

    // Handle different response formats
    if (data.success === false || data.error) {
      throw new Error(data.error || 'Unknown PayGate error')
    }

    // Extract payment URL and session ID
    const paymentUrl: string =
      data.payment_url ||
      data.checkout_url ||
      data.url ||
      (paygatePaymentMethod === 'credit_card'
        ? `${checkoutUrl}?session=${data.session_id || data.sessionId || ''}`
        : data.qr_code || '')
    const sessionId: string | undefined = data.session_id || data.sessionId
    const transactionId: string | undefined =
      data.transaction_id || data.transactionId

    if (!paymentUrl) {
      throw new Error(
        'Invalid PayGate response: missing payment URL',
      )
    }

    // For hosted payments, session ID might not be in response, generate one
    // For crypto payments, session ID should be in the response
    const finalSessionId: string | undefined =
      sessionId ||
      (paygatePaymentMethod !== 'crypto' ? `session_${args.orderId}` : undefined)

    // Validate session ID for crypto payments (required)
    if (paygatePaymentMethod === 'crypto' && !finalSessionId) {
      throw new Error(
        'Invalid PayGate response: missing session ID for crypto payment',
      )
    }

    // Update order with PayGate payment information
    await ctx.runMutation(
      internalApi.orders?.m
        ?.updatePayment as unknown as FunctionReference<'mutation'>,
      {
        orderId: args.orderId,
        payment: {
          ...order.payment,
          paygateSessionId: finalSessionId,
          paygatePaymentUrl: paymentUrl,
          paygateTransactionId: transactionId,
          status: 'processing', // Mark as processing while payment is in progress
        },
      },
    )

    return {
      success: true,
      paymentUrl,
      sessionId: finalSessionId,
      transactionId,
    }
  },
})

/**
 * Check PayGate payment status
 */
export const checkPayGatePaymentStatus = action({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    status: string
    transactionId?: string | undefined
    paidAt?: number | undefined
    message?: string
  }> => {
    // Get order
    const order: OrderType | null = await ctx.runQuery(
      internalApi.orders?.q?.getOrder as unknown as FunctionReference<'query'>,
      {
        orderId: args.orderId,
      },
    )

    if (!order) {
      throw new Error('Order not found')
    }

    if (!order.payment.paygateSessionId) {
      throw new Error('Order does not have a PayGate session')
    }

    // Get admin settings for PayGate configuration
    const adminSettings: AdminSettings | null = await ctx.runQuery(
      internalApi.admin?.q
        ?.getAdminSettings as unknown as FunctionReference<'query'>,
      {},
    )
    const paygateSettings = adminSettings?.paygate

    // Get PayGate API URL
    const apiUrl: string = paygateSettings?.apiUrl || 'https://api.paygate.to'

    // Check payment status via PayGate API
    const response: Response = await fetch(
      `${apiUrl}/status.php?session_id=${order.payment.paygateSessionId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      return {
        status: order.payment.status,
        message: 'Unable to check payment status',
      }
    }

    const data: {
      status?: string
      transaction_id?: string
      transactionId?: string
      amount?: number
      currency?: string
      paid_at?: number
      paidAt?: number
    } = await response.json()
    const status: {
      status: string
      transactionId: string | undefined
      amount: number | undefined
      currency: string
      paidAt: number | undefined
    } = {
      status: data.status || 'pending',
      transactionId: data.transaction_id || data.transactionId,
      amount: data.amount,
      currency: data.currency || 'USD',
      paidAt: data.paid_at || data.paidAt,
    }

    // Update order payment status if changed
    if (status.status === 'completed' && order.payment.status !== 'completed') {
      await ctx.runMutation(
        internalApi.orders?.m
          ?.updatePayment as unknown as FunctionReference<'mutation'>,
        {
          orderId: args.orderId,
          payment: {
            ...order.payment,
            status: 'completed',
            transactionId: status.transactionId || order.payment.transactionId,
            paygateTransactionId: status.transactionId,
            paidAt: status.paidAt || Date.now(),
          },
        },
      )
    } else if (
      status.status === 'failed' &&
      order.payment.status !== 'failed'
    ) {
      await ctx.runMutation(
        internalApi.orders?.m
          ?.updatePayment as unknown as FunctionReference<'mutation'>,
        {
          orderId: args.orderId,
          payment: {
            ...order.payment,
            status: 'failed',
          },
        },
      )
    }

    return {
      status: status.status,
      transactionId: status.transactionId,
      paidAt: status.paidAt,
    }
  },
})
