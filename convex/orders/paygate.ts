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

    // Build request parameters
    const params: URLSearchParams = new URLSearchParams({
      amount: amountInDollars.toString(),
      currency: 'USD',
      order_id: order.orderNumber,
      return_url: args.returnUrl,
      ...(args.cancelUrl && {cancel_url: args.cancelUrl}),
      ...(args.webhookUrl && {webhook_url: args.webhookUrl}),
      ...(order.contactEmail && {email: order.contactEmail}),
      ...(order.contactPhone && {phone: order.contactPhone}),
      ...(order.shippingAddress.firstName && {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
      }),
      ...(paygatePaymentMethod && {payment_method: paygatePaymentMethod}),
      ...(usdcWallet && {wallet: usdcWallet}),
    })

    // PayGate uses different endpoints for credit card vs crypto
    const endpoint: string =
      paygatePaymentMethod === 'crypto'
        ? `${apiUrl}/crypto/create.php`
        : `${apiUrl}/create.php`

    // Create payment session via PayGate API
    const response: Response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorText: string = await response.text()
      throw new Error(`PayGate API error: ${response.status} ${errorText}`)
    }

    const data: {
      success?: boolean
      error?: string
      payment_url?: string
      checkout_url?: string
      session_id?: string
      sessionId?: string
      transaction_id?: string
      transactionId?: string
      qr_code?: string
    } = await response.json()

    // Handle different response formats
    if (data.success === false || data.error) {
      throw new Error(data.error || 'Unknown PayGate error')
    }

    // Extract payment URL and session ID
    const paymentUrl: string =
      data.payment_url ||
      data.checkout_url ||
      (paygatePaymentMethod === 'credit_card'
        ? `${checkoutUrl}?session=${data.session_id || data.sessionId || ''}`
        : data.qr_code || '')
    const sessionId: string | undefined = data.session_id || data.sessionId
    const transactionId: string | undefined =
      data.transaction_id || data.transactionId

    if (!paymentUrl || !sessionId) {
      throw new Error(
        'Invalid PayGate response: missing payment URL or session ID',
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
          paygateSessionId: sessionId,
          paygatePaymentUrl: paymentUrl,
          paygateTransactionId: transactionId,
          status: 'processing', // Mark as processing while payment is in progress
        },
      },
    )

    return {
      success: true,
      paymentUrl,
      sessionId,
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
