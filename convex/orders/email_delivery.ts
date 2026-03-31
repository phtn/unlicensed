import type {
  PaymentMethod,
  PaymentSuccessEmailState,
  PendingPaymentEmailState,
} from './d'

type OrderEmailState = PaymentSuccessEmailState | PendingPaymentEmailState

export function isPaymentSuccessEmailEligibleMethod(
  paymentMethod: PaymentMethod,
): boolean {
  return (
    paymentMethod === 'crypto_commerce' ||
    paymentMethod === 'crypto_transfer' ||
    paymentMethod === 'cash_app'
  )
}

export const EMAIL_DELIVERY_MAX_ATTEMPTS = 5
export const EMAIL_DELIVERY_RETRY_DELAYS_MS = [
  0,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
] as const

export const PAYMENT_SUCCESS_EMAIL_MAX_ATTEMPTS = EMAIL_DELIVERY_MAX_ATTEMPTS

export function canAttemptEmailDelivery(
  state: OrderEmailState | undefined,
  now: number,
): boolean {
  if (!state) {
    return true
  }

  if (state.status === 'sent' || state.status === 'sending') {
    return false
  }

  if (state.attempts >= EMAIL_DELIVERY_MAX_ATTEMPTS) {
    return false
  }

  if (!state.lastAttemptAt) {
    return true
  }

  const retryDelay =
    EMAIL_DELIVERY_RETRY_DELAYS_MS[
      Math.min(state.attempts, EMAIL_DELIVERY_RETRY_DELAYS_MS.length - 1)
    ] ?? 0

  return now - state.lastAttemptAt >= retryDelay
}

export function createPendingEmailDeliveryState(): OrderEmailState {
  return {
    status: 'pending',
    attempts: 0,
  }
}

export function canAttemptPaymentSuccessEmail(
  state: PaymentSuccessEmailState | undefined,
  now: number,
): boolean {
  return canAttemptEmailDelivery(state, now)
}

export function createPendingPaymentSuccessEmailState(): PaymentSuccessEmailState {
  return createPendingEmailDeliveryState()
}

export function shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing({
  enteredOrderProcessing,
  hasCompletedCashAppPayment,
  paymentMethod,
  paymentSuccessEmail,
}: {
  enteredOrderProcessing: boolean
  hasCompletedCashAppPayment: boolean
  paymentMethod: PaymentMethod
  paymentSuccessEmail: PaymentSuccessEmailState | undefined
}): boolean {
  return (
    enteredOrderProcessing &&
    paymentMethod === 'cash_app' &&
    hasCompletedCashAppPayment &&
    paymentSuccessEmail?.status !== 'sent'
  )
}

export function canAttemptPendingPaymentEmail(
  state: PendingPaymentEmailState | undefined,
  now: number,
): boolean {
  return canAttemptEmailDelivery(state, now)
}

export function createPendingPaymentEmailState(): PendingPaymentEmailState {
  return createPendingEmailDeliveryState()
}
