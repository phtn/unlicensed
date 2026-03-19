import {describe, expect, test} from 'bun:test'
import type {Doc} from '../convex/_generated/dataModel'
import {resolvePaymentEmailAmountUsd} from '../lib/resend/payment-email-amount'

const makeOrder = (
  overrides: Partial<Doc<'orders'>>,
  paymentOverrides?: Partial<Doc<'orders'>['payment']>,
) =>
  ({
    totalCents: 12_500,
    totalWithCryptoFeeCents: 13_313,
    processingFeeCents: undefined,
    payment: {
      method: 'cards',
      status: 'pending',
      usdValue: 125,
      ...paymentOverrides,
    },
    ...overrides,
  }) as Doc<'orders'>

describe('resolvePaymentEmailAmountUsd', () => {
  test('uses totalWithCryptoFeeCents for crypto pending/success emails', () => {
    const order = makeOrder(
      {},
      {
        method: 'crypto_commerce',
        usdValue: 125,
      },
    )

    expect(resolvePaymentEmailAmountUsd(order, 125)).toBe(133.13)
  })

  test('falls back to totalCents for crypto orders without totalWithCryptoFeeCents', () => {
    const order = makeOrder(
      {
        totalWithCryptoFeeCents: undefined,
      },
      {
        method: 'crypto_transfer',
      },
    )

    expect(resolvePaymentEmailAmountUsd(order)).toBe(125)
  })

  test('uses total plus processing fee for cash app pending/success emails', () => {
    const order = makeOrder(
      {
        processingFeeCents: 1_000,
      },
      {
        method: 'cash_app',
        usdValue: 125,
      },
    )

    expect(resolvePaymentEmailAmountUsd(order, 140.5)).toBe(135)
  })

  test('keeps non-crypto success fallback precedence intact', () => {
    const order = makeOrder({}, {method: 'cards', usdValue: 125})

    expect(resolvePaymentEmailAmountUsd(order, 140.5)).toBe(140.5)
    expect(resolvePaymentEmailAmountUsd(order)).toBe(125)
  })
})
