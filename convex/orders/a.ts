import {v} from 'convex/values'
import {sendPaymentPendingEmail} from '../../lib/resend/send-payment-pending-email'
import {sendPaymentSuccessEmail} from '../../lib/resend/send-payment-success-email'
import {internal} from '../_generated/api'
import type {Id} from '../_generated/dataModel'
import type {ActionCtx} from '../_generated/server'
import {internalAction} from '../_generated/server'

type OrderEmailSendResult = {
  ok: boolean
  id: string | null
  error?: string
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

async function attemptPaymentSuccessSend(
  ctx: ActionCtx,
  orderId: Id<'orders'>,
): Promise<OrderEmailSendResult> {
  const order = await ctx.runMutation(
    internal.orders.m.preparePaymentSuccessEmailAttempt,
    {
      orderId,
    },
  )

  if (!order) {
    return {ok: false, id: null, error: 'Order not eligible for send attempt'}
  }

  try {
    const result = await sendPaymentSuccessEmail({
      order,
      amountUsd: order.payment.usdValue,
      paidAt: order.payment.paidAt,
    })

    await ctx.runMutation(internal.orders.m.markPaymentSuccessEmailSent, {
      orderId: order._id,
      providerMessageId: result?.id ?? undefined,
    })

    return {
      ok: true,
      id: result?.id ?? null,
    }
  } catch (error) {
    const message = toErrorMessage(error)

    await ctx.runMutation(internal.orders.m.markPaymentSuccessEmailFailed, {
      orderId: order._id,
      error: message,
    })

    console.error('[orders/sendPaymentSuccessForOrder] send failed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      error: message,
    })

    return {
      ok: false,
      id: null,
      error: message,
    }
  }
}

async function attemptPendingPaymentSend(
  ctx: ActionCtx,
  orderId: Id<'orders'>,
): Promise<OrderEmailSendResult> {
  const order = await ctx.runMutation(
    internal.orders.m.preparePendingPaymentEmailAttempt,
    {
      orderId,
    },
  )

  if (!order) {
    return {ok: false, id: null, error: 'Order not eligible for send attempt'}
  }

  try {
    const result = await sendPaymentPendingEmail({
      order,
    })

    await ctx.runMutation(internal.orders.m.markPendingPaymentEmailSent, {
      orderId: order._id,
      providerMessageId: result?.id ?? undefined,
    })

    return {
      ok: true,
      id: result?.id ?? null,
    }
  } catch (error) {
    const message = toErrorMessage(error)

    await ctx.runMutation(internal.orders.m.markPendingPaymentEmailFailed, {
      orderId: order._id,
      error: message,
    })

    console.error('[orders/sendPendingPaymentForOrder] send failed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      error: message,
    })

    return {
      ok: false,
      id: null,
      error: message,
    }
  }
}

export const sendPendingPaymentForOrder: ReturnType<typeof internalAction> =
  internalAction({
    args: {
      orderId: v.id('orders'),
    },
    handler: async (ctx, args): Promise<OrderEmailSendResult> => {
      return attemptPendingPaymentSend(ctx, args.orderId)
    },
  })

export const sendPaymentSuccessForOrder: ReturnType<typeof internalAction> =
  internalAction({
    args: {
      orderId: v.id('orders'),
    },
    handler: async (ctx, args): Promise<OrderEmailSendResult> => {
      return attemptPaymentSuccessSend(ctx, args.orderId)
    },
  })

export const retryPendingPaymentEmails: ReturnType<typeof internalAction> =
  internalAction({
    args: {
      limit: v.optional(v.number()),
    },
    handler: async (
      ctx,
      args,
    ): Promise<{
      attempted: number
      sent: number
      failed: number
    }> => {
      const orderIds = await ctx.runQuery(
        internal.orders.q.listPendingPaymentEmailRetryCandidateIds,
        {
          limit: args.limit ?? 25,
        },
      )

      let attempted = 0
      let sent = 0
      let failed = 0

      for (const orderId of orderIds) {
        const result = await attemptPendingPaymentSend(ctx, orderId)

        if (result.error === 'Order not eligible for send attempt') {
          continue
        }

        attempted += 1
        if (result.ok) {
          sent += 1
        } else {
          failed += 1
        }
      }

      return {attempted, sent, failed}
    },
  })

export const retryPendingPaymentSuccessEmails: ReturnType<
  typeof internalAction
> = internalAction({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    attempted: number
    sent: number
    failed: number
  }> => {
    const orderIds = await ctx.runQuery(
      internal.orders.q.listPaymentSuccessEmailRetryCandidateIds,
      {
        limit: args.limit ?? 25,
      },
    )

    let attempted = 0
    let sent = 0
    let failed = 0

    for (const orderId of orderIds) {
      const result = await attemptPaymentSuccessSend(ctx, orderId)

      if (result.error === 'Order not eligible for send attempt') {
        continue
      }

      attempted += 1
      if (result.ok) {
        sent += 1
      } else {
        failed += 1
      }
    }

    return {attempted, sent, failed}
  },
})
