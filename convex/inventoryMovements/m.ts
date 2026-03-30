import {v} from 'convex/values'
import {applyInventoryUpdate} from '../../lib/inventory-adjustments'
import {
  normalizeInventoryMode,
  roundStockQuantity,
} from '../../lib/productStock'
import {internal} from '../_generated/api'
import type {Doc} from '../_generated/dataModel'
import {mutation} from '../_generated/server'
import {insertInventoryMovement} from './lib'

const inventoryAdjustmentTypeSchema = v.union(
  v.literal('restock'),
  v.literal('manual_override'),
)

const inventoryAdjustmentModeSchema = v.union(
  v.literal('by_denomination'),
  v.literal('shared'),
)

const inventoryAdjustmentEntrySchema = v.object({
  denomination: v.optional(v.number()),
  quantity: v.number(),
})

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const validateAdjustmentQuantity = (
  type: 'restock' | 'manual_override',
  quantity: number,
) => {
  if (!Number.isFinite(quantity)) {
    throw new Error('Inventory quantity must be a valid number.')
  }

  if (type === 'restock' && quantity <= 0) {
    throw new Error('Restock quantities must be greater than 0.')
  }

  if (type === 'manual_override' && quantity < 0) {
    throw new Error('Manual override quantities must be 0 or greater.')
  }
}

const assertNoDuplicateAdjustments = (
  adjustments: Array<{denomination?: number}>,
) => {
  const seen = new Set<string>()

  for (const adjustment of adjustments) {
    const key =
      adjustment.denomination === undefined
        ? 'default'
        : String(adjustment.denomination)

    if (seen.has(key)) {
      throw new Error(
        `Duplicate inventory adjustment submitted for ${key === 'default' ? 'the default stock slot' : `denomination ${key}`}.`,
      )
    }

    seen.add(key)
  }
}

export const applyInventoryAdjustment = mutation({
  args: {
    productId: v.id('products'),
    type: inventoryAdjustmentTypeSchema,
    inventoryMode: v.optional(inventoryAdjustmentModeSchema),
    adjustments: v.array(inventoryAdjustmentEntrySchema),
    note: v.optional(v.string()),
    reference: v.optional(v.string()),
    performedByEmail: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('Product not found.')
    }

    if (args.adjustments.length === 0) {
      throw new Error('Provide at least one inventory adjustment.')
    }

    assertNoDuplicateAdjustments(args.adjustments)

    const currentInventoryMode = normalizeInventoryMode(product.inventoryMode)
    const inventoryMode = args.inventoryMode ?? currentInventoryMode
    const updates: Partial<Doc<'products'>> = {}
    const lines: Array<{
      denomination?: number
      previousQuantity: number
      quantityDelta: number
      nextQuantity: number
      unit?: string
    }> = []

    if (inventoryMode === 'shared') {
      if (args.adjustments.length !== 1) {
        throw new Error('Shared inventory accepts exactly one adjustment.')
      }

      const [adjustment] = args.adjustments
      if (adjustment.denomination !== undefined) {
        throw new Error(
          'Shared inventory adjustments cannot target denominations.',
        )
      }

      validateAdjustmentQuantity(args.type, adjustment.quantity)

      const currentQuantity = roundStockQuantity(
        product.masterStockQuantity ?? 0,
      )
      const change = applyInventoryUpdate({
        currentQuantity,
        requestedQuantity: adjustment.quantity,
        type: args.type,
      })
      const nextQuantity = roundStockQuantity(change.nextQuantity)
      const quantityDelta = roundStockQuantity(change.quantityDelta)

      updates.masterStockQuantity = nextQuantity
      lines.push({
        previousQuantity: currentQuantity,
        quantityDelta,
        nextQuantity,
        unit:
          normalizeOptionalString(product.masterStockUnit) ??
          normalizeOptionalString(product.unit),
      })
    } else {
      const hasDenominationAdjustments = args.adjustments.some(
        (adjustment) => adjustment.denomination !== undefined,
      )

      if (hasDenominationAdjustments) {
        if (
          args.adjustments.some(
            (adjustment) => adjustment.denomination === undefined,
          )
        ) {
          throw new Error(
            'Per-denomination inventory adjustments must include a denomination for every entry.',
          )
        }

        const nextStockByDenomination = {
          ...(product.stockByDenomination ?? {}),
        }

        for (const adjustment of args.adjustments) {
          validateAdjustmentQuantity(args.type, adjustment.quantity)

          const denomination = adjustment.denomination as number
          const key = String(denomination)
          const currentQuantity = roundStockQuantity(
            nextStockByDenomination[key] ?? 0,
          )
          const change = applyInventoryUpdate({
            currentQuantity,
            requestedQuantity: adjustment.quantity,
            type: args.type,
          })
          const nextQuantity = roundStockQuantity(change.nextQuantity)
          const quantityDelta = roundStockQuantity(change.quantityDelta)

          nextStockByDenomination[key] = nextQuantity
          lines.push({
            denomination,
            previousQuantity: currentQuantity,
            quantityDelta,
            nextQuantity,
            unit: normalizeOptionalString(product.unit),
          })
        }

        updates.stockByDenomination = nextStockByDenomination
        updates.stock = 0
      } else {
        if (args.adjustments.length !== 1) {
          throw new Error(
            'Legacy inventory accepts exactly one stock adjustment.',
          )
        }

        const [adjustment] = args.adjustments
        validateAdjustmentQuantity(args.type, adjustment.quantity)

        const currentQuantity = roundStockQuantity(product.stock ?? 0)
        const change = applyInventoryUpdate({
          currentQuantity,
          requestedQuantity: adjustment.quantity,
          type: args.type,
        })
        const nextQuantity = roundStockQuantity(change.nextQuantity)
        const quantityDelta = roundStockQuantity(change.quantityDelta)

        updates.stock = nextQuantity
        lines.push({
          previousQuantity: currentQuantity,
          quantityDelta,
          nextQuantity,
          unit: normalizeOptionalString(product.unit),
        })
      }
    }

    if (inventoryMode !== currentInventoryMode) {
      updates.inventoryMode = inventoryMode

      if (
        inventoryMode === 'shared' &&
        normalizeOptionalString(product.masterStockUnit) === undefined
      ) {
        updates.masterStockUnit = normalizeOptionalString(product.unit)
      }
    }

    await ctx.db.patch(args.productId, updates)

    const movementId = await insertInventoryMovement(ctx, {
      product,
      type: args.type,
      inventoryMode,
      lines,
      note: args.note,
      reference: args.reference,
      performedByEmail: args.performedByEmail,
      performedByName: args.performedByName,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.lowStockAlerts.m.evaluateProductAlertState,
      {
        productId: args.productId,
      },
    )

    return {
      movementId,
      success: true,
      nextInventoryState: {
        inventoryMode,
        stock: updates.stock ?? product.stock ?? 0,
        stockByDenomination:
          updates.stockByDenomination ?? product.stockByDenomination ?? {},
        masterStockQuantity:
          updates.masterStockQuantity ?? product.masterStockQuantity,
        masterStockUnit:
          updates.masterStockUnit ?? product.masterStockUnit ?? undefined,
      },
    }
  },
})
