import { describe, expect, test } from 'bun:test'
import {
    convertWeight,
    formatStockDisplay,
    getSharedWeightLineQuantity,
    getTotalStock,
    usesSharedWeightInventory,
} from '../lib/productStock'

describe('product stock helpers', () => {
  test('converts ounces to pounds for shared inventory deductions', () => {
    expect(convertWeight(0.5, 'oz', 'lb')).toBeCloseTo(0.03125, 6)
  })

  test('detects shared weight inventory products', () => {
    expect(
      usesSharedWeightInventory({
        inventoryMode: 'shared_weight',
        masterStockQuantity: 10,
        masterStockUnit: 'lb',
        unit: 'oz',
      }),
    ).toBe(true)
  })

  test('computes line deductions in the master stock unit', () => {
    expect(
      getSharedWeightLineQuantity(
        {
          inventoryMode: 'shared_weight',
          masterStockQuantity: 10,
          masterStockUnit: 'lb',
          unit: 'oz',
        },
        0.5,
        1,
      ),
    ).toBeCloseTo(0.03125, 6)
  })

  test('uses master stock as the total stock for shared pools', () => {
    expect(
      getTotalStock({
        inventoryMode: 'shared_weight',
        masterStockQuantity: 160,
        masterStockUnit: 'oz',
        unit: 'oz',
        stockByDenomination: {'0.5': 10},
      }),
    ).toBe(160)
  })

  test('formats shared stock with units for admin/store displays', () => {
    expect(
      formatStockDisplay({
        inventoryMode: 'shared_weight',
        masterStockQuantity: 9.5,
        masterStockUnit: 'lb',
        unit: 'oz',
      }),
    ).toBe('9.5 lb')
  })
})
