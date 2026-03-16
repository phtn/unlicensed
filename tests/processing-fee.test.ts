import { describe, expect, test } from 'bun:test'
import {
    computeCryptoFeeCents,
    computeOrderTotalCents,
} from '../lib/checkout/processing-fee'

describe('checkout pricing helpers', () => {
  test('subtracts discounts from the order total before crypto fees', () => {
    expect(
      computeOrderTotalCents({
        subtotalCents: 15_000,
        taxCents: 1_500,
        shippingCents: 399,
        discountCents: 10_000,
      }),
    ).toBe(6_899)
  })

  test('computes crypto fee as the delta from the discounted total', () => {
    const totalCents = computeOrderTotalCents({
      subtotalCents: 15_000,
      taxCents: 1_500,
      shippingCents: 399,
      discountCents: 10_000,
    })
    const totalWithCryptoFeeCents = 7_244

    expect(
      computeCryptoFeeCents({
        totalCents,
        totalWithCryptoFeeCents,
      }),
    ).toBe(345)
  })
})
