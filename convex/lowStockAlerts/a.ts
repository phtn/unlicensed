import {v} from 'convex/values'
import {sendLowStockAlertEmail} from '../../lib/resend/send-low-stock-alert-email'
import {
  LOW_STOCK_ALERTS_IDENTIFIER,
  normalizeLowStockAlertsConfig,
} from '../../lib/low-stock-alerts'
import {getTotalStock} from '../../lib/productStock'
import {api, internal} from '../_generated/api'
import {internalAction} from '../_generated/server'

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

export const sendProductLowStockAlert = internalAction({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const product = await ctx.runQuery(api.products.q.getProductById, {
      productId: args.productId,
    })
    if (!product) {
      return {ok: false, ids: [] as string[], error: 'Product not found'}
    }

    const settings = await ctx.runQuery(api.admin.q.getAdminByIdentifier, {
      identifier: LOW_STOCK_ALERTS_IDENTIFIER,
    })
    const config = normalizeLowStockAlertsConfig(settings?.value)

    if (!config.enabled || config.recipients.length === 0) {
      return {
        ok: false,
        ids: [] as string[],
        error: 'Low stock alerts are not configured',
      }
    }

    const threshold = product.lowStockThreshold
    const currentStock = getTotalStock(product)

    if (
      product.archived === true ||
      typeof threshold !== 'number' ||
      currentStock > threshold
    ) {
      return {
        ok: false,
        ids: [] as string[],
        error: 'Product is no longer below its threshold',
      }
    }

    try {
      const result = await sendLowStockAlertEmail({
        product,
        recipients: config.recipients,
        currentStock,
        threshold,
      })

      await ctx.runMutation(
        internal.lowStockAlerts.m.markProductLowStockAlertSent,
        {
          productId: args.productId,
          currentStock,
          providerMessageIds: result.ids,
        },
      )

      return {ok: true, ids: result.ids}
    } catch (error) {
      const message = toErrorMessage(error)

      await ctx.runMutation(
        internal.lowStockAlerts.m.markProductLowStockAlertFailed,
        {
          productId: args.productId,
          error: message,
        },
      )

      console.error('[lowStockAlerts/sendProductLowStockAlert] send failed', {
        productId: args.productId,
        error: message,
      })

      return {ok: false, ids: [] as string[], error: message}
    }
  },
})
