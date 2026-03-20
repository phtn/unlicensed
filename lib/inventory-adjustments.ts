export type InventoryUpdateType = 'restock' | 'manual_override'

export type InventoryQuantityChange = {
  previousQuantity: number
  quantityDelta: number
  nextQuantity: number
}

export function applyInventoryUpdate(args: {
  currentQuantity: number
  requestedQuantity: number
  type: InventoryUpdateType
}): InventoryQuantityChange {
  const {currentQuantity, requestedQuantity, type} = args

  if (!Number.isFinite(currentQuantity) || currentQuantity < 0) {
    throw new Error('Current inventory quantity must be a non-negative number.')
  }

  if (!Number.isFinite(requestedQuantity) || requestedQuantity < 0) {
    throw new Error(
      'Requested inventory quantity must be a non-negative number.',
    )
  }

  if (type === 'restock') {
    return {
      previousQuantity: currentQuantity,
      quantityDelta: requestedQuantity,
      nextQuantity: currentQuantity + requestedQuantity,
    }
  }

  return {
    previousQuantity: currentQuantity,
    quantityDelta: requestedQuantity - currentQuantity,
    nextQuantity: requestedQuantity,
  }
}

export function applyInventoryDeduction(args: {
  currentQuantity: number
  deductionQuantity: number
}): InventoryQuantityChange {
  const {currentQuantity, deductionQuantity} = args

  if (!Number.isFinite(currentQuantity) || currentQuantity < 0) {
    throw new Error('Current inventory quantity must be a non-negative number.')
  }

  if (!Number.isFinite(deductionQuantity) || deductionQuantity < 0) {
    throw new Error('Deduction quantity must be a non-negative number.')
  }

  const nextQuantity = Math.max(0, currentQuantity - deductionQuantity)

  return {
    previousQuantity: currentQuantity,
    quantityDelta: nextQuantity - currentQuantity,
    nextQuantity,
  }
}
