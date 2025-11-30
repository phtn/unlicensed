export const formatPrice = (priceCents: number, decimals = 2) => {
  const dollars = priceCents / 100
  return `${dollars.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals})}`
}
