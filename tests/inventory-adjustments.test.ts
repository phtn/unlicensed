import {buildInventoryInputs} from '@/app/admin/(routes)/inventory/product/_product-sections/inventory-adjustment-modal'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {describe, expect, test} from 'bun:test'
import {
  applyInventoryDeduction,
  applyInventoryUpdate,
} from '@/lib/inventory-adjustments'

const makeProduct = (
  overrides: Partial<Doc<'products'>> = {},
): Doc<'products'> => ({
  _id: 'products_test_123' as Id<'products'>,
  _creationTime: 0,
  inventoryMode: 'by_denomination',
  availableDenominations: [0.125, 0.25],
  stockByDenomination: {'0.125': 3, '1': 7},
  unit: 'oz',
  ...overrides,
})

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

describe('buildInventoryInputs', () => {
  test('prefers configured available denominations over extra stock map keys', () => {
    expect(buildInventoryInputs(makeProduct())).toEqual([
      {
        currentQuantity: 3,
        denomination: 0.125,
        key: '0.125',
        label: '⅛ oz',
        unit: 'oz',
      },
      {
        currentQuantity: 0,
        denomination: 0.25,
        key: '0.25',
        label: '¼ oz',
        unit: 'oz',
      },
    ])
  })

  test('respects the current form-selected denominations when provided', () => {
    expect(
      buildInventoryInputs(makeProduct(), 'by_denomination', {
        availableDenominations: [0.25],
      }),
    ).toEqual([
      {
        currentQuantity: 0,
        denomination: 0.25,
        key: '0.25',
        label: '¼ oz',
        unit: 'oz',
      },
    ])
  })

  test('falls back to stocked denomination keys for legacy by-denomination products', () => {
    expect(
      buildInventoryInputs(
        makeProduct({
          availableDenominations: [],
        }),
      ),
    ).toEqual([
      {
        currentQuantity: 3,
        denomination: 0.125,
        key: '0.125',
        label: '⅛ oz',
        unit: 'oz',
      },
      {
        currentQuantity: 7,
        denomination: 1,
        key: '1',
        label: '1 oz',
        unit: 'oz',
      },
    ])
  })
})
