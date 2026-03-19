import type {Doc} from '../../convex/_generated/dataModel'
import {resolveOrderPayableTotalCents} from '../checkout/processing-fee'

const isPayableTotalEmailMethod = (
  paymentMethod: Doc<'orders'>['payment']['method'],
) =>
  paymentMethod === 'crypto_commerce' ||
  paymentMethod === 'crypto_transfer' ||
  paymentMethod === 'cash_app'

export const resolvePaymentEmailAmountUsd = (
  order: Doc<'orders'>,
  fallbackAmountUsd?: number,
) => {
  if (isPayableTotalEmailMethod(order.payment.method)) {
    return (
      resolveOrderPayableTotalCents({
        paymentMethod: order.payment.method,
        totalCents: order.totalCents,
        processingFeeCents: order.processingFeeCents,
        totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
      }) / 100
    )
  }

  return fallbackAmountUsd ?? order.payment.usdValue ?? order.totalCents / 100
}
