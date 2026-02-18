import {describe, expect, test} from 'bun:test'
import {
  getCryptoFallbackHref,
  isCryptoPaymentMethod,
  isPaymentCompleted,
} from '../app/lobby/(store)/order/[orderId]/crypto/route-utils'

describe('Order Crypto Route Utils', () => {
  test('accepts crypto payment methods for /lobby/order/[orderId]/crypto', () => {
    expect(isCryptoPaymentMethod('crypto_commerce')).toBe(true)
    expect(isCryptoPaymentMethod('crypto_transfer')).toBe(true)
    expect(isCryptoPaymentMethod('crypto-payment')).toBe(true)
  })

  test('rejects non-crypto payment methods for /lobby/order/[orderId]/crypto', () => {
    expect(isCryptoPaymentMethod('cards')).toBe(false)
    expect(isCryptoPaymentMethod('cash_app')).toBe(false)
    expect(isCryptoPaymentMethod('unknown')).toBe(false)
  })

  test('uses cards fallback route when payment method is cards', () => {
    expect(getCryptoFallbackHref('order_123', 'cards')).toBe(
      '/lobby/order/order_123/cards',
    )
  })

  test('uses cash app fallback route when payment method is cash_app', () => {
    expect(getCryptoFallbackHref('order_123', 'cash_app')).toBe(
      '/lobby/order/order_123/cashapp',
    )
  })

  test('defaults fallback route to crypto for unknown methods', () => {
    expect(getCryptoFallbackHref('order_123', 'bank_transfer')).toBe(
      '/lobby/order/order_123/crypto',
    )
  })

  test('marks payment success state only when status is completed', () => {
    expect(isPaymentCompleted('completed')).toBe(true)
    expect(isPaymentCompleted('pending')).toBe(false)
    expect(isPaymentCompleted('processing')).toBe(false)
    expect(isPaymentCompleted('failed')).toBe(false)
  })
})
