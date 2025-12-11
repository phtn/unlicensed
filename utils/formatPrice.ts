export const formatPrice = (priceCents: number, decimals = 2) => {
  const dollars = priceCents / 100
  const format = {
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }
  return `${dollars.toLocaleString('en-US', format)}`
}
