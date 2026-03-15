import type { Doc } from '../../convex/_generated/dataModel'

const isCryptoPaymentMethod = (paymentMethod: Doc<'orders'>['payment']['method']) =>
  paymentMethod === 'crypto_commerce' || paymentMethod === 'crypto_transfer'

export const resolvePaymentEmailAmountUsd = (
  order: Doc<'orders'>,
  fallbackAmountUsd?: number,
) => {
  if (isCryptoPaymentMethod(order.payment.method)) {
    return (order.totalWithCryptoFeeCents ?? order.totalCents) / 100
  }

  return fallbackAmountUsd ?? order.payment.usdValue ?? order.totalCents / 100
}
