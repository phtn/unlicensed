import {describe, expect, test} from 'bun:test'
import {
  convertWeight,
  formatStockDisplay,
  getAvailableCartQuantityForDenomination,
  getSharedInventoryLineQuantity,
  getSharedWeightLineQuantity,
  getStockForDenomination,
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

  test('uses master stock as the total stock for shared count pools', () => {
    expect(
      getTotalStock({
        inventoryMode: 'shared',
        masterStockQuantity: 12,
        masterStockUnit: 'units',
        unit: 'oz',
        stockByDenomination: {'0.125': 99},
      }),
    ).toBe(12)
  })

  test('uses shared master stock even when a denomination count is missing', () => {
    expect(
      getStockForDenomination(
        {
          inventoryMode: 'shared',
          masterStockQuantity: 24,
          masterStockUnit: 'oz',
          unit: 'oz',
          stockByDenomination: {'1': 2},
        },
        0.5,
      ),
    ).toBe(24)
  })

  test('treats the smallest denomination as one shared unit when master stock is units', () => {
    expect(
      getSharedInventoryLineQuantity(
        {
          inventoryMode: 'shared',
          masterStockQuantity: 10,
          masterStockUnit: 'units',
          unit: 'oz',
          availableDenominations: [0.125, 0.25, 0.5],
        },
        0.125,
        1,
      ),
    ).toBe(1)
  })

  test('scales shared unit consumption by denomination ratio', () => {
    expect(
      getSharedInventoryLineQuantity(
        {
          inventoryMode: 'shared',
          masterStockQuantity: 10,
          masterStockUnit: 'units',
          unit: 'oz',
          availableDenominations: [0.125, 0.25, 0.5],
        },
        0.25,
        2,
      ),
    ).toBe(4)
  })

  test('converts shared stock into selectable denomination count using the master stock unit', () => {
    expect(
      getAvailableCartQuantityForDenomination(
        {
          inventoryMode: 'shared',
          masterStockQuantity: 1,
          masterStockUnit: 'oz',
          availableDenominations: [3.5, 7],
          unit: 'g',
        },
        3.5,
      ),
    ).toBe(8)
  })

  test('returns shared count inventory in denomination-sized units', () => {
    expect(
      getAvailableCartQuantityForDenomination(
        {
          inventoryMode: 'shared',
          masterStockQuantity: 5,
          masterStockUnit: 'units',
          unit: 'oz',
          availableDenominations: [0.125, 0.25],
        },
        0.25,
      ),
    ).toBe(2)
  })

  test('treats missing by-denomination stock as unavailable', () => {
    expect(
      getStockForDenomination(
        {
          inventoryMode: 'by_denomination',
          stockByDenomination: {'1': 3},
          stock: 9,
        },
        0.5,
      ),
    ).toBe(0)
  })

  test('preserves by-denomination quantity for direct add-to-cart checks', () => {
    expect(
      getAvailableCartQuantityForDenomination(
        {
          inventoryMode: 'by_denomination',
          stockByDenomination: {'0.5': 4},
        },
        0.5,
      ),
    ).toBe(4)
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
