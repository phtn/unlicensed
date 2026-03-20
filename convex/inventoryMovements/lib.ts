import type {Doc, Id} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'
import type {InventoryMovementLine, InventoryMovementType} from './d'

const trimOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function insertInventoryMovement(
  ctx: MutationCtx,
  args: {
    inventoryMode: 'by_denomination' | 'shared'
    lines: InventoryMovementLine[]
    note?: string
    performedByEmail?: string
    performedByName?: string
    product: Pick<Doc<'products'>, '_id' | 'name' | 'slug'>
    reference?: string
    sourceOrderId?: Id<'orders'>
    sourceOrderNumber?: string
    type: InventoryMovementType
  },
) {
  return await ctx.db.insert('inventoryMovements', {
    productId: args.product._id,
    productName: args.product.name?.trim() || undefined,
    productSlug: args.product.slug?.trim() || undefined,
    type: args.type,
    inventoryMode: args.inventoryMode,
    lines: args.lines,
    note: trimOptionalString(args.note),
    reference: trimOptionalString(args.reference),
    sourceOrderId: args.sourceOrderId,
    sourceOrderNumber: trimOptionalString(args.sourceOrderNumber),
    performedByEmail: trimOptionalString(args.performedByEmail),
    performedByName: trimOptionalString(args.performedByName),
    createdAt: Date.now(),
  })
}
