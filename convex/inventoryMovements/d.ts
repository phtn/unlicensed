import {Infer, v} from 'convex/values'

export const inventoryMovementTypeSchema = v.union(
  v.literal('restock'),
  v.literal('manual_override'),
  v.literal('order_deduction'),
)

export const inventoryMovementLineSchema = v.object({
  denomination: v.optional(v.number()),
  previousQuantity: v.number(),
  quantityDelta: v.number(),
  nextQuantity: v.number(),
  unit: v.optional(v.string()),
})

export const inventoryMovementSchema = v.object({
  productId: v.id('products'),
  productName: v.optional(v.string()),
  productSlug: v.optional(v.string()),
  type: inventoryMovementTypeSchema,
  inventoryMode: v.union(v.literal('by_denomination'), v.literal('shared')),
  lines: v.array(inventoryMovementLineSchema),
  note: v.optional(v.string()),
  reference: v.optional(v.string()),
  sourceOrderId: v.optional(v.id('orders')),
  sourceOrderNumber: v.optional(v.string()),
  performedByEmail: v.optional(v.string()),
  performedByName: v.optional(v.string()),
  createdAt: v.number(),
})

export type InventoryMovementType = Infer<typeof inventoryMovementTypeSchema>
export type InventoryMovementLine = Infer<typeof inventoryMovementLineSchema>
export type InventoryMovement = Infer<typeof inventoryMovementSchema>
