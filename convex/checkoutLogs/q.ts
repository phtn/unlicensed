import {v} from 'convex/values'
import {query} from '../_generated/server'
import {safeGet} from '../utils/id_validation'

/**
 * Get checkout logs with pagination and filters
 */
export const getCheckoutLogs = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('initiated'),
        v.literal('cart_validated'),
        v.literal('address_collected'),
        v.literal('payment_initiated'),
        v.literal('payment_processing'),
        v.literal('payment_completed'),
        v.literal('order_created'),
        v.literal('failed'),
        v.literal('cancelled'),
        v.literal('timeout'),
      ),
    ),
    userId: v.optional(v.id('users')),
    orderId: v.optional(v.id('orders')),
    sessionId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    errorType: v.optional(
      v.union(
        v.literal('validation_error'),
        v.literal('payment_error'),
        v.literal('inventory_error'),
        v.literal('network_error'),
        v.literal('server_error'),
        v.literal('unknown_error'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50

    // Start with base query
    let logs
    if (args.status) {
      // Use index for status filter
      logs = await ctx.db
        .query('checkoutLogs')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .order('desc')
        .collect()
    } else if (args.userId !== undefined) {
      // Use index for user filter
      logs = await ctx.db
        .query('checkoutLogs')
        .withIndex('by_user', (q) => q.eq('userId', args.userId!))
        .order('desc')
        .collect()
    } else if (args.orderId !== undefined) {
      // Use index for order filter
      logs = await ctx.db
        .query('checkoutLogs')
        .withIndex('by_order', (q) => q.eq('orderId', args.orderId!))
        .order('desc')
        .collect()
    } else {
      // Use index for created_at when no specific filter
      logs = await ctx.db
        .query('checkoutLogs')
        .withIndex('by_created_at')
        .order('desc')
        .collect()
    }

    // Apply additional filters in memory
    let filteredLogs = logs

    if (args.userId !== undefined && !args.status) {
      // Only filter if we didn't already use userId index
      filteredLogs = filteredLogs.filter((log) => log.userId === args.userId)
    }

    if (args.orderId !== undefined && !args.status && args.userId === undefined) {
      // Only filter if we didn't already use orderId index
      filteredLogs = filteredLogs.filter((log) => log.orderId === args.orderId)
    }

    if (args.sessionId) {
      filteredLogs = filteredLogs.filter((log) => log.sessionId === args.sessionId)
    }

    if (args.errorType) {
      filteredLogs = filteredLogs.filter((log) => log.errorType === args.errorType)
    }

    if (args.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt <= args.endDate!)
    }

    // Apply pagination
    const hasMore = filteredLogs.length > limit
    const results = hasMore ? filteredLogs.slice(0, limit) : filteredLogs

    // Fetch related data
    // Validate userId and orderId from database before using in get()
    const logsWithRelations = await Promise.all(
      results.map(async (log) => {
        const user = log.userId
          ? await safeGet(ctx.db, 'users', log.userId)
          : null
        const order = log.orderId
          ? await safeGet(ctx.db, 'orders', log.orderId)
          : null

        return {
          ...log,
          user: user
            ? {
                name: user.name,
                email: user.email,
                photoUrl: user.photoUrl,
              }
            : null,
          order: order
            ? {
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                totalCents: order.totalCents,
              }
            : null,
        }
      }),
    )

    return {
      logs: logsWithRelations,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : null,
    }
  },
})

/**
 * Get checkout logs by order ID
 */
export const getCheckoutLogsByOrder = query({
  args: {
    orderId: v.id('orders'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('checkoutLogs')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get checkout logs by user ID
 */
export const getCheckoutLogsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('checkoutLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get checkout logs by session ID (for tracking a checkout flow)
 */
export const getCheckoutLogsBySession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: This requires a full table scan if sessionId is not indexed
    // Consider adding an index if this query is used frequently
    const logs = await ctx.db.query('checkoutLogs').collect()

    const sessionLogs = logs
      .filter((log) => log.sessionId === args.sessionId)
      .sort((a, b) => b.createdAt - a.createdAt)

    return sessionLogs
  },
})

/**
 * Get checkout statistics
 */
export const getCheckoutStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query('checkoutLogs')
      .withIndex('by_created_at')
      .order('desc')
      .collect()

    // Apply date filters
    if (args.startDate) {
      logs = logs.filter((log) => log.createdAt >= args.startDate!)
    }
    if (args.endDate) {
      logs = logs.filter((log) => log.createdAt <= args.endDate!)
    }

    // Calculate statistics
    const totalCheckouts = logs.length
    const successfulCheckouts = logs.filter(
      (log) => log.status === 'order_created',
    ).length
    const failedCheckouts = logs.filter((log) => log.status === 'failed').length
    const cancelledCheckouts = logs.filter(
      (log) => log.status === 'cancelled',
    ).length

    // Group by status
    const checkoutsByStatus: Record<string, number> = {}
    logs.forEach((log) => {
      checkoutsByStatus[log.status] = (checkoutsByStatus[log.status] || 0) + 1
    })

    // Group by error type (for failed checkouts)
    const errorsByType: Record<string, number> = {}
    logs
      .filter((log) => log.errorType)
      .forEach((log) => {
        const errorType = log.errorType!
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1
      })

    // Group by payment method
    const checkoutsByPaymentMethod: Record<string, number> = {}
    logs
      .filter((log) => log.paymentMethod)
      .forEach((log) => {
        const method = log.paymentMethod!
        checkoutsByPaymentMethod[method] =
          (checkoutsByPaymentMethod[method] || 0) + 1
      })

    // Calculate conversion rate
    const conversionRate =
      totalCheckouts > 0
        ? (successfulCheckouts / totalCheckouts) * 100
        : 0

    return {
      totalCheckouts,
      successfulCheckouts,
      failedCheckouts,
      cancelledCheckouts,
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      checkoutsByStatus,
      errorsByType,
      checkoutsByPaymentMethod,
    }
  },
})

/**
 * Get a single checkout log by ID
 */
export const getCheckoutLogById = query({
  args: {
    logId: v.id('checkoutLogs'),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId)

    if (!log) {
      return null
    }

    // Fetch related data
    // Validate userId and orderId from database before using in get()
    const user = log.userId ? await safeGet(ctx.db, 'users', log.userId) : null
    const order = log.orderId
      ? await safeGet(ctx.db, 'orders', log.orderId)
      : null

    return {
      ...log,
      user: user
        ? {
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
          }
        : null,
      order: order
        ? {
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalCents: order.totalCents,
          }
        : null,
    }
  },
})
