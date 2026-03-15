import {describe, expect, test} from 'bun:test'
import {
  canAttemptPendingPaymentEmail,
  createPendingPaymentEmailState,
} from '../convex/orders/email_delivery'

describe('pending payment email delivery helpers', () => {
  test('treats missing state as retryable', () => {
    expect(canAttemptPendingPaymentEmail(undefined, Date.now())).toBe(true)
  })

  test('creates a pending state with zero attempts', () => {
    expect(createPendingPaymentEmailState()).toEqual({
      status: 'pending',
      attempts: 0,
    })
  })

  test('does not retry while sending or after sent', () => {
    const now = Date.now()

    expect(
      canAttemptPendingPaymentEmail(
        {status: 'sending', attempts: 1, lastAttemptAt: now},
        now,
      ),
    ).toBe(false)

    expect(
      canAttemptPendingPaymentEmail(
        {status: 'sent', attempts: 1, sentAt: now},
        now,
      ),
    ).toBe(false)
  })

  test('applies retry backoff for failed sends', () => {
    const now = Date.now()

    expect(
      canAttemptPendingPaymentEmail(
        {
          status: 'failed',
          attempts: 1,
          lastAttemptAt: now - 60_000,
        },
        now,
      ),
    ).toBe(false)

    expect(
      canAttemptPendingPaymentEmail(
        {
          status: 'failed',
          attempts: 1,
          lastAttemptAt: now - 10 * 60_000,
        },
        now,
      ),
    ).toBe(true)
  })
})
