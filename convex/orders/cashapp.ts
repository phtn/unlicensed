/**
 * Cash App Pay payment integration for orders
 *
 * Cash App Pay integration using Square's Payments API.
 * Requires Square Developer account and credentials.
 */

import {v} from 'convex/values'
import {resolveOrderPayableTotalCents} from '../../lib/checkout/processing-fee'
import {api} from '../_generated/api'
import {action} from '../_generated/server'
import type {OrderType} from './d'

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
    const order: OrderType | null = await ctx.runQuery(api.orders.q.getById, {
      id: args.orderId,
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (order.payment.status !== 'pending') {
      throw new Error('Order payment already processed')
    }

    if (order.payment.method !== 'cash_app') {
      throw new Error('Order payment method is not Cash App')
    }

    // Get admin settings for Cash App configuration
    const adminSettings = await ctx.runQuery(api.admin.q.getAdminByIdentifier, {
      identifier: 'cashapp',
    })
    const cashAppSettings =
      adminSettings?.value &&
      typeof adminSettings.value === 'object' &&
      'cashapp' in adminSettings.value &&
      adminSettings.value.cashapp &&
      typeof adminSettings.value.cashapp === 'object'
        ? (adminSettings.value.cashapp as Record<string, unknown>)
        : adminSettings?.value && typeof adminSettings.value === 'object'
          ? (adminSettings.value as Record<string, unknown>)
          : undefined

    // Get Cash App configuration from admin settings or environment
    // Note: Square credentials should be stored securely (env vars or admin settings)
    const squareAccessToken =
      (typeof cashAppSettings?.accessToken === 'string'
        ? cashAppSettings.accessToken
        : undefined) ||
      process.env.SQUARE_ACCESS_TOKEN ||
      ''
    const squareLocationId =
      (typeof cashAppSettings?.locationId === 'string'
        ? cashAppSettings.locationId
        : undefined) ||
      process.env.SQUARE_LOCATION_ID ||
      ''
    const squareEnvironment =
      ((cashAppSettings?.environment as 'sandbox' | 'production' | undefined) ??
        (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production')) ||
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
        amount: resolveOrderPayableTotalCents({
          paymentMethod: order.payment.method,
          totalCents: order.totalCents,
          processingFeeCents: order.processingFeeCents,
          totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
        }),
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
    await ctx.runMutation(api.orders.m.updatePayment, {
      orderId: args.orderId,
      payment: {
        ...order.payment,
        paymentIntentId: paymentId,
        status: 'processing',
      },
    })

    // Return configuration for frontend SDK
    return {
      success: true,
      paymentId,
      applicationId:
        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID ||
        (typeof cashAppSettings?.applicationId === 'string'
          ? cashAppSettings.applicationId
          : '') ||
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
    const order: OrderType | null = await ctx.runQuery(api.orders.q.getById, {
      id: args.orderId,
    })

    if (!order) {
      throw new Error('Order not found')
    }

    if (!order.payment.paymentIntentId) {
      throw new Error('Order does not have a Cash App payment ID')
    }

    // Get admin settings for Cash App configuration
    const adminSettings = await ctx.runQuery(api.admin.q.getAdminByIdentifier, {
      identifier: 'cashapp',
    })
    const cashAppSettings =
      adminSettings?.value &&
      typeof adminSettings.value === 'object' &&
      'cashapp' in adminSettings.value &&
      adminSettings.value.cashapp &&
      typeof adminSettings.value.cashapp === 'object'
        ? (adminSettings.value.cashapp as Record<string, unknown>)
        : adminSettings?.value && typeof adminSettings.value === 'object'
          ? (adminSettings.value as Record<string, unknown>)
          : undefined

    const squareAccessToken =
      (typeof cashAppSettings?.accessToken === 'string'
        ? cashAppSettings.accessToken
        : undefined) ||
      process.env.SQUARE_ACCESS_TOKEN ||
      ''
    const squareEnvironment =
      ((cashAppSettings?.environment as 'sandbox' | 'production' | undefined) ??
        (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production')) ||
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
      CANCELED: 'failed',
      FAILED: 'failed',
    }

    const status = {
      status: (statusMap[payment.status] || 'pending') as
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed',
      paymentId: payment.id,
      transactionId: payment.transaction_id,
      paidAt: payment.updated_at
        ? new Date(payment.updated_at).getTime()
        : undefined,
    }

    // Update order payment status if changed
    if (status.status === 'completed' && order.payment.status !== 'completed') {
      await ctx.runMutation(api.orders.m.updatePayment, {
        orderId: args.orderId,
        payment: {
          ...order.payment,
          status: 'completed',
          transactionId: status.transactionId || order.payment.transactionId,
          paidAt: status.paidAt || Date.now(),
        },
      })
    } else if (
      status.status === 'failed' &&
      order.payment.status !== 'failed'
    ) {
      await ctx.runMutation(api.orders.m.updatePayment, {
        orderId: args.orderId,
        payment: {
          ...order.payment,
          status: 'failed',
        },
      })
    }

    return {
      status: status.status,
      paymentId: status.paymentId,
      transactionId: status.transactionId,
      paidAt: status.paidAt,
    }
  },
})
