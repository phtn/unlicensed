import {describe, expect, test} from 'bun:test'
import {
  canAttemptPaymentSuccessEmail,
  createPendingPaymentSuccessEmailState,
  isPaymentSuccessEmailEligibleMethod,
  PAYMENT_SUCCESS_EMAIL_MAX_ATTEMPTS,
  shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing,
} from '../convex/orders/email_delivery'

describe('payment success email delivery helpers', () => {
  test('accepts both crypto payment methods and cash app for payment success emails', () => {
    expect(isPaymentSuccessEmailEligibleMethod('crypto_commerce')).toBe(true)
    expect(isPaymentSuccessEmailEligibleMethod('crypto_transfer')).toBe(true)
    expect(isPaymentSuccessEmailEligibleMethod('cards')).toBe(false)
    expect(isPaymentSuccessEmailEligibleMethod('cash_app')).toBe(true)
  })

  test('treats missing state as retryable', () => {
    expect(canAttemptPaymentSuccessEmail(undefined, Date.now())).toBe(true)
  })

  test('creates a pending state with zero attempts', () => {
    expect(createPendingPaymentSuccessEmailState()).toEqual({
      status: 'pending',
      attempts: 0,
    })
  })

  test('does not retry while sending or after sent', () => {
    const now = Date.now()

    expect(
      canAttemptPaymentSuccessEmail(
        {status: 'sending', attempts: 1, lastAttemptAt: now},
        now,
      ),
    ).toBe(false)

    expect(
      canAttemptPaymentSuccessEmail(
        {status: 'sent', attempts: 1, sentAt: now},
        now,
      ),
    ).toBe(false)
  })

  test('applies retry backoff for failed sends', () => {
    const now = Date.now()

    expect(
      canAttemptPaymentSuccessEmail(
        {
          status: 'failed',
          attempts: 1,
          lastAttemptAt: now - 60_000,
        },
        now,
      ),
    ).toBe(false)

    expect(
      canAttemptPaymentSuccessEmail(
        {
          status: 'failed',
          attempts: 1,
          lastAttemptAt: now - 10 * 60_000,
        },
        now,
      ),
    ).toBe(true)
  })

  test('stops retrying after max attempts', () => {
    expect(
      canAttemptPaymentSuccessEmail(
        {
          status: 'failed',
          attempts: PAYMENT_SUCCESS_EMAIL_MAX_ATTEMPTS,
          lastAttemptAt: Date.now() - 10 * 60 * 60 * 1000,
        },
        Date.now(),
      ),
    ).toBe(false)
  })

  test('queues cash app payment success email when order enters processing with a completed payment', () => {
    expect(
      shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing({
        enteredOrderProcessing: true,
        hasCompletedCashAppPayment: true,
        paymentMethod: 'cash_app',
        paymentSuccessEmail: undefined,
      }),
    ).toBe(true)
  })

  test('does not queue cash app payment success email once it has already been sent', () => {
    expect(
      shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing({
        enteredOrderProcessing: true,
        hasCompletedCashAppPayment: true,
        paymentMethod: 'cash_app',
        paymentSuccessEmail: {
          status: 'sent',
          attempts: 1,
          sentAt: Date.now(),
        },
      }),
    ).toBe(false)
  })
})
