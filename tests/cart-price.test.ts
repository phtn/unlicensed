import {describe, expect, test} from 'bun:test'
import {
  getBundleTotalCents,
  getRegularBundleTotalCents,
  getUnitPriceBreakdown,
  getUnitPriceCents,
} from '../utils/cartPrice'

describe('cart price helpers', () => {
  test('uses sale denomination price when product is on sale', () => {
    const product = {
      onSale: true,
      priceByDenomination: {'3.5': 4000},
      salePriceByDenomination: {'3.5': 3200},
    }

    expect(getUnitPriceCents(product, 3.5)).toBe(3200)
    expect(getUnitPriceBreakdown(product, 3.5)).toEqual({
      unitCents: 3200,
      regularCents: 4000,
      saleCents: 3200,
      isOnSale: true,
    })
  })

  test('ignores sale denomination price when sale flag is off', () => {
    const product = {
      onSale: false,
      priceByDenomination: {'3.5': 4000},
      salePriceByDenomination: {'3.5': 3200},
    }

    expect(getUnitPriceCents(product, 3.5)).toBe(4000)
    expect(getUnitPriceBreakdown(product, 3.5).isOnSale).toBe(false)
  })

  test('ignores sale price when it is not lower than regular price', () => {
    const product = {
      onSale: true,
      priceByDenomination: {'3.5': 4000},
      salePriceByDenomination: {'3.5': 4200},
    }

    expect(getUnitPriceCents(product, 3.5)).toBe(4000)
    expect(getUnitPriceBreakdown(product, 3.5).isOnSale).toBe(false)
  })

  test('can compute effective and regular bundle totals separately', () => {
    const products = [
      {
        onSale: true,
        priceByDenomination: {'3.5': 4000},
        salePriceByDenomination: {'3.5': 3000},
      },
      {
        onSale: false,
        priceByDenomination: {'3.5': 5000},
        salePriceByDenomination: {'3.5': 3500},
      },
    ]

    expect(getBundleTotalCents(products, 3.5, 3.5)).toBe(4000)
    expect(getRegularBundleTotalCents(products, 3.5, 3.5)).toBe(4500)
  })
})
