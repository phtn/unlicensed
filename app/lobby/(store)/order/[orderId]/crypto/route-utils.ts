export const isCryptoPaymentMethod = (paymentMethod: string): boolean =>
  paymentMethod === 'crypto_commerce' || paymentMethod === 'crypto_transfer'

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
  if (paymentMethod === 'crypto_commerce') {
    return `/lobby/order/${orderId}/crypto`
  }

  return `/lobby/order/${orderId}/send`
}

export const isPaymentCompleted = (status: string): boolean =>
  status === 'completed'
