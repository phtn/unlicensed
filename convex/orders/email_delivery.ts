import type {PaymentMethod, PaymentSuccessEmailState} from './d'

export function isPaymentSuccessEmailEligibleMethod(
  paymentMethod: PaymentMethod,
): boolean {
  return (
    paymentMethod === 'crypto_commerce' || paymentMethod === 'crypto_transfer'
  )
}

export const PAYMENT_SUCCESS_EMAIL_MAX_ATTEMPTS = 5
export const PAYMENT_SUCCESS_EMAIL_RETRY_DELAYS_MS = [
  0,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
] as const

export function canAttemptPaymentSuccessEmail(
  state: PaymentSuccessEmailState | undefined,
  now: number,
): boolean {
  if (!state) {
    return true
  }

  if (state.status === 'sent' || state.status === 'sending') {
    return false
  }

  if (state.attempts >= PAYMENT_SUCCESS_EMAIL_MAX_ATTEMPTS) {
    return false
  }

  if (!state.lastAttemptAt) {
    return true
  }

  const retryDelay =
    PAYMENT_SUCCESS_EMAIL_RETRY_DELAYS_MS[
      Math.min(state.attempts, PAYMENT_SUCCESS_EMAIL_RETRY_DELAYS_MS.length - 1)
    ] ?? 0

  return now - state.lastAttemptAt >= retryDelay
}

export function createPendingPaymentSuccessEmailState(): PaymentSuccessEmailState {
  return {
    status: 'pending',
    attempts: 0,
  }
}
