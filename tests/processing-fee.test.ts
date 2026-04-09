import {describe, expect, test} from 'bun:test'
import {
  computePersistedOrderPaymentAmounts,
  computeCryptoFeeCents,
  computeOrderTotalCents,
  computeProcessingFeeCents,
  resolveOrderPayableTotalCents,
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

  test('applies the default 5% processing fee to cash app orders', () => {
    expect(
      computeProcessingFeeCents({
        discountedSubtotalCents: 10_000,
        enabled: false,
        paymentMethod: 'cash_app',
        percent: 0,
        shippingCents: 500,
      }),
    ).toBe(525)
  })

  test('uses the configured cash app fee when provided', () => {
    expect(
      computeProcessingFeeCents({
        discountedSubtotalCents: 10_000,
        enabled: false,
        paymentMethod: 'cash_app',
        percent: 0,
        cashAppPercent: 7.5,
        shippingCents: 500,
      }),
    ).toBe(788)
  })

  test('resolves a fee-inclusive payable total for cash app orders', () => {
    expect(
      resolveOrderPayableTotalCents({
        paymentMethod: 'cash_app',
        totalCents: 12_500,
        processingFeeCents: 1_000,
      }),
    ).toBe(13_500)
  })

  test('stores cash app processing fee without populating crypto totals', () => {
    expect(
      computePersistedOrderPaymentAmounts({
        paymentMethod: 'cash_app',
        discountedSubtotalCents: 10_000,
        totalCents: 12_500,
        taxCents: 2_000,
        shippingCents: 500,
        processingFeeEnabled: false,
        processingFeePercent: 0,
        cryptoFeeEnabled: true,
        cryptoFeeAcc: 1.03,
      }),
    ).toEqual({
      processingFeeCents: 525,
      cryptoFeeCents: undefined,
      totalWithCryptoFeeCents: undefined,
    })
  })

  test('stores crypto-only totals separately from processing fees', () => {
    expect(
      computePersistedOrderPaymentAmounts({
        paymentMethod: 'crypto_transfer',
        discountedSubtotalCents: 10_000,
        totalCents: 10_500,
        taxCents: 500,
        shippingCents: 0,
        processingFeeEnabled: true,
        processingFeePercent: 5,
        cryptoFeeEnabled: true,
        cryptoFeeAcc: 1.03,
      }),
    ).toEqual({
      processingFeeCents: 500,
      cryptoFeeCents: 830,
      totalWithCryptoFeeCents: 11_330,
    })
  })
})
