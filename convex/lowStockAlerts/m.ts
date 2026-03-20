import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {internalMutation} from '../_generated/server'
import {
  LOW_STOCK_ALERTS_IDENTIFIER,
  normalizeLowStockAlertsConfig,
  resolveLowStockAlertTransition,
} from '../../lib/low-stock-alerts'
import {getTotalStock} from '../../lib/productStock'

export const evaluateProductAlertState = internalMutation({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return null
    }

    const settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) =>
        q.eq('identifier', LOW_STOCK_ALERTS_IDENTIFIER),
      )
      .unique()
    const config = normalizeLowStockAlertsConfig(settings?.value)
    const currentStock = getTotalStock(product)
    const transition = resolveLowStockAlertTransition({
      isArchived: product.archived === true,
      threshold: product.lowStockThreshold,
      currentStock,
      isActive: product.lowStockAlertActive === true,
      alertsEnabled: config.enabled,
      recipientCount: config.recipients.length,
    })

    if (transition === 'clear') {
      await ctx.db.patch(args.productId, {
        lowStockAlertActive: false,
        lowStockAlertLastError: undefined,
      })
      return {status: 'cleared', currentStock}
    }

    if (transition === 'schedule') {
      const now = Date.now()
      await ctx.db.patch(args.productId, {
        lowStockAlertActive: true,
        lowStockAlertTriggeredAt: now,
        lowStockAlertLastNotifiedStock: currentStock,
        lowStockAlertLastError: undefined,
      })

      await ctx.scheduler.runAfter(
        0,
        internal.lowStockAlerts.a.sendProductLowStockAlert,
        {
          productId: args.productId,
        },
      )

      return {status: 'scheduled', currentStock}
    }

    return {status: 'noop', currentStock}
  },
})

export const markProductLowStockAlertSent = internalMutation({
  args: {
    productId: v.id('products'),
    currentStock: v.number(),
    providerMessageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return null
    }

    await ctx.db.patch(args.productId, {
      lowStockAlertActive: true,
      lowStockAlertLastSentAt: Date.now(),
      lowStockAlertLastNotifiedStock: args.currentStock,
      lowStockAlertLastMessageIds: args.providerMessageIds,
      lowStockAlertLastError: undefined,
    })

    return args.productId
  },
})

export const markProductLowStockAlertFailed = internalMutation({
  args: {
    productId: v.id('products'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return null
    }

    await ctx.db.patch(args.productId, {
      lowStockAlertLastError: args.error,
    })

    return args.productId
  },
})
