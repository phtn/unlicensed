/**
 * Cash App Pay payment integration for orders
 *
 * Cash App Pay integration using Square's Payments API.
 * Requires Square Developer account and credentials.
 */

import type {DefaultFunctionArgs, FunctionReference} from 'convex/server'
import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {action} from '../_generated/server'
import type {AdminSettings} from '../admin/d'
import type {OrderType} from './d'

// Type-safe access to internal API modules
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
 * Initiate Cash App Pay payment for an order
 *
 * This action prepares the order for Cash App Pay payment.
 * The actual payment flow is handled by Square's Web Payments SDK on the frontend.
 */
export const initiateCashAppPayment = action({
  args: {
    orderId: v.id('orders'),
    returnUrl: v.string(),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean
    paymentId?: string
    applicationId?: string
    locationId?: string
    error?: string
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

    if (order.payment.method !== 'cashapp') {
      throw new Error('Order payment method is not Cash App')
    }

    // Get admin settings for Cash App configuration
    const adminSettings: AdminSettings | null = await ctx.runQuery(
      internalApi.admin?.q
        ?.getAdminSettings as unknown as FunctionReference<'query'>,
      {},
    )

    // Get Cash App configuration from admin settings or environment
    // Note: Square credentials should be stored securely (env vars or admin settings)
    const squareAccessToken =
      adminSettings?.value?.cashapp?.accessToken ||
      process.env.SQUARE_ACCESS_TOKEN ||
      ''
    const squareLocationId =
      adminSettings?.value?.cashapp?.locationId ||
      process.env.SQUARE_LOCATION_ID ||
      ''
    const squareEnvironment =
      (adminSettings?.value?.cashapp?.environment as
        | 'sandbox'
        | 'production') ||
      (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') ||
      'sandbox'

    if (!squareAccessToken) {
      throw new Error(
        'Square access token not configured. Please configure it in admin settings or environment variables.',
      )
    }

    // Square API base URL
    const squareApiBase =
      squareEnvironment === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com'

    // Create payment request for Cash App Pay
    // Note: Cash App Pay uses Square's Payments API
    const paymentRequest = {
      source_id: 'CASH_APP', // Cash App Pay source
      idempotency_key: `cashapp_${order.orderNumber}_${Date.now()}`,
      amount_money: {
        amount: order.totalCents, // Square API uses cents
        currency: 'USD',
      },
      order_id: order.orderNumber,
      ...(order.contactEmail && {buyer_email_address: order.contactEmail}),
      ...(order.contactPhone && {buyer_phone_number: order.contactPhone}),
    }

    // Call Square Payments API
    const response = await fetch(`${squareApiBase}/v2/payments`, {
      method: 'POST',
      headers: {
        'Square-Version': '2023-10-18',
        Authorization: `Bearer ${squareAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.errors?.[0]?.detail || `Square API error: ${response.status}`,
      )
    }

    const data = await response.json()
    const paymentId = data.payment?.id

    if (!paymentId) {
      throw new Error('Failed to create Cash App payment request')
    }

    // Update order with payment information
    await ctx.runMutation(
      internalApi.orders?.m
        ?.updatePayment as unknown as FunctionReference<'mutation'>,
      {
        orderId: args.orderId,
        payment: {
          ...order.payment,
          paymentIntentId: paymentId, // Store Square payment ID
          status: 'processing', // Mark as processing while payment is in progress
        },
      },
    )

    // Return configuration for frontend SDK
    return {
      success: true,
      paymentId,
      applicationId:
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ||
        adminSettings?.value?.cashapp?.applicationId ||
        '',
      locationId: squareLocationId,
    }
  },
})

/**
 * Check Cash App Pay payment status
 */
export const checkCashAppPaymentStatus = action({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    status: string
    paymentId?: string
    transactionId?: string
    paidAt?: number
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

    if (!order.payment.paymentIntentId) {
      throw new Error('Order does not have a Cash App payment ID')
    }

    // Get admin settings for Cash App configuration
    const adminSettings: AdminSettings | null = await ctx.runQuery(
      internalApi.admin?.q
        ?.getAdminSettings as unknown as FunctionReference<'query'>,
      {},
    )

    const squareAccessToken =
      adminSettings?.value?.cashapp?.accessToken ||
      process.env.SQUARE_ACCESS_TOKEN ||
      ''
    const squareEnvironment =
      (adminSettings?.value?.cashapp?.environment as
        | 'sandbox'
        | 'production') ||
      (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') ||
      'sandbox'

    if (!squareAccessToken) {
      throw new Error('Square access token not configured')
    }

    // Square API base URL
    const squareApiBase =
      squareEnvironment === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com'

    // Check payment status via Square API
    const response = await fetch(
      `${squareApiBase}/v2/payments/${order.payment.paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Square-Version': '2023-10-18',
          Authorization: `Bearer ${squareAccessToken}`,
        },
      },
    )

    if (!response.ok) {
      return {
        status: order.payment.status,
        message: 'Unable to check payment status',
      }
    }

    const data = await response.json()
    const payment = data.payment

    // Map Square status to our status
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      APPROVED: 'completed',
      COMPLETED: 'completed',
      CANCELED: 'cancelled',
      FAILED: 'failed',
    }

    const status = {
      status: (statusMap[payment.status] || 'pending') as
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'cancelled',
      paymentId: payment.id,
      transactionId: payment.transaction_id,
      paidAt: payment.updated_at
        ? new Date(payment.updated_at).getTime()
        : undefined,
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
      paymentId: status.paymentId,
      transactionId: status.transactionId,
      paidAt: status.paidAt,
    }
  },
})
