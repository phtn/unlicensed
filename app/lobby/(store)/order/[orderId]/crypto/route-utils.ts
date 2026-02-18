export const isCryptoPaymentMethod = (paymentMethod: string): boolean =>
  paymentMethod === 'crypto_commerce' ||
  paymentMethod === 'crypto_transfer' ||
  paymentMethod === 'crypto-payment'

export const getCryptoFallbackHref = (
  orderId: string,
  paymentMethod: string,
): string => {
  if (paymentMethod === 'cards') {
    return `/lobby/order/${orderId}/cards`
  }

  if (paymentMethod === 'cash_app') {
    return `/lobby/order/${orderId}/cashapp`
  }

  return `/lobby/order/${orderId}/crypto`
}

export const isPaymentCompleted = (status: string): boolean =>
  status === 'completed'
