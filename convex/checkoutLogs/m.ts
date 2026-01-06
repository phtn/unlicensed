import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {
  checkoutErrorTypeSchema,
  checkoutLogSchema,
  checkoutStatusSchema,
} from './d'

/**
 * Clean IP address by removing IPv4-mapped IPv6 prefix if present
 * @param ip - IP address to clean
 * @returns Cleaned IP address
 */
function cleanIpAddress(ip: string | undefined): string | undefined {
  if (!ip) return undefined
  // Remove IPv4-mapped IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7) // Remove '::ffff:' (7 characters)
  } else if (ip.startsWith('::')) {
    return ip.substring(2) // Remove '::' (2 characters)
  }
  return ip
}

/**
 * Create a checkout log entry
 */
export const createCheckoutLog = mutation({
  args: checkoutLogSchema,
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert('checkoutLogs', {
      orderId: args.orderId ?? null,
      orderNumber: args.orderNumber,
      status: args.status,
      userId: args.userId ?? null,
      sessionId: args.sessionId,
      error: args.error,
      errorType: args.errorType,
      errorDetails: args.errorDetails,
      paymentMethod: args.paymentMethod,
      paymentIntentId: args.paymentIntentId,
      paygateSessionId: args.paygateSessionId,
      transactionId: args.transactionId,
      cartSnapshot: args.cartSnapshot,
      ipAddress: cleanIpAddress(args.ipAddress),
      userAgent: args.userAgent,
      metadata: args.metadata,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    })

    return logId
  },
})

/**
 * Update an existing checkout log entry
 */
export const updateCheckoutLog = mutation({
  args: {
    logId: v.id('checkoutLogs'),
    status: v.optional(checkoutStatusSchema),
    orderId: v.optional(v.union(v.id('orders'), v.null())),
    orderNumber: v.optional(v.string()),
    error: v.optional(v.string()),
    errorType: v.optional(checkoutErrorTypeSchema),
    errorDetails: v.optional(v.record(v.string(), v.any())),
    paymentIntentId: v.optional(v.string()),
    paygateSessionId: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const {logId, ...updates} = args

    // Get existing log
    const existingLog = await ctx.db.get(logId)
    if (!existingLog) {
      throw new Error(`Checkout log with ID ${logId} not found`)
    }

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status
    }
    if (updates.orderId !== undefined) {
      updateData.orderId = updates.orderId
    }
    if (updates.orderNumber !== undefined) {
      updateData.orderNumber = updates.orderNumber
    }
    if (updates.error !== undefined) {
      updateData.error = updates.error
    }
    if (updates.errorType !== undefined) {
      updateData.errorType = updates.errorType
    }
    if (updates.errorDetails !== undefined) {
      updateData.errorDetails = updates.errorDetails
    }
    if (updates.paymentIntentId !== undefined) {
      updateData.paymentIntentId = updates.paymentIntentId
    }
    if (updates.paygateSessionId !== undefined) {
      updateData.paygateSessionId = updates.paygateSessionId
    }
    if (updates.transactionId !== undefined) {
      updateData.transactionId = updates.transactionId
    }
    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata
    }

    await ctx.db.patch(logId, updateData)

    return logId
  },
})

/**
 * Batch create multiple checkout log entries
 */
export const createCheckoutLogsBatch = mutation({
  args: {
    logs: v.array(checkoutLogSchema),
  },
  handler: async (ctx, args) => {
    const logIds: string[] = []

    for (const log of args.logs) {
      const logId = await ctx.db.insert('checkoutLogs', {
        orderId: log.orderId ?? null,
        orderNumber: log.orderNumber,
        status: log.status,
        userId: log.userId ?? null,
        sessionId: log.sessionId,
        error: log.error,
        errorType: log.errorType,
        errorDetails: log.errorDetails,
        paymentMethod: log.paymentMethod,
        paymentIntentId: log.paymentIntentId,
        paygateSessionId: log.paygateSessionId,
        transactionId: log.transactionId,
        cartSnapshot: log.cartSnapshot,
        ipAddress: cleanIpAddress(log.ipAddress),
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      })
      logIds.push(logId)
    }

    return logIds
  },
})
