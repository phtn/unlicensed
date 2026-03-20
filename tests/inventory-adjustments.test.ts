import {describe, expect, test} from 'bun:test'
import {
  applyInventoryDeduction,
  applyInventoryUpdate,
} from '@/lib/inventory-adjustments'

describe('applyInventoryUpdate', () => {
  test('adds restock quantities on top of the current quantity', () => {
    expect(
      applyInventoryUpdate({
        currentQuantity: 12,
        requestedQuantity: 5,
        type: 'restock',
      }),
    ).toEqual({
      previousQuantity: 12,
      quantityDelta: 5,
      nextQuantity: 17,
    })
  })

  test('sets exact quantities for manual overrides', () => {
    expect(
      applyInventoryUpdate({
        currentQuantity: 12,
        requestedQuantity: 4,
        type: 'manual_override',
      }),
    ).toEqual({
      previousQuantity: 12,
      quantityDelta: -8,
      nextQuantity: 4,
    })
  })
})

describe('applyInventoryDeduction', () => {
  test('subtracts deductions from the current quantity', () => {
    expect(
      applyInventoryDeduction({
        currentQuantity: 9,
        deductionQuantity: 3,
      }),
    ).toEqual({
      previousQuantity: 9,
      quantityDelta: -3,
      nextQuantity: 6,
    })
  })

  test('clamps deductions at zero', () => {
    expect(
      applyInventoryDeduction({
        currentQuantity: 2,
        deductionQuantity: 5,
      }),
    ).toEqual({
      previousQuantity: 2,
      quantityDelta: -2,
      nextQuantity: 0,
    })
  })
})
